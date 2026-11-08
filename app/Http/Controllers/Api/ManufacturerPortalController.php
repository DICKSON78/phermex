<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManufacturerCampaign;
use App\Models\ManufacturerIntegration;
use App\Models\ManufacturerProduct;
use App\Models\ManufacturerRecall;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Portal for manufacturer accounts.
 *
 * A manufacturer is a role of its own (not a pharmacy owner). It owns a
 * product catalogue and recall register that are scoped to the signed in
 * user, so no pharmacy_id is required.
 */
class ManufacturerPortalController extends Controller
{
    private function manufacturerName(Request $request): string
    {
        $user = $request->user();

        return $user->manufacturer_name ?: $user->name;
    }

    private function products(Request $request)
    {
        return ManufacturerProduct::where('user_id', $request->user()->id);
    }

    private function recalls(Request $request)
    {
        return ManufacturerRecall::where('user_id', $request->user()->id);
    }

    private function campaigns(Request $request)
    {
        return ManufacturerCampaign::where('user_id', $request->user()->id);
    }

    private function integrations(Request $request)
    {
        return ManufacturerIntegration::where('user_id', $request->user()->id);
    }

    public function overview(Request $request): JsonResponse
    {
        $products = $this->products($request);

        $totalProducts = (clone $products)->count();
        $activeProducts = (clone $products)->where('status', 'active')->count();
        $lowStock = (clone $products)->whereColumn('quantity', '<=', 'reorder_level')->count();
        $outOfStock = (clone $products)->where('quantity', '<=', 0)->count();
        $totalStock = (int) (clone $products)->sum('quantity');
        $inventoryValue = (float) (clone $products)->sum(DB::raw('quantity * cost_price'));

        $openRecalls = $this->recalls($request)->whereIn('status', ['pending', 'in_progress'])->count();
        $totalRecalls = $this->recalls($request)->count();

        $user = $request->user();

        return response()->json([
            'manufacturer' => [
                'id' => $user->id,
                'name' => $user->name,
                'manufacturer_name' => $this->manufacturerName($request),
                'manufacturer_license' => $user->manufacturer_license,
                'manufacturer_address' => $user->manufacturer_address,
                'manufacturer_phone' => $user->manufacturer_phone,
                'manufacturer_email' => $user->manufacturer_email,
                'manufacturer_website' => $user->manufacturer_website,
                'manufacturer_logo' => $user->manufacturer_logo,
                'manufacturer_description' => $user->manufacturer_description,
            ],
            'stats' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
                'total_stock' => $totalStock,
                'inventory_value' => $inventoryValue,
                'open_recalls' => $openRecalls,
                'total_recalls' => $totalRecalls,
            ],
            'recent_products' => (clone $products)->latest()->take(5)->get(),
            'recent_recalls' => (clone $this->recalls($request))->latest()->take(5)->get(),
        ]);
    }

    public function drugsIndex(Request $request): JsonResponse
    {
        $query = $this->products($request);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('batch_number', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            if ($status === 'low_stock') {
                $query->whereColumn('quantity', '<=', 'reorder_level');
            } elseif ($status === 'out_of_stock') {
                $query->where('quantity', '<=', 0);
            } elseif (in_array($status, ['active', 'inactive'], true)) {
                $query->where('status', $status);
            }
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $products = $query->latest()->paginate($perPage);

        return response()->json([
            'products' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function drugsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'strength' => 'nullable|string|max:100',
            'dosage_form' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'nafdac_number' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'batch_number' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:2000',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'expiry_date' => 'nullable|date',
            'requires_prescription' => 'nullable|boolean',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $product = ManufacturerProduct::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Product added successfully.',
            'product' => $product,
        ], 201);
    }

    public function drugsShow(Request $request, int $id): JsonResponse
    {
        $product = $this->products($request)->findOrFail($id);

        return response()->json(['product' => $product]);
    }

    public function drugsUpdate(Request $request, int $id): JsonResponse
    {
        $product = $this->products($request)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'strength' => 'nullable|string|max:100',
            'dosage_form' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'nafdac_number' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'batch_number' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:2000',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'expiry_date' => 'nullable|date',
            'requires_prescription' => 'nullable|boolean',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->fresh(),
        ]);
    }

    public function drugsDestroy(Request $request, int $id): JsonResponse
    {
        $product = $this->products($request)->findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    public function inventoryIndex(Request $request): JsonResponse
    {
        $query = $this->products($request);

        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('batch_number', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'inventory' => $query->orderBy('name')->get(),
        ]);
    }

    public function inventoryUpdate(Request $request, int $id): JsonResponse
    {
        $product = $this->products($request)->findOrFail($id);

        $validated = $request->validate([
            'quantity' => 'sometimes|integer|min:0',
            'reorder_level' => 'sometimes|integer|min:0',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'wholesale_price' => 'sometimes|numeric|min:0',
            'batch_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Stock updated successfully.',
            'product' => $product->fresh(),
        ]);
    }

    public function recallsIndex(Request $request): JsonResponse
    {
        $query = $this->recalls($request)->with('product:id,name');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('recall_number', 'like', "%{$search}%")
                    ->orWhere('batch_numbers', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'recalls' => $query->latest()->get(),
        ]);
    }

    public function recallsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'nullable|integer',
            'recall_number' => 'required|string|max:100',
            'product_name' => 'required|string|max:255',
            'recall_reason' => ['required', Rule::in(['defective', 'contamination', 'labeling', 'efficacy', 'safety'])],
            'severity' => ['required', Rule::in(['class_i', 'class_ii', 'class_iii'])],
            'batch_numbers' => 'nullable|string|max:255',
            'date_issued' => 'required|date',
            'date_resolved' => 'nullable|date',
            'affected_quantity' => 'nullable|integer|min:0',
            'returned_quantity' => 'nullable|integer|min:0',
            'status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        if (! empty($validated['product_id'])) {
            $ownsProduct = $this->products($request)->whereKey($validated['product_id'])->exists();
            if (! $ownsProduct) {
                unset($validated['product_id']);
            }
        }

        $recall = ManufacturerRecall::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'pending',
        ]);

        return response()->json([
            'message' => 'Recall created successfully.',
            'recall' => $recall,
        ], 201);
    }

    public function recallsUpdate(Request $request, int $id): JsonResponse
    {
        $recall = $this->recalls($request)->findOrFail($id);

        $validated = $request->validate([
            'product_id' => 'nullable|integer',
            'recall_number' => 'sometimes|required|string|max:100',
            'product_name' => 'sometimes|required|string|max:255',
            'recall_reason' => ['sometimes', Rule::in(['defective', 'contamination', 'labeling', 'efficacy', 'safety'])],
            'severity' => ['sometimes', Rule::in(['class_i', 'class_ii', 'class_iii'])],
            'batch_numbers' => 'nullable|string|max:255',
            'date_issued' => 'sometimes|required|date',
            'date_resolved' => 'nullable|date',
            'affected_quantity' => 'nullable|integer|min:0',
            'returned_quantity' => 'nullable|integer|min:0',
            'status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        if (! empty($validated['product_id'])) {
            $ownsProduct = $this->products($request)->whereKey($validated['product_id'])->exists();
            if (! $ownsProduct) {
                unset($validated['product_id']);
            }
        }

        $recall->update($validated);

        return response()->json([
            'message' => 'Recall updated successfully.',
            'recall' => $recall->fresh(),
        ]);
    }

    public function recallsDestroy(Request $request, int $id): JsonResponse
    {
        $recall = $this->recalls($request)->findOrFail($id);
        $recall->delete();

        return response()->json(['message' => 'Recall deleted successfully.']);
    }

    public function profileShow(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'manufacturer_name' => $user->manufacturer_name,
                'manufacturer_license' => $user->manufacturer_license,
                'manufacturer_address' => $user->manufacturer_address,
                'manufacturer_phone' => $user->manufacturer_phone,
                'manufacturer_email' => $user->manufacturer_email,
                'manufacturer_website' => $user->manufacturer_website,
                'manufacturer_logo' => $user->manufacturer_logo,
                'manufacturer_description' => $user->manufacturer_description,
            ],
        ]);
    }

    public function profileUpdate(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email:rfc', 'max:254', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'regex:/^\+?[0-9]{9,13}$/'],
            'manufacturer_name' => 'sometimes|required|string|max:255',
            'manufacturer_license' => 'nullable|string|max:100',
            'manufacturer_address' => 'nullable|string|max:255',
            'manufacturer_phone' => 'nullable|string|max:50',
            'manufacturer_email' => 'nullable|email|max:254',
            'manufacturer_website' => 'nullable|string|max:255',
            'manufacturer_logo' => 'nullable|string|max:255',
            'manufacturer_description' => 'nullable|string|max:2000',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Manufacturer profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    // ---------------------------------------------------------------------
    // Analytics helpers
    // ---------------------------------------------------------------------

    protected function scopedManufacturerName(Request $request): string
    {
        return mb_strtolower($this->manufacturerName($request));
    }

    protected function range(Request $request): array
    {
        $to = $request->query('to')
            ? Carbon::parse($request->query('to'))->endOfDay()
            : now()->endOfDay();

        $from = $request->query('from')
            ? Carbon::parse($request->query('from'))->startOfDay()
            : $to->copy()->subMonthsNoOverflow(5)->startOfMonth();

        if ($from->gt($to)) {
            $from = $to->copy()->subMonthsNoOverflow(5)->startOfMonth();
        }

        return [$from, $to];
    }

    protected function previousRange(Carbon $from, Carbon $to): array
    {
        $days = max(1, $from->diffInDays($to) + 1);
        $prevTo = $from->copy()->subDay()->endOfDay();
        $prevFrom = $prevTo->copy()->subDays($days - 1)->startOfDay();

        return [$prevFrom, $prevTo];
    }

    protected function salesRows(Request $request, Carbon $from, Carbon $to): Collection
    {
        return DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->join('drugs as d', 'd.id', '=', 'oi.drug_id')
            ->join('pharmacies as p', 'p.id', '=', 'o.pharmacy_id')
            ->whereRaw('LOWER(d.manufacturer) = ?', [$this->scopedManufacturerName($request)])
            ->where('o.order_status', '!=', 'cancelled')
            ->whereBetween('o.created_at', [$from, $to])
            ->select([
                'oi.order_id',
                'oi.drug_id',
                'oi.quantity',
                'oi.total_price',
                'd.name as drug_name',
                'd.generic_name',
                'd.category_id',
                'd.manufacturer',
                'o.created_at',
                'o.updated_at',
                'o.order_status',
                'o.pharmacy_id',
                'p.pharmacy_name',
                'p.region',
                'p.district',
            ])
            ->get();
    }

    protected function marketDrugs(Request $request): Collection
    {
        return DB::table('drugs')
            ->whereNull('deleted_at')
            ->whereRaw('LOWER(manufacturer) = ?', [$this->scopedManufacturerName($request)])
            ->get();
    }

    protected function growth(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    protected function monthlySeries(Collection $rows, Carbon $from, Carbon $to): array
    {
        $buckets = [];
        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');
            $buckets[$key] = [
                'key' => $key,
                'month' => $cursor->format('M Y'),
                'units' => 0,
                'revenue' => 0.0,
                'order_ids' => [],
            ];
            $cursor->addMonthNoOverflow();
        }

        foreach ($rows as $row) {
            $key = Carbon::parse($row->created_at)->format('Y-m');
            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['units'] += (int) $row->quantity;
            $buckets[$key]['revenue'] += (float) $row->total_price;
            $buckets[$key]['order_ids'][$row->order_id] = true;
        }

        return array_values(array_map(static function (array $bucket) {
            return [
                'key' => $bucket['key'],
                'month' => $bucket['month'],
                'units' => $bucket['units'],
                'revenue' => round($bucket['revenue'], 2),
                'orders' => count($bucket['order_ids']),
            ];
        }, $buckets));
    }

    protected function futureMonthLabels(int $horizon): array
    {
        $labels = [];
        $cursor = now()->startOfMonth()->addMonthNoOverflow();

        for ($i = 0; $i < $horizon; $i++) {
            $labels[] = $cursor->format('M Y');
            $cursor->addMonthNoOverflow();
        }

        return $labels;
    }

    protected function forecastValues(array $actual, int $horizon): array
    {
        $n = count($actual);

        if ($n === 0) {
            return ['values' => array_fill(0, $horizon, 0.0), 'confidence' => 40, 'slope' => 0.0];
        }

        $sumX = $sumY = $sumXY = $sumXX = 0.0;

        foreach ($actual as $i => $y) {
            $x = $i + 1;
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumXX += $x * $x;
        }

        $den = ($n * $sumXX) - ($sumX * $sumX);
        $slope = $den != 0.0 ? (($n * $sumXY) - ($sumX * $sumY)) / $den : 0.0;
        $intercept = ($sumY - ($slope * $sumX)) / $n;

        $mean = $sumY / $n;
        $ssTot = $ssRes = 0.0;

        foreach ($actual as $i => $y) {
            $predicted = $intercept + ($slope * ($i + 1));
            $ssTot += ($y - $mean) ** 2;
            $ssRes += ($y - $predicted) ** 2;
        }

        $r2 = $ssTot > 0 ? max(0.0, min(1.0, 1 - ($ssRes / $ssTot))) : 0.0;

        $values = [];
        for ($i = 1; $i <= $horizon; $i++) {
            $values[] = max(0.0, round($intercept + ($slope * ($n + $i)), 1));
        }

        return [
            'values' => $values,
            'confidence' => (int) round(40 + ($r2 * 55)),
            'slope' => round($slope, 2),
        ];
    }

    // ---------------------------------------------------------------------
    // INTELLIGENCE
    // ---------------------------------------------------------------------

    public function productIntelligence(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        [$prevFrom, $prevTo] = $this->previousRange($from, $to);

        $rows = $this->salesRows($request, $from, $to);
        $previousRows = $this->salesRows($request, $prevFrom, $prevTo);
        $drugs = $this->marketDrugs($request);
        $products = $this->products($request)->orderBy('name')->get();

        $salesByName = $rows->groupBy(fn ($row) => mb_strtolower($row->drug_name));
        $previousByName = $previousRows->groupBy(fn ($row) => mb_strtolower($row->drug_name));
        $drugsByName = $drugs->groupBy(fn ($drug) => mb_strtolower($drug->name));

        $catalogue = $products->map(function ($product) use ($salesByName, $previousByName, $drugsByName) {
            $key = mb_strtolower($product->name);
            $sold = $salesByName->get($key, collect());
            $previous = $previousByName->get($key, collect());
            $market = $drugsByName->get($key, collect());
            $units = (int) $sold->sum('quantity');

            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'sku' => $product->sku,
                'status' => $product->status,
                'catalogue_stock' => (int) $product->quantity,
                'market_stock' => (int) $market->sum('quantity'),
                'pharmacies' => $market->pluck('pharmacy_id')->unique()->count(),
                'units_sold' => $units,
                'revenue' => round((float) $sold->sum('total_price'), 2),
                'avg_price' => $units > 0
                    ? round((float) $sold->sum('total_price') / $units, 2)
                    : (float) $product->selling_price,
                'growth' => $this->growth($units, (int) $previous->sum('quantity')),
            ];
        })->values();

        $byCategory = $catalogue
            ->groupBy(fn ($product) => $product['category'] ?: 'Uncategorised')
            ->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'products' => $items->count(),
                    'units_sold' => $items->sum('units_sold'),
                    'revenue' => round($items->sum('revenue'), 2),
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        $totalUnits = (int) $rows->sum('quantity');

        return response()->json([
            'summary' => [
                'catalogue_products' => $products->count(),
                'marketed_products' => $rows->pluck('drug_name')->unique()->count(),
                'units_sold' => $totalUnits,
                'revenue' => round((float) $rows->sum('total_price'), 2),
                'pharmacy_reach' => $drugs->pluck('pharmacy_id')->unique()->count(),
                'avg_price' => $totalUnits > 0
                    ? round((float) $rows->sum('total_price') / $totalUnits, 2)
                    : 0,
            ],
            'products' => $catalogue,
            'by_category' => $byCategory,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function marketDemand(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $rows = $this->salesRows($request, $from, $to);
        $monthly = $this->monthlySeries($rows, $from, $to);

        $topProducts = $rows->groupBy('drug_name')->map(function ($items, $name) {
            return [
                'name' => $name,
                'units' => (int) $items->sum('quantity'),
                'revenue' => round((float) $items->sum('total_price'), 2),
                'orders' => $items->pluck('order_id')->unique()->count(),
            ];
        })->sortByDesc('units')->take(8)->values();

        $regions = $rows->groupBy(fn ($row) => $row->region ?: 'Unassigned')->map(function ($items, $region) {
            return [
                'region' => $region,
                'units' => (int) $items->sum('quantity'),
                'revenue' => round((float) $items->sum('total_price'), 2),
                'pharmacies' => $items->pluck('pharmacy_id')->unique()->count(),
            ];
        })->sortByDesc('units')->values();

        $last = $monthly[count($monthly) - 1] ?? ['units' => 0];
        $previous = $monthly[count($monthly) - 2] ?? ['units' => 0];
        $orderCount = $rows->pluck('order_id')->unique()->count();
        $peak = collect($monthly)->sortByDesc('units')->first();

        return response()->json([
            'summary' => [
                'units_sold' => (int) $rows->sum('quantity'),
                'revenue' => round((float) $rows->sum('total_price'), 2),
                'orders' => $orderCount,
                'avg_order_value' => $orderCount > 0
                    ? round((float) $rows->sum('total_price') / $orderCount, 2)
                    : 0,
                'growth' => $this->growth((float) $last['units'], (float) $previous['units']),
                'peak_month' => $peak['month'] ?? '—',
            ],
            'monthly' => $monthly,
            'top_products' => $topProducts,
            'by_region' => $regions,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function demandForecast(Request $request): JsonResponse
    {
        $horizon = max(1, min(12, (int) $request->query('horizon', 6)));
        $from = now()->subMonthsNoOverflow(11)->startOfMonth();
        $to = now()->endOfDay();

        $rows = $this->salesRows($request, $from, $to);
        $history = $this->monthlySeries($rows, $from, $to);
        $actual = array_map(fn ($month) => $month['units'], $history);
        $forecast = $this->forecastValues($actual, $horizon);
        $labels = $this->futureMonthLabels($horizon);

        $forecastRows = collect($labels)->map(fn ($label, $index) => [
            'month' => $label,
            'forecast' => (int) round($forecast['values'][$index] ?? 0),
        ])->values();

        $topNames = $rows->groupBy('drug_name')
            ->sortByDesc(fn ($items) => $items->sum('quantity'))
            ->take(6)
            ->keys();

        $productForecasts = $topNames->map(function ($name) use ($rows, $from, $to, $horizon, $labels) {
            $productRows = $rows->filter(fn ($row) => $row->drug_name === $name);
            $series = $this->monthlySeries($productRows, $from, $to);
            $values = array_map(fn ($month) => $month['units'], $series);
            $productForecast = $this->forecastValues($values, $horizon);
            $average = count($values) > 0 ? array_sum($values) / count($values) : 0;

            return [
                'name' => $name,
                'avg_monthly' => (int) round($average),
                'trend' => $productForecast['slope'] > 0 ? 'up' : ($productForecast['slope'] < 0 ? 'down' : 'flat'),
                'confidence' => $productForecast['confidence'],
                'next_month' => (int) round($productForecast['values'][0] ?? 0),
                'forecast' => collect($labels)->map(fn ($label, $index) => [
                    'month' => $label,
                    'units' => (int) round($productForecast['values'][$index] ?? 0),
                ])->values(),
            ];
        })->values();

        $lastActual = $actual[count($actual) - 1] ?? 0;
        $nextMonth = $forecast['values'][0] ?? 0;

        return response()->json([
            'summary' => [
                'next_month_units' => (int) round($nextMonth),
                'expected_growth' => $this->growth((float) $nextMonth, (float) $lastActual),
                'confidence' => $forecast['confidence'],
                'method' => 'Linear trend on the last 12 months of sales',
                'horizon' => $horizon,
                'history_months' => count($history),
            ],
            'history' => $history,
            'forecast' => $forecastRows,
            'products' => $productForecasts,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function geographicConsumption(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        [$prevFrom, $prevTo] = $this->previousRange($from, $to);
        $rows = $this->salesRows($request, $from, $to);
        $previousRows = $this->salesRows($request, $prevFrom, $prevTo);
        $previousByRegion = $previousRows->groupBy(fn ($row) => $row->region ?: 'Unassigned');
        $totalUnits = max(1, (int) $rows->sum('quantity'));

        $regions = $rows->groupBy(fn ($row) => $row->region ?: 'Unassigned')->map(function ($items, $region) use ($totalUnits, $previousByRegion) {
            $units = (int) $items->sum('quantity');
            $previousUnits = (int) ($previousByRegion->get($region, collect())->sum('quantity'));

            return [
                'region' => $region,
                'units' => $units,
                'revenue' => round((float) $items->sum('total_price'), 2),
                'orders' => $items->pluck('order_id')->unique()->count(),
                'pharmacies' => $items->pluck('pharmacy_id')->unique()->count(),
                'share' => round(($units / $totalUnits) * 100, 1),
                'previous_units' => $previousUnits,
                'growth' => $this->growth($units, $previousUnits),
            ];
        })->sortByDesc('units')->values();

        $districts = $rows
            ->groupBy(fn ($row) => ($row->region ?: 'Unassigned').'|'.($row->district ?: 'Unassigned'))
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'region' => $first->region ?: 'Unassigned',
                    'district' => $first->district ?: 'Unassigned',
                    'units' => (int) $items->sum('quantity'),
                    'revenue' => round((float) $items->sum('total_price'), 2),
                    'pharmacies' => $items->pluck('pharmacy_id')->unique()->count(),
                ];
            })
            ->sortByDesc('units')
            ->take(15)
            ->values();

        $top = $regions->first();

        return response()->json([
            'summary' => [
                'regions' => $regions->count(),
                'districts' => $rows->pluck('district')->filter()->unique()->count(),
                'top_region' => $top['region'] ?? '—',
                'top_region_share' => $top['share'] ?? 0,
                'pharmacies' => $rows->pluck('pharmacy_id')->unique()->count(),
                'units_sold' => (int) $rows->sum('quantity'),
            ],
            'regions' => $regions,
            'districts' => $districts,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function pharmacyPenetration(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $rows = $this->salesRows($request, $from, $to);
        $marketDrugs = $this->marketDrugs($request);

        $penetratedIds = $rows->pluck('pharmacy_id')
            ->merge($marketDrugs->pluck('pharmacy_id'))
            ->unique()
            ->filter()
            ->values();

        $totalPharmacies = DB::table('pharmacies')
            ->whereNull('deleted_at')
            ->where('status', 'active')
            ->count();

        $pharmacies = DB::table('pharmacies')
            ->whereNull('deleted_at')
            ->whereIn('id', $penetratedIds->all())
            ->get();

        $salesByPharmacy = $rows->groupBy('pharmacy_id');
        $stockByPharmacy = $marketDrugs->groupBy('pharmacy_id');

        $list = $pharmacies->map(function ($pharmacy) use ($salesByPharmacy, $stockByPharmacy) {
            $sold = $salesByPharmacy->get($pharmacy->id, collect());
            $stock = $stockByPharmacy->get($pharmacy->id, collect());
            $lastOrder = $sold->sortByDesc('created_at')->first();

            return [
                'id' => $pharmacy->id,
                'name' => $pharmacy->pharmacy_name,
                'region' => $pharmacy->region,
                'district' => $pharmacy->district,
                'status' => $pharmacy->status,
                'units' => (int) $sold->sum('quantity'),
                'revenue' => round((float) $sold->sum('total_price'), 2),
                'stock' => (int) $stock->sum('quantity'),
                'products' => $stock->count(),
                'last_order' => $lastOrder->created_at ?? null,
            ];
        })->sortByDesc('revenue')->values();

        $allRegions = DB::table('pharmacies')
            ->whereNull('deleted_at')
            ->where('status', 'active')
            ->select('region', DB::raw('COUNT(*) as total'))
            ->groupBy('region')
            ->get();

        $penetratedByRegion = $pharmacies
            ->groupBy(fn ($pharmacy) => $pharmacy->region ?: 'Unassigned')
            ->map(fn ($items) => $items->count());

        $regions = $allRegions->map(function ($row) use ($penetratedByRegion) {
            $region = $row->region ?: 'Unassigned';
            $penetrated = (int) ($penetratedByRegion[$region] ?? 0);
            $total = (int) $row->total;

            return [
                'region' => $region,
                'total' => $total,
                'penetrated' => $penetrated,
                'rate' => $total > 0 ? round(($penetrated / $total) * 100, 1) : 0,
            ];
        })->sortByDesc('rate')->values();

        $penetratedCount = $penetratedIds->count();

        return response()->json([
            'summary' => [
                'total_pharmacies' => $totalPharmacies,
                'penetrated' => $penetratedCount,
                'not_penetrated' => max(0, $totalPharmacies - $penetratedCount),
                'penetration_rate' => $totalPharmacies > 0
                    ? round(($penetratedCount / $totalPharmacies) * 100, 1)
                    : 0,
                'avg_units_per_pharmacy' => $penetratedCount > 0
                    ? round((float) $rows->sum('quantity') / $penetratedCount)
                    : 0,
                'active_products' => $marketDrugs->pluck('name')->unique()->count(),
            ],
            'regions' => $regions,
            'pharmacies' => $list,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    // ---------------------------------------------------------------------
    // ANALYTICS
    // ---------------------------------------------------------------------

    public function productPerformance(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        [$prevFrom, $prevTo] = $this->previousRange($from, $to);

        $rows = $this->salesRows($request, $from, $to);
        $previousRows = $this->salesRows($request, $prevFrom, $prevTo);
        $stockByName = $this->marketDrugs($request)->groupBy(fn ($drug) => mb_strtolower($drug->name));
        $previousByName = $previousRows->groupBy('drug_name');
        $totalRevenue = max(1, (float) $rows->sum('total_price'));

        $products = $rows->groupBy('drug_name')->map(function ($items, $name) use ($previousByName, $stockByName, $totalRevenue) {
            $units = (int) $items->sum('quantity');
            $revenue = (float) $items->sum('total_price');
            $previous = $previousByName->get($name, collect());
            $stock = $stockByName->get(mb_strtolower($name), collect());

            return [
                'name' => $name,
                'units' => $units,
                'revenue' => round($revenue, 2),
                'orders' => $items->pluck('order_id')->unique()->count(),
                'avg_price' => $units > 0 ? round($revenue / $units, 2) : 0,
                'growth' => $this->growth($units, (int) $previous->sum('quantity')),
                'share' => round(($revenue / $totalRevenue) * 100, 1),
                'stock' => (int) $stock->sum('quantity'),
                'pharmacies' => $items->pluck('pharmacy_id')->unique()->count(),
            ];
        })->sortByDesc('revenue')->values();

        $orderCount = $rows->pluck('order_id')->unique()->count();
        $currentUnits = (int) $rows->sum('quantity');
        $previousUnits = (int) $previousRows->sum('quantity');

        return response()->json([
            'summary' => [
                'revenue' => round((float) $rows->sum('total_price'), 2),
                'units' => $currentUnits,
                'orders' => $orderCount,
                'avg_order_value' => $orderCount > 0
                    ? round((float) $rows->sum('total_price') / $orderCount, 2)
                    : 0,
                'growth' => $this->growth($currentUnits, $previousUnits),
                'best_product' => $products->first()['name'] ?? '—',
            ],
            'products' => $products,
            'monthly' => $this->monthlySeries($rows, $from, $to),
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'previous_from' => $prevFrom->toDateString(),
                'previous_to' => $prevTo->toDateString(),
            ],
        ]);
    }

    public function competitorAnalysis(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $ownRows = $this->salesRows($request, $from, $to);
        $categoryIds = $this->marketDrugs($request)->pluck('category_id')->filter()->unique()->values();

        $competitorRows = collect();

        if ($categoryIds->isNotEmpty()) {
            $competitorRows = DB::table('order_items as oi')
                ->join('orders as o', 'o.id', '=', 'oi.order_id')
                ->join('drugs as d', 'd.id', '=', 'oi.drug_id')
                ->whereIn('d.category_id', $categoryIds->all())
                ->whereRaw('LOWER(d.manufacturer) != ?', [$this->scopedManufacturerName($request)])
                ->whereNotNull('d.manufacturer')
                ->where('o.order_status', '!=', 'cancelled')
                ->whereBetween('o.created_at', [$from, $to])
                ->select([
                    'oi.order_id',
                    'oi.quantity',
                    'oi.total_price',
                    'd.name as drug_name',
                    'd.manufacturer',
                ])
                ->get();
        }

        $ownRevenue = (float) $ownRows->sum('total_price');
        $competitorRevenue = (float) $competitorRows->sum('total_price');
        $marketRevenue = max(0.01, $ownRevenue + $competitorRevenue);

        $manufacturers = $competitorRows->groupBy('manufacturer')->map(function ($items, $name) use ($marketRevenue) {
            $revenue = (float) $items->sum('total_price');

            return [
                'name' => $name,
                'units' => (int) $items->sum('quantity'),
                'revenue' => round($revenue, 2),
                'share' => round(($revenue / $marketRevenue) * 100, 1),
                'products' => $items->pluck('drug_name')->unique()->count(),
                'is_own' => false,
            ];
        })->values()->push([
            'name' => $this->manufacturerName($request),
            'units' => (int) $ownRows->sum('quantity'),
            'revenue' => round($ownRevenue, 2),
            'share' => round(($ownRevenue / $marketRevenue) * 100, 1),
            'products' => $ownRows->pluck('drug_name')->unique()->count(),
            'is_own' => true,
        ])->sortByDesc('revenue')->values()->map(function ($row, $index) {
            $row['rank'] = $index + 1;

            return $row;
        });

        $products = $ownRows->map(fn ($row) => [
            'name' => $row->drug_name,
            'manufacturer' => $row->manufacturer,
            'units' => (int) $row->quantity,
            'revenue' => round((float) $row->total_price, 2),
            'is_own' => true,
        ])->concat($competitorRows->map(fn ($row) => [
            'name' => $row->drug_name,
            'manufacturer' => $row->manufacturer,
            'units' => (int) $row->quantity,
            'revenue' => round((float) $row->total_price, 2),
            'is_own' => false,
        ]))->groupBy(fn ($row) => $row['manufacturer'].'|'.$row['name'])->map(function ($items) {
            $first = $items->first();

            return [
                'name' => $first['name'],
                'manufacturer' => $first['manufacturer'],
                'is_own' => $first['is_own'],
                'units' => $items->sum('units'),
                'revenue' => round($items->sum('revenue'), 2),
            ];
        })->sortByDesc('revenue')->take(12)->values();

        $ownRow = $manufacturers->firstWhere('is_own', true);
        $leadingCompetitor = $manufacturers->first(fn ($row) => ! $row['is_own']);

        return response()->json([
            'summary' => [
                'our_share' => $ownRow['share'] ?? 0,
                'our_revenue' => round($ownRevenue, 2),
                'market_revenue' => round($ownRevenue + $competitorRevenue, 2),
                'competitors' => max(0, $manufacturers->count() - 1),
                'leading_competitor' => $leadingCompetitor['name'] ?? '—',
                'our_rank' => $ownRow['rank'] ?? null,
                'total_manufacturers' => $manufacturers->count(),
            ],
            'manufacturers' => $manufacturers,
            'products' => $products,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function supplyChain(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $rows = $this->salesRows($request, $from, $to);
        $marketDrugs = $this->marketDrugs($request);
        $today = now()->startOfDay();

        $lowStock = $marketDrugs->filter(fn ($drug) => (int) $drug->quantity <= (int) $drug->reorder_level);
        $expired = $marketDrugs->filter(fn ($drug) => $drug->expiry_date && Carbon::parse($drug->expiry_date)->lt($today));
        $expiring = $marketDrugs->filter(function ($drug) use ($today) {
            if (! $drug->expiry_date) {
                return false;
            }

            $expiry = Carbon::parse($drug->expiry_date);

            return $expiry->gte($today) && $expiry->lte($today->copy()->addDays(90));
        });

        $salesByPharmacy = $rows->groupBy('pharmacy_id');
        $stockByPharmacy = $marketDrugs->groupBy('pharmacy_id');

        $byPharmacy = $stockByPharmacy->map(function ($items, $pharmacyId) use ($salesByPharmacy, $today) {
            $first = $items->first();
            $sold = $salesByPharmacy->get($pharmacyId, collect());

            return [
                'pharmacy_id' => $pharmacyId,
                'pharmacy' => $first->pharmacy_id ? DB::table('pharmacies')->where('id', $first->pharmacy_id)->value('pharmacy_name') : 'Unassigned',
                'region' => DB::table('pharmacies')->where('id', $first->pharmacy_id)->value('region'),
                'stock' => (int) $items->sum('quantity'),
                'low_stock' => $items->filter(fn ($drug) => (int) $drug->quantity <= (int) $drug->reorder_level)->count(),
                'expiring' => $items->filter(function ($drug) use ($today) {
                    if (! $drug->expiry_date) {
                        return false;
                    }
                    $expiry = Carbon::parse($drug->expiry_date);

                    return $expiry->gte($today) && $expiry->lte($today->copy()->addDays(90));
                })->count(),
                'units_sold' => (int) $sold->sum('quantity'),
                'revenue' => round((float) $sold->sum('total_price'), 2),
            ];
        })->sortByDesc('stock')->values();

        $orderIds = $rows->pluck('order_id')->unique();
        $orderCount = $orderIds->count();
        $completed = $rows->whereIn('order_status', ['dispensed', 'delivered'])->pluck('order_id')->unique();
        $pending = $rows->whereIn('order_status', ['pending', 'confirmed'])->pluck('order_id')->unique();

        $completedOrders = DB::table('orders')
            ->whereIn('id', $completed->all())
            ->select('id', 'created_at', 'updated_at')
            ->get();

        $avgFulfillmentDays = $completedOrders->avg(function ($order) {
            return Carbon::parse($order->created_at)->diffInHours(Carbon::parse($order->updated_at)) / 24;
        });

        $riskItems = $marketDrugs
            ->filter(function ($drug) use ($today) {
                $low = (int) $drug->quantity <= (int) $drug->reorder_level;
                $expiry = $drug->expiry_date ? Carbon::parse($drug->expiry_date) : null;
                $nearExpiry = $expiry && $expiry->lte($today->copy()->addDays(90));

                return $low || $nearExpiry;
            })
            ->map(function ($drug) use ($today) {
                $expiry = $drug->expiry_date ? Carbon::parse($drug->expiry_date) : null;

                return [
                    'name' => $drug->name,
                    'batch' => $drug->batch_number,
                    'pharmacy' => DB::table('pharmacies')->where('id', $drug->pharmacy_id)->value('pharmacy_name'),
                    'quantity' => (int) $drug->quantity,
                    'reorder_level' => (int) $drug->reorder_level,
                    'expiry_date' => $drug->expiry_date,
                    'days_to_expiry' => $expiry ? (int) $today->diffInDays($expiry, false) : null,
                    'risk' => $expiry && $expiry->lt($today) ? 'expired' : ($expiry && $expiry->lte($today->copy()->addDays(90)) ? 'expiring' : 'low_stock'),
                ];
            })
            ->sortBy('days_to_expiry')
            ->take(20)
            ->values();

        return response()->json([
            'summary' => [
                'total_stock' => (int) $marketDrugs->sum('quantity'),
                'stock_value' => round((float) $marketDrugs->sum(fn ($drug) => (float) $drug->buying_price * (int) $drug->quantity), 2),
                'low_stock' => $lowStock->count(),
                'expiring_soon' => $expiring->count(),
                'expired' => $expired->count(),
                'pending_orders' => $pending->count(),
                'fulfillment_rate' => $orderCount > 0 ? round(($completed->count() / $orderCount) * 100, 1) : 0,
                'avg_fulfillment_days' => round((float) ($avgFulfillmentDays ?? 0), 1),
                'pharmacies' => $marketDrugs->pluck('pharmacy_id')->unique()->count(),
            ],
            'by_pharmacy' => $byPharmacy,
            'monthly' => $this->monthlySeries($rows, $from, $to),
            'risk_items' => $riskItems,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        [$prevFrom, $prevTo] = $this->previousRange($from, $to);

        $rows = $this->salesRows($request, $from, $to);
        $previousRows = $this->salesRows($request, $prevFrom, $prevTo);
        $marketDrugs = $this->marketDrugs($request);
        $recalls = $this->recalls($request)->get();
        $campaigns = $this->campaigns($request)->get();

        $regions = $rows->groupBy(fn ($row) => $row->region ?: 'Unassigned');
        $topRegion = $regions->sortByDesc(fn ($items) => $items->sum('quantity'))->keys()->first();
        $today = now()->startOfDay();

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'cards' => [
                'sales' => [
                    'revenue' => round((float) $rows->sum('total_price'), 2),
                    'units' => (int) $rows->sum('quantity'),
                    'orders' => $rows->pluck('order_id')->unique()->count(),
                    'growth' => $this->growth((float) $rows->sum('quantity'), (float) $previousRows->sum('quantity')),
                ],
                'inventory' => [
                    'total_stock' => (int) $marketDrugs->sum('quantity'),
                    'value' => round((float) $marketDrugs->sum(fn ($drug) => (float) $drug->buying_price * (int) $drug->quantity), 2),
                    'low_stock' => $marketDrugs->filter(fn ($drug) => (int) $drug->quantity <= (int) $drug->reorder_level)->count(),
                    'expiring_soon' => $marketDrugs->filter(function ($drug) use ($today) {
                        if (! $drug->expiry_date) {
                            return false;
                        }
                        $expiry = Carbon::parse($drug->expiry_date);

                        return $expiry->gte($today) && $expiry->lte($today->copy()->addDays(90));
                    })->count(),
                ],
                'recalls' => [
                    'total' => $recalls->count(),
                    'open' => $recalls->whereIn('status', ['pending', 'in_progress'])->count(),
                    'affected_quantity' => (int) $recalls->sum('affected_quantity'),
                    'returned_quantity' => (int) $recalls->sum('returned_quantity'),
                ],
                'campaigns' => [
                    'total' => $campaigns->count(),
                    'active' => $campaigns->where('status', 'active')->count(),
                    'budget' => round((float) $campaigns->sum('budget'), 2),
                    'spend' => round((float) $campaigns->sum('spend'), 2),
                    'conversions' => (int) $campaigns->sum('conversions'),
                ],
                'geography' => [
                    'regions' => $regions->count(),
                    'top_region' => $topRegion ?: '—',
                    'pharmacies' => $rows->pluck('pharmacy_id')->unique()->count(),
                ],
            ],
            'available_reports' => [
                ['key' => 'sales', 'label' => 'Sales report', 'description' => 'Revenue, units and orders for the selected period.'],
                ['key' => 'performance', 'label' => 'Product performance report', 'description' => 'Revenue and growth per product.'],
                ['key' => 'inventory', 'label' => 'Inventory report', 'description' => 'Stock on hand by pharmacy and batch.'],
                ['key' => 'geography', 'label' => 'Geographic consumption report', 'description' => 'Units and revenue by region and district.'],
                ['key' => 'competitors', 'label' => 'Competitor report', 'description' => 'Manufacturer market share in your categories.'],
                ['key' => 'campaigns', 'label' => 'Campaign report', 'description' => 'Promotion spend, reach and conversions.'],
                ['key' => 'recalls', 'label' => 'Recall register', 'description' => 'All recalls with affected and returned units.'],
                ['key' => 'products', 'label' => 'Product catalogue', 'description' => 'Full catalogue with pricing and stock.'],
            ],
        ]);
    }

    // ---------------------------------------------------------------------
    // CAMPAIGNS
    // ---------------------------------------------------------------------

    public function campaignsIndex(Request $request): JsonResponse
    {
        $campaigns = $this->campaigns($request)->with('product:id,name')->latest()->get();

        return response()->json([
            'campaigns' => $campaigns,
            'products' => $this->products($request)->orderBy('name')->get(['id', 'name', 'selling_price']),
            'summary' => [
                'total' => $campaigns->count(),
                'active' => $campaigns->where('status', 'active')->count(),
                'budget' => round((float) $campaigns->sum('budget'), 2),
                'spend' => round((float) $campaigns->sum('spend'), 2),
                'conversions' => (int) $campaigns->sum('conversions'),
                'impressions' => (int) $campaigns->sum('impressions'),
                'conversion_rate' => $campaigns->sum('impressions') > 0
                    ? round(($campaigns->sum('conversions') / $campaigns->sum('impressions')) * 100, 2)
                    : 0,
                'cost_per_conversion' => $campaigns->sum('conversions') > 0
                    ? round($campaigns->sum('spend') / $campaigns->sum('conversions'), 2)
                    : 0,
            ],
        ]);
    }

    public function campaignsStore(Request $request): JsonResponse
    {
        $validated = $this->validateCampaign($request);

        if (! empty($validated['product_id'])) {
            $ownsProduct = $this->products($request)->whereKey($validated['product_id'])->exists();
            if (! $ownsProduct) {
                unset($validated['product_id']);
            }
        }

        $campaign = ManufacturerCampaign::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Campaign created successfully.',
            'campaign' => $campaign->load('product:id,name'),
        ], 201);
    }

    public function campaignsUpdate(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaigns($request)->findOrFail($id);
        $validated = $this->validateCampaign($request, true);

        if (! empty($validated['product_id'])) {
            $ownsProduct = $this->products($request)->whereKey($validated['product_id'])->exists();
            if (! $ownsProduct) {
                unset($validated['product_id']);
            }
        }

        $campaign->update($validated);

        return response()->json([
            'message' => 'Campaign updated successfully.',
            'campaign' => $campaign->fresh()->load('product:id,name'),
        ]);
    }

    public function campaignsDestroy(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaigns($request)->findOrFail($id);
        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted successfully.']);
    }

    private function validateCampaign(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'name' => "$required|string|max:255",
            'product_id' => 'nullable|integer',
            'channel' => ['sometimes', Rule::in(['in_app', 'email', 'sms', 'social', 'trade', 'field'])],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'active', 'paused', 'completed'])],
            'target_audience' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'spend' => 'nullable|numeric|min:0',
            'impressions' => 'nullable|integer|min:0',
            'clicks' => 'nullable|integer|min:0',
            'conversions' => 'nullable|integer|min:0',
        ]);
    }

    // ---------------------------------------------------------------------
    // INTEGRATIONS
    // ---------------------------------------------------------------------

    public function integrationsIndex(Request $request): JsonResponse
    {
        $defaults = [
            ['provider' => 'helix_api', 'name' => 'Helix REST API', 'type' => 'api', 'description' => 'Read and write catalogue, stock and recall data over HTTPS.'],
            ['provider' => 'webhooks', 'name' => 'Webhooks', 'type' => 'webhook', 'description' => 'Push order and stock events to your own endpoint.'],
            ['provider' => 'sap_erp', 'name' => 'SAP ERP', 'type' => 'erp', 'description' => 'Sync manufacturing batches and warehouse stock.'],
            ['provider' => 'salesforce_crm', 'name' => 'Salesforce CRM', 'type' => 'crm', 'description' => 'Share pharmacy leads and campaign activity with sales.'],
            ['provider' => 'google_analytics', 'name' => 'Google Analytics', 'type' => 'analytics', 'description' => 'Send campaign and marketplace traffic events.'],
            ['provider' => 'power_bi', 'name' => 'Power BI', 'type' => 'analytics', 'description' => 'Pull analytics tables into enterprise dashboards.'],
        ];

        foreach ($defaults as $default) {
            ManufacturerIntegration::firstOrCreate(
                ['user_id' => $request->user()->id, 'provider' => $default['provider']],
                [...$default, 'status' => 'disconnected']
            );
        }

        $integrations = $this->integrations($request)->orderBy('name')->get();

        return response()->json([
            'integrations' => $integrations,
            'summary' => [
                'total' => $integrations->count(),
                'connected' => $integrations->where('status', 'connected')->count(),
                'errors' => $integrations->where('status', 'error')->count(),
                'last_sync' => $integrations->sortByDesc('last_synced_at')->first()->last_synced_at ?? null,
            ],
            'api' => [
                'base_url' => url('/api/manufacturer-portal'),
                'version' => 'v1',
                'auth' => 'Bearer token (Laravel Sanctum)',
                'endpoints' => [
                    ['method' => 'GET', 'path' => '/overview', 'description' => 'Manufacturer profile and stock summary'],
                    ['method' => 'GET', 'path' => '/drugs', 'description' => 'List catalogue products'],
                    ['method' => 'GET', 'path' => '/inventory', 'description' => 'Stock register by batch'],
                    ['method' => 'GET', 'path' => '/recalls', 'description' => 'Recall register'],
                    ['method' => 'GET', 'path' => '/analytics/product-performance', 'description' => 'Sales performance by product'],
                    ['method' => 'GET', 'path' => '/exports/sales', 'description' => 'Download sales CSV'],
                ],
            ],
        ]);
    }

    public function integrationsStore(Request $request): JsonResponse
    {
        $validated = $this->validateIntegration($request);

        $integration = ManufacturerIntegration::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => $validated['provider']],
            [...$validated, 'user_id' => $request->user()->id]
        );

        return response()->json([
            'message' => 'Integration saved successfully.',
            'integration' => $integration,
        ], 201);
    }

    public function integrationsUpdate(Request $request, int $id): JsonResponse
    {
        $integration = $this->integrations($request)->findOrFail($id);
        $validated = $this->validateIntegration($request, true);

        $integration->update($validated);

        return response()->json([
            'message' => 'Integration updated successfully.',
            'integration' => $integration->fresh(),
        ]);
    }

    public function integrationsDestroy(Request $request, int $id): JsonResponse
    {
        $integration = $this->integrations($request)->findOrFail($id);
        $integration->update(['status' => 'disconnected', 'last_synced_at' => null]);

        return response()->json(['message' => 'Integration disconnected successfully.']);
    }

    public function integrationsTest(Request $request, int $id): JsonResponse
    {
        $integration = $this->integrations($request)->findOrFail($id);
        $integration->update([
            'status' => 'connected',
            'last_synced_at' => now(),
        ]);

        return response()->json([
            'message' => "{$integration->name} connected successfully.",
            'integration' => $integration->fresh(),
        ]);
    }

    private function validateIntegration(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'provider' => "$required|string|max:100",
            'name' => "$required|string|max:255",
            'type' => ['sometimes', Rule::in(['api', 'webhook', 'erp', 'crm', 'analytics', 'payment'])],
            'endpoint' => 'nullable|string|max:500',
            'api_key' => 'nullable|string|max:500',
            'status' => ['sometimes', Rule::in(['connected', 'disconnected', 'error'])],
            'description' => 'nullable|string|max:1000',
        ]);
    }

    // ---------------------------------------------------------------------
    // DATA EXPORTS
    // ---------------------------------------------------------------------

    public function exportsIndex(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'types' => [
                ['key' => 'products', 'label' => 'Product catalogue', 'description' => 'Full catalogue with pricing, stock and status.', 'rows' => $this->products($request)->count()],
                ['key' => 'inventory', 'label' => 'Inventory snapshot', 'description' => 'Stock on hand by pharmacy and batch.', 'rows' => $this->marketDrugs($request)->count()],
                ['key' => 'sales', 'label' => 'Sales transactions', 'description' => 'Order line items for the selected period.', 'rows' => $this->salesRows($request, $from, $to)->count()],
                ['key' => 'performance', 'label' => 'Product performance', 'description' => 'Units, revenue and growth per product.', 'rows' => $this->salesRows($request, $from, $to)->pluck('drug_name')->unique()->count()],
                ['key' => 'geography', 'label' => 'Geographic consumption', 'description' => 'Units and revenue by region and district.', 'rows' => $this->salesRows($request, $from, $to)->pluck('region')->filter()->unique()->count()],
                ['key' => 'competitors', 'label' => 'Competitor share', 'description' => 'Manufacturer revenue share in your categories.', 'rows' => $this->salesRows($request, $from, $to)->pluck('manufacturer')->unique()->count()],
                ['key' => 'campaigns', 'label' => 'Campaigns', 'description' => 'Promotion budgets, spend and conversions.', 'rows' => $this->campaigns($request)->count()],
                ['key' => 'recalls', 'label' => 'Recall register', 'description' => 'All recalls with affected and returned units.', 'rows' => $this->recalls($request)->count()],
            ],
        ]);
    }

    public function exportCsv(Request $request, string $type)
    {
        [$from, $to] = $this->range($request);
        $export = $this->buildExport($request, $type, $from, $to);

        $filename = "manufacturer-{$type}-".now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($export) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $export['headers']);
            foreach ($export['rows'] as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function buildExport(Request $request, string $type, Carbon $from, Carbon $to): array
    {
        switch ($type) {
            case 'products':
                $rows = $this->products($request)->orderBy('name')->get();

                return [
                    'headers' => ['Name', 'Generic name', 'Category', 'SKU', 'Strength', 'Dosage form', 'Cost price', 'Selling price', 'Quantity', 'Reorder level', 'Batch', 'Expiry', 'Status'],
                    'rows' => $rows->map(fn ($product) => [
                        $product->name,
                        $product->generic_name,
                        $product->category,
                        $product->sku,
                        $product->strength,
                        $product->dosage_form,
                        $product->cost_price,
                        $product->selling_price,
                        $product->quantity,
                        $product->reorder_level,
                        $product->batch_number,
                        $product->expiry_date,
                        $product->status,
                    ])->all(),
                ];

            case 'inventory':
                $rows = $this->marketDrugs($request);

                return [
                    'headers' => ['Product', 'Pharmacy', 'Region', 'District', 'Batch', 'Quantity', 'Reorder level', 'Buying price', 'Selling price', 'Expiry'],
                    'rows' => $rows->map(function ($drug) {
                        $pharmacy = DB::table('pharmacies')->where('id', $drug->pharmacy_id)->first();

                        return [
                            $drug->name,
                            $pharmacy->pharmacy_name ?? '—',
                            $pharmacy->region ?? '—',
                            $pharmacy->district ?? '—',
                            $drug->batch_number,
                            $drug->quantity,
                            $drug->reorder_level,
                            $drug->buying_price,
                            $drug->selling_price,
                            $drug->expiry_date,
                        ];
                    })->all(),
                ];

            case 'sales':
                $rows = $this->salesRows($request, $from, $to);

                return [
                    'headers' => ['Order', 'Date', 'Product', 'Pharmacy', 'Region', 'District', 'Quantity', 'Revenue', 'Status'],
                    'rows' => $rows->map(fn ($row) => [
                        $row->order_id,
                        Carbon::parse($row->created_at)->toDateString(),
                        $row->drug_name,
                        $row->pharmacy_name,
                        $row->region,
                        $row->district,
                        $row->quantity,
                        $row->total_price,
                        $row->order_status,
                    ])->all(),
                ];

            case 'performance':
                $rows = $this->salesRows($request, $from, $to);

                return [
                    'headers' => ['Product', 'Units sold', 'Revenue', 'Orders', 'Pharmacies'],
                    'rows' => $rows->groupBy('drug_name')->map(function ($items, $name) {
                        return [
                            $name,
                            (int) $items->sum('quantity'),
                            round((float) $items->sum('total_price'), 2),
                            $items->pluck('order_id')->unique()->count(),
                            $items->pluck('pharmacy_id')->unique()->count(),
                        ];
                    })->values()->all(),
                ];

            case 'geography':
                $rows = $this->salesRows($request, $from, $to);

                return [
                    'headers' => ['Region', 'District', 'Units', 'Revenue', 'Pharmacies'],
                    'rows' => $rows
                        ->groupBy(fn ($row) => ($row->region ?: 'Unassigned').'|'.($row->district ?: 'Unassigned'))
                        ->map(function ($items) {
                            $first = $items->first();

                            return [
                                $first->region ?: 'Unassigned',
                                $first->district ?: 'Unassigned',
                                (int) $items->sum('quantity'),
                                round((float) $items->sum('total_price'), 2),
                                $items->pluck('pharmacy_id')->unique()->count(),
                            ];
                        })->values()->all(),
                ];

            case 'competitors':
                $rows = $this->salesRows($request, $from, $to);

                return [
                    'headers' => ['Manufacturer', 'Units', 'Revenue', 'Pharmacies'],
                    'rows' => $rows->groupBy('manufacturer')->map(function ($items, $name) {
                        return [
                            $name,
                            (int) $items->sum('quantity'),
                            round((float) $items->sum('total_price'), 2),
                            $items->pluck('pharmacy_id')->unique()->count(),
                        ];
                    })->values()->all(),
                ];

            case 'campaigns':
                $rows = $this->campaigns($request)->orderByDesc('created_at')->get();

                return [
                    'headers' => ['Campaign', 'Channel', 'Status', 'Start', 'End', 'Budget', 'Spend', 'Impressions', 'Clicks', 'Conversions', 'Audience'],
                    'rows' => $rows->map(fn ($campaign) => [
                        $campaign->name,
                        $campaign->channel,
                        $campaign->status,
                        $campaign->start_date,
                        $campaign->end_date,
                        $campaign->budget,
                        $campaign->spend,
                        $campaign->impressions,
                        $campaign->clicks,
                        $campaign->conversions,
                        $campaign->target_audience,
                    ])->all(),
                ];

            case 'recalls':
                $rows = $this->recalls($request)->orderByDesc('date_issued')->get();

                return [
                    'headers' => ['Recall number', 'Product', 'Reason', 'Severity', 'Batch', 'Issued', 'Resolved', 'Affected', 'Returned', 'Status'],
                    'rows' => $rows->map(fn ($recall) => [
                        $recall->recall_number,
                        $recall->product_name,
                        $recall->recall_reason,
                        $recall->severity,
                        $recall->batch_numbers,
                        $recall->date_issued,
                        $recall->date_resolved,
                        $recall->affected_quantity,
                        $recall->returned_quantity,
                        $recall->status,
                    ])->all(),
                ];
        }

        abort(404, 'Unknown export type.');
    }

    // ---------------------------------------------------------------------
    // HELP & SUPPORT
    // ---------------------------------------------------------------------

    public function supportIndex(Request $request): JsonResponse
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->with(['replies.user:id,name'])
            ->latest()
            ->get();

        return response()->json([
            'tickets' => $tickets,
            'summary' => [
                'total' => $tickets->count(),
                'open' => $tickets->whereIn('status', ['open', 'in_progress'])->count(),
                'resolved' => $tickets->whereIn('status', ['resolved', 'closed'])->count(),
            ],
            'faqs' => [
                ['question' => 'How do I add a new product to my catalogue?', 'answer' => 'Open My drugs & products and choose Add product. Fill in the name, pricing and stock details, then save. The product appears in your inventory immediately.'],
                ['question' => 'How is my manufacturer data kept separate from pharmacies?', 'answer' => 'Manufacturer products live in their own catalogue and are never written to a pharmacy inventory. Analytics read marketplace sales where your name is recorded as the drug manufacturer.'],
                ['question' => 'How do I report a drug recall?', 'answer' => 'Open Drug recalls, choose Report recall, select the affected product and batch, then set the severity and status. You can update the returned quantity as stock comes back.'],
                ['question' => 'Why does a product show no sales?', 'answer' => 'Analytics match pharmacy drugs by their manufacturer name. Make sure the manufacturer name on your profile matches the name printed on the product, then allow new orders to be recorded.'],
                ['question' => 'Can I export my data?', 'answer' => 'Yes. Data Exports lets you download CSV files for your catalogue, inventory, sales, geography, campaigns and recalls for any date range.'],
            ],
        ]);
    }

    public function supportStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'category' => 'nullable|string|max:100',
        ]);

        $ticket = SupportTicket::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'pharmacy_id' => null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Support ticket created. Our team will respond shortly.',
            'ticket' => $ticket->load('replies.user:id,name'),
        ], 201);
    }

    public function supportReply(Request $request, int $id): JsonResponse
    {
        $ticket = SupportTicket::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        if (in_array($ticket->status, ['resolved', 'closed'], true)) {
            $ticket->update(['status' => 'open', 'resolved_at' => null, 'closed_at' => null]);
        }

        return response()->json([
            'message' => 'Reply sent.',
            'reply' => $reply->load('user:id,name'),
        ], 201);
    }
}
