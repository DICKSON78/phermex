<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Wholesaler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Admin-side management for wholesalers.
 *
 * The public wholesale API is key-authenticated and aimed at integrations.
 * These endpoints sit behind the normal admin session so platform staff can
 * review, approve, edit and suspend wholesalers from the dashboard.
 */
class AdminWholesalerController extends Controller
{
    private const STATUSES = ['pending', 'active', 'inactive', 'suspended'];

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Wholesaler::query()->withCount(['orders', 'inventory']);

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('wholesaler_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('license_number', 'like', "%{$search}%");
                });
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('city')) {
                $query->where('city', $request->input('city'));
            }

            $wholesalers = $query->latest()->get()->map(fn ($w) => $this->payload($w));

            return response()->json([
                'data' => $wholesalers,
                'stats' => [
                    'total' => Wholesaler::count(),
                    'active' => Wholesaler::where('status', 'active')->count(),
                    'pending' => Wholesaler::where('status', 'pending')->count(),
                    'suspended' => Wholesaler::where('status', 'suspended')->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch wholesalers.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $wholesaler = Wholesaler::withCount(['orders', 'inventory', 'pricing'])
                ->findOrFail($id);

            return response()->json(['data' => $this->payload($wholesaler)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Wholesaler not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch wholesaler.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'business_type' => 'nullable|in:wholesaler,distributor',
                'email' => 'required|email|max:255|unique:wholesalers,email',
                'phone' => 'required|string|max:30',
                'address' => 'required|string',
                'city' => 'required|string|max:120',
                'region' => 'required|string|max:120',
                'country' => 'nullable|string|max:120',
                'license_number' => 'required|string|max:120|unique:wholesalers,license_number',
                'registration_number' => 'required|string|max:120',
                'tax_id' => 'nullable|string|max:120',
                'bank_account' => 'nullable|string|max:120',
                'bank_name' => 'nullable|string|max:120',
                'contact_person' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:30',
                'delivery_fee' => 'nullable|numeric|min:0',
                'express_delivery_fee' => 'nullable|numeric|min:0',
                'minimum_order_amount' => 'nullable|numeric|min:0',
                'payment_terms_days' => 'nullable|integer|min:0|max:365',
                'accepts_credit' => 'nullable|boolean',
                'status' => 'nullable|in:' . implode(',', self::STATUSES),
            ]);

            DB::beginTransaction();

            $wholesaler = Wholesaler::create([
                'wholesaler_id' => $this->generateWholesalerId(),
                'name' => $validated['name'],
                'business_type' => $validated['business_type'] ?? 'wholesaler',
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'city' => $validated['city'],
                'region' => $validated['region'],
                'country' => $validated['country'] ?? 'Tanzania',
                'license_number' => $validated['license_number'],
                'registration_number' => $validated['registration_number'],
                'tax_id' => $validated['tax_id'] ?? null,
                'bank_account' => $validated['bank_account'] ?? '',
                'bank_name' => $validated['bank_name'] ?? '',
                'contact_person' => $validated['contact_person'] ?? $validated['name'],
                'contact_phone' => $validated['contact_phone'] ?? $validated['phone'],
                'delivery_fee' => $validated['delivery_fee'] ?? 0,
                'express_delivery_fee' => $validated['express_delivery_fee'] ?? 0,
                'minimum_order_amount' => $validated['minimum_order_amount'] ?? 0,
                'payment_terms_days' => $validated['payment_terms_days'] ?? 30,
                'accepts_credit' => $validated['accepts_credit'] ?? true,
                'status' => $validated['status'] ?? 'pending',
            ]);

            $this->audit($request, 'wholesaler_created', $wholesaler, $wholesaler->toArray());

            DB::commit();

            return response()->json([
                'message' => 'Wholesaler created successfully.',
                'data' => $this->payload($wholesaler->fresh()),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create wholesaler.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $wholesaler = Wholesaler::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'business_type' => 'nullable|in:wholesaler,distributor',
                'email' => 'required|email|max:255|unique:wholesalers,email,' . $wholesaler->id,
                'phone' => 'required|string|max:30',
                'address' => 'required|string',
                'city' => 'required|string|max:120',
                'region' => 'required|string|max:120',
                'country' => 'nullable|string|max:120',
                'license_number' => 'required|string|max:120|unique:wholesalers,license_number,' . $wholesaler->id,
                'registration_number' => 'required|string|max:120',
                'tax_id' => 'nullable|string|max:120',
                'bank_account' => 'nullable|string|max:120',
                'bank_name' => 'nullable|string|max:120',
                'contact_person' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:30',
                'delivery_fee' => 'nullable|numeric|min:0',
                'express_delivery_fee' => 'nullable|numeric|min:0',
                'minimum_order_amount' => 'nullable|numeric|min:0',
                'payment_terms_days' => 'nullable|integer|min:0|max:365',
                'accepts_credit' => 'nullable|boolean',
                'status' => 'nullable|in:' . implode(',', self::STATUSES),
            ]);

            $validated['country'] = $validated['country'] ?? 'Tanzania';
            $validated['business_type'] = $validated['business_type'] ?? 'wholesaler';
            $validated['delivery_fee'] = $validated['delivery_fee'] ?? 0;
            $validated['express_delivery_fee'] = $validated['express_delivery_fee'] ?? 0;
            $validated['minimum_order_amount'] = $validated['minimum_order_amount'] ?? 0;
            $validated['payment_terms_days'] = $validated['payment_terms_days'] ?? 30;
            $validated['accepts_credit'] = $validated['accepts_credit'] ?? true;
            $validated['bank_account'] = $validated['bank_account'] ?? '';
            $validated['bank_name'] = $validated['bank_name'] ?? '';
            $validated['contact_person'] = $validated['contact_person'] ?? $validated['name'];
            $validated['contact_phone'] = $validated['contact_phone'] ?? $validated['phone'];

            $oldValues = $wholesaler->toArray();
            $wholesaler->update($validated);

            $this->audit($request, 'wholesaler_updated', $wholesaler, [
                'old' => $oldValues,
                'new' => $wholesaler->fresh()->toArray(),
            ]);

            return response()->json([
                'message' => 'Wholesaler updated successfully.',
                'data' => $this->payload($wholesaler->fresh()),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Wholesaler not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update wholesaler.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:' . implode(',', self::STATUSES),
            ]);

            $wholesaler = Wholesaler::findOrFail($id);
            $oldStatus = $wholesaler->status;
            $wholesaler->update(['status' => $validated['status']]);

            $this->audit($request, 'wholesaler_status_updated', $wholesaler, [
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
            ]);

            return response()->json([
                'message' => 'Wholesaler status updated.',
                'data' => $this->payload($wholesaler->fresh()),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Wholesaler not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update wholesaler status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $wholesaler = Wholesaler::withCount('orders')->findOrFail($id);

            // Orders are financial records. Keep the account instead of
            // silently orphaning them.
            if ($wholesaler->orders_count > 0) {
                return response()->json([
                    'message' => 'This wholesaler has orders and cannot be deleted. Suspend it instead.',
                ], 422);
            }

            DB::beginTransaction();

            $snapshot = $wholesaler->toArray();
            $wholesaler->inventory()->delete();
            $wholesaler->pricing()->delete();
            $wholesaler->delete();

            $this->audit($request, 'wholesaler_deleted', $wholesaler, $snapshot);

            DB::commit();

            return response()->json(['message' => 'Wholesaler deleted successfully.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Wholesaler not found.'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete wholesaler.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    private function payload(Wholesaler $wholesaler): array
    {
        return [
            'id' => $wholesaler->id,
            'wholesaler_id' => $wholesaler->wholesaler_id,
            'name' => $wholesaler->name,
            'business_type' => $wholesaler->business_type ?: 'wholesaler',
            'email' => $wholesaler->email,
            'phone' => $wholesaler->phone,
            'address' => $wholesaler->address,
            'city' => $wholesaler->city,
            'region' => $wholesaler->region,
            'country' => $wholesaler->country,
            'license_number' => $wholesaler->license_number,
            'registration_number' => $wholesaler->registration_number,
            'tax_id' => $wholesaler->tax_id,
            'bank_account' => $wholesaler->bank_account,
            'bank_name' => $wholesaler->bank_name,
            'delivery_fee' => (float) $wholesaler->delivery_fee,
            'express_delivery_fee' => (float) $wholesaler->express_delivery_fee,
            'minimum_order_amount' => (float) $wholesaler->minimum_order_amount,
            'payment_terms_days' => (int) $wholesaler->payment_terms_days,
            'accepts_credit' => (bool) $wholesaler->accepts_credit,
            'status' => $wholesaler->status,
            'rating' => (float) $wholesaler->rating,
            'total_orders' => (int) $wholesaler->total_orders,
            'orders_count' => (int) ($wholesaler->orders_count ?? 0),
            'inventory_count' => (int) ($wholesaler->inventory_count ?? 0),
            'pricing_count' => (int) ($wholesaler->pricing_count ?? 0),
            'on_time_delivery_rate' => (float) $wholesaler->on_time_delivery_rate,
            'contact_person' => $wholesaler->contact_person,
            'contact_phone' => $wholesaler->contact_phone,
            'created_at' => $wholesaler->created_at?->toISOString(),
            'updated_at' => $wholesaler->updated_at?->toISOString(),
        ];
    }

    private function generateWholesalerId(): string
    {
        do {
            $id = 'WHOLE-' . strtoupper(Str::random(6));
        } while (Wholesaler::where('wholesaler_id', $id)->exists());

        return $id;
    }

    private function audit(Request $request, string $action, Wholesaler $wholesaler, array $values): void
    {
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'model_type' => Wholesaler::class,
            'model_id' => $wholesaler->id,
            'new_values' => $values,
            'ip_address' => $request->ip(),
        ]);
    }
}
