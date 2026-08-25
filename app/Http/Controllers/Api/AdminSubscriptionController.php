<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Pharmacy;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSubscriptionController extends Controller
{
    private function toApi(Subscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'pharmacy_id' => $subscription->pharmacy_id,
            'pharmacy' => $subscription->pharmacy?->pharmacy_name ?? 'Unknown Pharmacy',
            'plan' => ucfirst($subscription->plan),
            'amount' => (float) $subscription->amount,
            'status' => $subscription->status,
            'startDate' => $subscription->start_date?->toDateString(),
            'expiryDate' => $subscription->end_date?->toDateString(),
            'payment_method' => $subscription->payment_method,
            'transaction_id' => $subscription->transaction_id,
            'billing_cycle' => 'Monthly',
            'auto_renew' => true,
            'created_at' => $subscription->created_at?->toISOString(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Subscription::with('pharmacy');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('plan')) {
                $query->where('plan', strtolower($request->input('plan')));
            }

            $subscriptions = $query->latest()->get();

            $active = $subscriptions->where('status', 'active')->count();
            $trial = $subscriptions->where('status', 'trial')->count();
            $expired = $subscriptions->where('status', 'expired')->count();
            $suspended = $subscriptions->where('status', 'suspended')->count();

            $thisMonth = now()->month;
            $thisYear = now()->year;
            $monthlyRevenue = $subscriptions->where('status', 'active')
                ->filter(fn ($s) => $s->created_at && $s->created_at->month === $thisMonth && $s->created_at->year === $thisYear)
                ->sum('amount');

            $churnRate = $subscriptions->count() > 0
                ? round(($expired / $subscriptions->count()) * 100, 1)
                : 0;

            return response()->json([
                'data' => [
                    'subscriptions' => $subscriptions->map(fn ($s) => $this->toApi($s)),
                    'stats' => [
                        'activeSubscriptions' => $active,
                        'monthlyRevenue' => $monthlyRevenue,
                        'trialUsers' => $trial,
                        'churnRate' => $churnRate,
                        'expired' => $expired,
                        'suspended' => $suspended,
                        'total' => $subscriptions->count(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch subscriptions.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy' => 'required|string|max:255',
                'plan' => 'required|string|in:Trial,Basic,Pro,Enterprise',
                'amount' => 'required|numeric|min:0',
                'startDate' => 'required|date',
                'expiryDate' => 'required|date|after:startDate',
            ]);

            $pharmacy = Pharmacy::where('pharmacy_name', $validated['pharmacy'])
                ->first();

            if (!$pharmacy) {
                return response()->json([
                    'message' => 'Pharmacy not found. Please match the pharmacy name exactly.',
                ], 422);
            }

            DB::beginTransaction();

            $subscription = Subscription::create([
                'pharmacy_id' => $pharmacy->id,
                'plan' => strtolower($validated['plan']),
                'amount' => $validated['amount'],
                'status' => 'active',
                'start_date' => $validated['startDate'],
                'end_date' => $validated['expiryDate'],
                'payment_method' => $request->input('payment_method'),
                'transaction_id' => $request->input('transaction_id'),
            ]);

            $pharmacy->update([
                'payment_status' => 'paid',
                'status' => 'active',
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'subscription_created',
                'model_type' => Subscription::class,
                'model_id' => $subscription->id,
                'new_values' => $subscription->toArray(),
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Subscription created successfully.',
                'subscription' => $this->toApi($subscription->fresh('pharmacy')),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create subscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $subscription = Subscription::with('pharmacy')->findOrFail($id);

            return response()->json(['data' => $this->toApi($subscription)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Subscription not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch subscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $subscription = Subscription::with('pharmacy')->findOrFail($id);

            $validated = $request->validate([
                'pharmacy' => 'sometimes|string|max:255',
                'plan' => 'sometimes|string|in:Trial,Basic,Pro,Enterprise',
                'amount' => 'sometimes|numeric|min:0',
                'startDate' => 'sometimes|date',
                'expiryDate' => 'sometimes|date',
            ]);

            $data = [];

            if (!empty($validated['pharmacy'])) {
                $pharmacy = Pharmacy::where('pharmacy_name', $validated['pharmacy'])
                    ->first();
                if (!$pharmacy) {
                    return response()->json(['message' => 'Pharmacy not found.'], 422);
                }
                $data['pharmacy_id'] = $pharmacy->id;
            }

            if (!empty($validated['plan'])) {
                $data['plan'] = strtolower($validated['plan']);
            }

            if (array_key_exists('amount', $validated)) {
                $data['amount'] = $validated['amount'];
            }

            if (!empty($validated['startDate'])) {
                $data['start_date'] = $validated['startDate'];
            }

            if (!empty($validated['expiryDate'])) {
                $data['end_date'] = $validated['expiryDate'];
            }

            $subscription->update($data);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'subscription_updated',
                'model_type' => Subscription::class,
                'model_id' => $subscription->id,
                'new_values' => $subscription->fresh()->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Subscription updated successfully.',
                'subscription' => $this->toApi($subscription->fresh('pharmacy')),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Subscription not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update subscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $subscription = Subscription::findOrFail($id);
            $subscription->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'subscription_deleted',
                'model_type' => Subscription::class,
                'model_id' => $id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Subscription deleted successfully.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Subscription not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete subscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function action(Request $request, $id, $action): JsonResponse
    {
        try {
            $subscription = Subscription::with('pharmacy')->findOrFail($id);

            $planTiers = ['trial' => 0, 'basic' => 1, 'pro' => 2, 'enterprise' => 3];

            switch ($action) {
                case 'upgrade':
                    $tier = ($planTiers[$subscription->plan] ?? 0) + 1;
                    $newPlan = array_keys($planTiers)[min($tier, 3)];
                    $subscription->update(['plan' => $newPlan]);
                    break;

                case 'downgrade':
                    $tier = ($planTiers[$subscription->plan] ?? 0) - 1;
                    $newPlan = array_keys($planTiers)[max($tier, 0)];
                    $subscription->update(['plan' => $newPlan]);
                    break;

                case 'cancel':
                    $subscription->update(['status' => 'cancelled']);
                    break;

                case 'renew':
                    $subscription->update([
                        'status' => 'active',
                        'start_date' => now()->toDateString(),
                        'end_date' => now()->addMonth()->toDateString(),
                    ]);
                    break;

                default:
                    return response()->json(['message' => 'Invalid action.'], 422);
            }

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => "subscription_{$action}",
                'model_type' => Subscription::class,
                'model_id' => $subscription->id,
                'new_values' => $subscription->fresh()->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Subscription action completed.',
                'subscription' => $this->toApi($subscription->fresh('pharmacy')),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Subscription not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to perform subscription action.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
