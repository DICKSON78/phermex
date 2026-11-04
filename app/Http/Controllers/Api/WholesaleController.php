<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WholesaleController extends Controller
{
    /**
     * Get wholesale products (drugs)
     */
    public function products(Request $request): JsonResponse
    {
        try {
            $pharmacy = $request->user()->currentPharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found'], 404);
            }

            $query = Drug::where('pharmacy_id', $pharmacy->id)
                ->where('is_wholesale_available', true);

            // Filter by category
            if ($request->filled('category')) {
                $query->where('category', $request->input('category'));
            }

            // Search by name or SKU
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            }

            $products = $query->paginate(15);

            $productsWithWholesale = $products->map(function ($drug) {
                return [
                    'id' => $drug->id,
                    'name' => $drug->name,
                    'sku' => $drug->sku,
                    'description' => $drug->description,
                    'retail_price' => (float) $drug->selling_price,
                    'wholesale_price' => (float) $drug->wholesale_price,
                    'wholesale_min_qty' => (float) $drug->wholesale_quantity_min,
                    'savings' => $this->calculateSavings($drug->selling_price, $drug->wholesale_price),
                    'savings_percent' => $this->calculateSavingsPercent($drug->selling_price, $drug->wholesale_price),
                    'stock' => $drug->quantity ?? 0,
                ];
            });

            return response()->json([
                'data' => $productsWithWholesale,
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'total' => $products->total(),
                    'per_page' => $products->perPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch wholesale products'], 500);
        }
    }

    /**
     * Get pricing comparison (retail vs wholesale)
     */
    public function pricingComparison(Request $request): JsonResponse
    {
        try {
            $pharmacy = $request->user()->currentPharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found'], 404);
            }

            // Get total retail sales value
            $retailSalesValue = Order::where('pharmacy_id', $pharmacy->id)
                ->where('order_type', 'retail')
                ->where('payment_status', 'completed')
                ->sum('total');

            // Get total wholesale sales value
            $wholesaleSalesValue = Order::where('pharmacy_id', $pharmacy->id)
                ->where('order_type', 'wholesale')
                ->where('payment_status', 'completed')
                ->sum('total');

            // Get count of each type
            $retailCount = Order::where('pharmacy_id', $pharmacy->id)
                ->where('order_type', 'retail')
                ->count();

            $wholesaleCount = Order::where('pharmacy_id', $pharmacy->id)
                ->where('order_type', 'wholesale')
                ->count();

            return response()->json([
                'retail' => [
                    'total_sales' => (float) $retailSalesValue,
                    'order_count' => $retailCount,
                    'average_order_value' => $retailCount > 0 ? $retailSalesValue / $retailCount : 0,
                ],
                'wholesale' => [
                    'total_sales' => (float) $wholesaleSalesValue,
                    'order_count' => $wholesaleCount,
                    'average_order_value' => $wholesaleCount > 0 ? $wholesaleSalesValue / $wholesaleCount : 0,
                ],
                'summary' => [
                    'total_combined_sales' => (float) ($retailSalesValue + $wholesaleSalesValue),
                    'retail_percentage' => $retailSalesValue + $wholesaleSalesValue > 0
                        ? round(($retailSalesValue / ($retailSalesValue + $wholesaleSalesValue)) * 100, 2)
                        : 0,
                    'wholesale_percentage' => $retailSalesValue + $wholesaleSalesValue > 0
                        ? round(($wholesaleSalesValue / ($retailSalesValue + $wholesaleSalesValue)) * 100, 2)
                        : 0,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get pricing comparison'], 500);
        }
    }

    /**
     * Create wholesale order
     */
    public function createOrder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'required|string|max:20',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|integer|exists:drugs,id',
                'items.*.quantity' => 'required|numeric|min:0.01',
                'delivery_address' => 'required|string|max:500',
                'notes' => 'nullable|string|max:1000',
            ]);

            $pharmacy = $request->user()->currentPharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found'], 404);
            }

            $subtotal = 0;
            $orderItems = [];

            // Validate items and calculate total
            foreach ($validated['items'] as $item) {
                $drug = Drug::where('id', $item['drug_id'])
                    ->where('pharmacy_id', $pharmacy->id)
                    ->where('is_wholesale_available', true)
                    ->firstOrFail();

                // Validate minimum quantity
                if ($item['quantity'] < $drug->wholesale_quantity_min) {
                    return response()->json([
                        'message' => "Minimum wholesale quantity for {$drug->name} is {$drug->wholesale_quantity_min}",
                    ], 422);
                }

                $itemTotal = $item['quantity'] * $drug->wholesale_price;
                $subtotal += $itemTotal;

                $orderItems[] = [
                    'drug_id' => $drug->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => (float) $drug->wholesale_price,
                    'total' => $itemTotal,
                ];
            }

            // Create order
            $order = Order::create([
                'pharmacy_id' => $pharmacy->id,
                'order_code' => 'WHL-' . strtoupper(uniqid()),
                'order_type' => 'wholesale',
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total' => $subtotal,
                'payment_method' => 'pending',
                'payment_status' => 'pending',
                'order_status' => 'pending',
                'delivery_address' => $validated['delivery_address'],
                'delivery_phone' => $validated['customer_phone'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Store order items (if using order_items table)
            // foreach ($orderItems as $item) {
            //     OrderItem::create(array_merge(['order_id' => $order->id], $item));
            // }

            return response()->json([
                'message' => 'Wholesale order created successfully',
                'order' => [
                    'id' => $order->id,
                    'code' => $order->order_code,
                    'type' => 'wholesale',
                    'subtotal' => (float) $order->subtotal,
                    'total' => (float) $order->total,
                    'status' => $order->order_status,
                    'items' => $orderItems,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create wholesale order'], 500);
        }
    }

    /**
     * Toggle sales visibility for pharmacy
     */
    public function toggleSalesVisibility(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'show_retail_sales' => 'sometimes|boolean',
                'show_wholesale_sales' => 'sometimes|boolean',
            ]);

            $pharmacy = $request->user()->currentPharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found'], 404);
            }

            $updateData = [];

            if (isset($validated['show_retail_sales'])) {
                $updateData['show_retail_sales'] = $validated['show_retail_sales'];
            }

            if (isset($validated['show_wholesale_sales'])) {
                $updateData['show_wholesale_sales'] = $validated['show_wholesale_sales'];
            }

            if (!empty($updateData)) {
                $pharmacy->update($updateData);
            }

            return response()->json([
                'message' => 'Sales visibility updated',
                'settings' => [
                    'show_retail_sales' => (bool) $pharmacy->show_retail_sales,
                    'show_wholesale_sales' => (bool) $pharmacy->show_wholesale_sales,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update sales visibility'], 500);
        }
    }

    /**
     * Calculate savings between retail and wholesale
     */
    private function calculateSavings($retailPrice, $wholesalePrice): float
    {
        return max(0, (float) $retailPrice - (float) $wholesalePrice);
    }

    /**
     * Calculate savings percentage
     */
    private function calculateSavingsPercent($retailPrice, $wholesalePrice): float
    {
        $retailPrice = (float) $retailPrice;
        $wholesalePrice = (float) $wholesalePrice;

        if ($retailPrice == 0) {
            return 0;
        }

        return round((($retailPrice - $wholesalePrice) / $retailPrice) * 100, 2);
    }
}
