<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PharmacyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->isAdmin()) {
                $pharmacies = Pharmacy::with('owner')->latest()->paginate(20);

                return response()->json($pharmacies);
            }

            $pharmacies = $user->accessiblePharmacies();

            return response()->json([
                'data' => $pharmacies,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacies.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user->isOwner()) {
                return response()->json([
                    'message' => 'Only pharmacy owners can create pharmacies.',
                ], 403);
            }

            $existingCount = Pharmacy::where('owner_id', $user->id)->count();
            // Trial and starter get 3 pharmacies, professional/enterprise unlimited,
            // owners without a plan (legacy) get 1 until they subscribe.
            $cap = 1;
            $ownerPlan = \App\Models\Subscription::whereIn('pharmacy_id', $user->accessiblePharmacyIds())
                ->latest('id')
                ->value('plan');
            // Also check the pharmacy's own plan slug or trial window
            if (!$ownerPlan) {
                $currentPharmacy = $user->resolveCurrentPharmacyId() ? \App\Models\Pharmacy::find($user->resolveCurrentPharmacyId()) : null;
                $ownerPlan = $currentPharmacy?->subscriptionPlan?->slug ?? ($currentPharmacy?->trial_ends_at?->isFuture() ? 'trial' : null);
            }
            if (in_array($ownerPlan, ['professional', 'enterprise', 'pro'], true)) {
                $cap = PHP_INT_MAX;
            } elseif (in_array($ownerPlan, ['starter', 'trial'], true)) {
                $cap = 3;
            }

            if ($existingCount >= $cap) {
                return response()->json([
                    'message' => 'Your current plan allows a maximum of ' . ($cap === PHP_INT_MAX ? 'unlimited' : $cap) . ' pharmacies. Upgrade your plan to add more.',
                ], 422);
            }

            $validated = $request->validate([
                'pharmacy_name' => 'required|string|max:255',
                'pharmacy_type' => 'sometimes|in:independent,chain,hospital,online',
                'license_number' => 'sometimes|nullable|string|max:255',
                'license_expiry' => 'sometimes|nullable|date',
                'country' => 'sometimes|string|max:100',
                'region' => 'required|string|max:255',
                'district' => 'required|string|max:255',
                'ward' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'latitude' => 'sometimes|nullable|numeric|between:-90,90',
                'longitude' => 'sometimes|nullable|numeric|between:-180,180',
                'opening_capital' => 'sometimes|nullable|numeric|min:0',
                'working_days' => 'sometimes|nullable|array',
                'working_hours' => 'sometimes|nullable|array',
                'description' => 'sometimes|nullable|string|max:1000',
                'subscription_plan_id' => 'required|exists:subscription_plans,id',
            ]);

            $pharmacy = Pharmacy::create([
                'owner_id' => $user->id,
                'pharmacy_name' => $validated['pharmacy_name'],
                'pharmacy_code' => 'PHM-' . strtoupper(Str::random(6)),
                'pharmacy_type' => $validated['pharmacy_type'] ?? 'independent',
                'license_number' => $validated['license_number'] ?? null,
                'license_expiry' => $validated['license_expiry'] ?? null,
                'country' => $validated['country'] ?? 'Tanzania',
                'region' => $validated['region'],
                'district' => $validated['district'],
                'ward' => $validated['ward'] ?? null,
                'street' => $validated['street'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'phone' => $user->phone,
                'email' => $user->email,
                'description' => $validated['description'] ?? null,
                'working_days' => $validated['working_days'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'working_hours' => $validated['working_hours'] ?? ['open' => '08:00', 'close' => '18:00'],
                'opening_capital' => $validated['opening_capital'] ?? 0,
                'status' => 'pending',
                'application_status' => 'pending',
                'is_published' => false,
                'subscription_plan_id' => $validated['subscription_plan_id'],
                'subscription_amount' => \App\Models\SubscriptionPlan::find($validated['subscription_plan_id'])?->price,
                'payment_status' => 'unpaid',
            ]);

            $user->pharmacy()->attach($pharmacy->id);

            return response()->json([
                'message' => 'Pharmacy created successfully. Awaiting approval.',
                'pharmacy' => $pharmacy,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create pharmacy.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::with('owner', 'drugs', 'customers', 'pharmacists')
                ->findOrFail($id);

            return response()->json([
                'pharmacy' => $pharmacy,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacy.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            $validated = $request->validate([
                'pharmacy_name' => 'sometimes|string|max:255',
                'pharmacy_logo' => 'sometimes|nullable',
                'license_number' => 'sometimes|nullable|string|max:255',
                'license_expiry' => 'sometimes|nullable|date',
                'pharmacy_type' => 'sometimes|in:independent,chain,hospital,online',
                'business_category' => 'sometimes|nullable|string|max:255',
                'country' => 'sometimes|string|max:100',
                'region' => 'sometimes|nullable|string|max:255',
                'district' => 'sometimes|nullable|string|max:255',
                'ward' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'email' => 'sometimes|nullable|email',
                'working_days' => 'sometimes|nullable|array',
                'working_hours' => 'sometimes|nullable|array',
                'opening_capital' => 'sometimes|numeric|min:0',
                'status' => 'sometimes|in:pending,active,suspended,closed',
                'is_published' => 'sometimes|boolean',
            ]);

            $logo = $this->resolvePharmacyLogo($request, $pharmacy);
            if ($logo !== false) {
                $validated['pharmacy_logo'] = $logo;
            }

            $pharmacy->update($validated);

            return response()->json([
                'message' => 'Pharmacy updated successfully.',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update pharmacy.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    /**
     * Resolve an updated pharmacy logo, accepting an uploaded file or a plain URL.
     *
     * The dashboard settings form sends the file under "logo", while other clients
     * send "pharmacy_logo"; both are honoured so neither is silently dropped.
     * Returns false when the request did not touch the logo at all.
     */
    private function resolvePharmacyLogo(Request $request, Pharmacy $pharmacy)
    {
        $file = $request->file('pharmacy_logo') ?? $request->file('logo');

        if ($file) {
            $validator = Validator::make(
                ['logo' => $file],
                ['logo' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:5120']
            );

            if ($validator->fails()) {
                throw ValidationException::withMessages([
                    'pharmacy_logo' => $validator->errors()->get('logo'),
                ]);
            }

            $this->deleteStoredLogo($pharmacy);

            $path = $file->storeAs('pharmacy-logos', Str::uuid() . '.' . strtolower($file->getClientOriginalExtension()), 'public');

            return Storage::disk('public')->url($path);
        }

        $url = $request->input('pharmacy_logo') ?? $request->input('logo');

        if ($url === null) {
            return false;
        }

        if (trim((string) $url) !== '') {
            return $url;
        }

        $this->deleteStoredLogo($pharmacy);

        return null;
    }

    /** Remove a previously uploaded logo so replacements do not orphan files. */
    private function deleteStoredLogo(Pharmacy $pharmacy): void
    {
        $current = $pharmacy->pharmacy_logo;

        if (!is_string($current) || $current === '' || !str_contains($current, '/storage/pharmacy-logos/')) {
            return;
        }

        $relative = Str::after($current, '/storage/');
        $disk = Storage::disk('public');

        if ($disk->exists($relative)) {
            $disk->delete($relative);
        }
    }

    public function stats($id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            $totalDrugs = $pharmacy->drugs()->count();
            $totalOrders = $pharmacy->orders()->count();
            $totalCustomers = $pharmacy->customers()->count();
            $totalRevenue = $pharmacy->orders()
                ->where('payment_status', 'paid')
                ->sum('total');
            $lowStockCount = $pharmacy->drugs()
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->count();
            $expiringSoonCount = $pharmacy->drugs()
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->count();

            return response()->json([
                'pharmacy' => [
                    'id' => $pharmacy->id,
                    'name' => $pharmacy->pharmacy_name,
                    'code' => $pharmacy->pharmacy_code,
                ],
                'stats' => [
                    'total_drugs' => $totalDrugs,
                    'total_orders' => $totalOrders,
                    'total_customers' => $totalCustomers,
                    'total_revenue' => (float) $totalRevenue,
                    'low_stock_count' => $lowStockCount,
                    'expiring_soon_count' => $expiringSoonCount,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacy stats.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function current(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyId = $user->resolveCurrentPharmacyId();

            $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy associated with this account.'], 404);
            }

            return response()->json($pharmacy);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch current pharmacy.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function switchPharmacy(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacy = Pharmacy::findOrFail($id);

            if ($user->isOwner()) {
                $hasAccess = $pharmacy->owner_id === $user->id
                    || $user->pharmacy()->where('pharmacies.id', $id)->exists();
            } else {
                $hasAccess = $user->pharmacy()->where('pharmacies.id', $id)->exists();
            }

            if (!$hasAccess) {
                return response()->json([
                    'message' => 'You do not have access to this pharmacy.',
                ], 403);
            }

            $user->update(['current_pharmacy_id' => $id]);
            $user->refresh();
            $user->load('pharmacy', 'currentPharmacy');
            $user->accessible_pharmacies = $user->accessiblePharmacies();

            return response()->json([
                'message' => 'Switched to pharmacy successfully.',
                'pharmacy' => $pharmacy,
                'user' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to switch pharmacy.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    /**
     * Records the account customers should pay this pharmacy directly.
     *
     * The platform only stores the details; the money never touches it. That
     * keeps every other pharmacy's float out of the platform's balance.
     */
    public function updatePaymentDetails(Request $request): JsonResponse
    {
        try {
            $pharmacyId = Auth::user()?->resolveCurrentPharmacyId();

            if (! $pharmacyId) {
                return response()->json(['message' => 'No pharmacy is linked to this account.'], 403);
            }

            $validated = $request->validate([
                'payment_method' => 'required|in:cash,mobile_money',
                'payment_number' => 'nullable|string|max:40',
                'payment_name' => 'nullable|string|max:120',
            ]);

            // A number is meaningless without a method that uses one, so the
            // two are validated together rather than independently.
            if ($validated['payment_method'] === 'mobile_money') {
                if (empty($validated['payment_number'])) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'error' => ['payment_number' => ['A mobile money number is required when customers pay by mobile money.']],
                    ], 422);
                }

                // Tanzanian mobile money numbers are 10 digits locally
                // (0754123456) or 12 digits in international form (255754123456).
                $digits = preg_replace('/\D/', '', $validated['payment_number']);
                $isLocal = strlen($digits) === 10 && str_starts_with($digits, '0');
                $isInternational = strlen($digits) === 12 && str_starts_with($digits, '255');

                if (! $isLocal && ! $isInternational) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'error' => ['payment_number' => ['Enter a valid Tanzanian mobile money number, e.g. 0754123456.']],
                    ], 422);
                }
            }

            $pharmacy = Pharmacy::findOrFail($pharmacyId);

            $pharmacy->update([
                'customer_payment_method' => $validated['payment_method'],
                'customer_payment_number' => $validated['payment_method'] === 'mobile_money'
                    ? $validated['payment_number']
                    : null,
                'customer_payment_name' => $validated['payment_name'] ?? null,
            ]);

            return response()->json([
                'message' => 'Payment details saved.',
                'payment' => [
                    'method' => $pharmacy->customer_payment_method,
                    'number' => $pharmacy->customer_payment_number,
                    'name' => $pharmacy->customer_payment_name,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save payment details.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
