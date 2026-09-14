<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
use App\Models\Order;
use App\Models\Pharmacy;
use App\Models\User;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(private readonly LoyaltyService $loyalty)
    {
    }

    private function currentPharmacy(Request $request): Pharmacy
    {
        $user = $request->user();
        $currentId = $user->resolveCurrentPharmacyId();
        return $currentId ? Pharmacy::findOrFail($currentId) : Pharmacy::findOrFail($user->accessiblePharmacyIds()[0] ?? 0);
    }

    private function memberOrFail(Pharmacy $pharmacy, int $customerUserId): ?JsonResponse
    {
        $user = User::find($customerUserId);
        if (!$user) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $hasOrder = Order::query()->where('pharmacy_id', $pharmacy->id)->where('user_id', $customerUserId)->exists();
        if (!$hasOrder && !$this->loyalty->balanceFor($pharmacy, $customerUserId)) {
            return response()->json(['message' => 'Customer has no activity at this pharmacy.'], 422);
        }

        return null;
    }

    // ------------------------------------------------------------------
    // Pharmacy-side: program settings
    // ------------------------------------------------------------------

    public function settings(Request $request): JsonResponse
    {
        try {
            $pharmacy = $this->currentPharmacy($request);

            $ids = $request->user()->accessiblePharmacyIds();
            $members = \App\Models\Order::whereIn('pharmacy_id', $ids)
                ->whereNotNull('user_id')
                ->distinct()
                ->count('user_id');

            $agg = LoyaltyPoint::whereIn('pharmacy_id', $ids)->get();
            $totalEarned = $agg->where('points', '>', 0)->sum('points');
            $totalRedeemed = abs($agg->where('points', '<', 0)->sum('points'));

            return response()->json([
                'data' => [
                    'enabled' => (bool) $pharmacy->loyalty_enabled,
                    'points_per_tsh' => (float) ($pharmacy->loyalty_points_per_tsh ?? 0.001),
                    'redeem_tsh_per_point' => (float) ($pharmacy->loyalty_redeem_tsh_per_point ?? 20),
                    'summary' => [
                        'active_members' => (int) $members,
                        'total_earned' => (int) $totalEarned,
                        'total_redeemed' => (int) $totalRedeemed,
                        'redeemed_value' => (float) round($totalRedeemed * (float) ($pharmacy->loyalty_redeem_tsh_per_point ?? 20)),
                    ],
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'enabled' => 'sometimes|boolean',
                'points_per_tsh' => 'sometimes|numeric|min:0|max:1',
                'redeem_tsh_per_point' => 'sometimes|numeric|min:1|max:100000',
            ]);

            $pharmacy = $this->currentPharmacy($request);
            $pharmacy->update([
                'loyalty_enabled' => $validated['enabled'] ?? $pharmacy->loyalty_enabled,
                'loyalty_points_per_tsh' => $validated['points_per_tsh'] ?? $pharmacy->loyalty_points_per_tsh,
                'loyalty_redeem_tsh_per_point' => $validated['redeem_tsh_per_point'] ?? $pharmacy->loyalty_redeem_tsh_per_point,
            ]);

            return response()->json([
                'message' => 'Loyalty program settings updated.',
                'data' => [
                    'enabled' => (bool) $pharmacy->fresh()->loyalty_enabled,
                    'points_per_tsh' => (float) $pharmacy->loyalty_points_per_tsh,
                    'redeem_tsh_per_point' => (float) $pharmacy->loyalty_redeem_tsh_per_point,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Pharmacy-side: members & ledger
    // ------------------------------------------------------------------

    public function members(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $ids = $user->accessiblePharmacyIds();
            $members = collect();

            foreach ($ids as $pharmacyId) {
                $members = $members->merge($this->loyalty->members($pharmacyId, $request->get('search')));
            }

            $members = $members->unique('user_id')->values()->sortByDesc('points')->values();

            return response()->json(['data' => $members]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function transactions(Request $request, string $customerUserId): JsonResponse
    {
        try {
            $pharmacy = $this->currentPharmacy($request);

            $blocked = $this->memberOrFail($pharmacy, (int) $customerUserId);
            if ($blocked) {
                return $blocked;
            }

            return response()->json([
                'data' => [
                    'balance' => $this->loyalty->balanceFor($pharmacy, (int) $customerUserId),
                    'transactions' => $this->loyalty->ledger($pharmacy, (int) $customerUserId),
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function adjust(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'points' => 'required|integer|min:-100000|max:100000',
                'reason' => 'nullable|string|max:255',
            ]);

            $pharmacy = $this->currentPharmacy($request);

            $blocked = $this->memberOrFail($pharmacy, (int) $validated['user_id']);
            if ($blocked) {
                return $blocked;
            }

            $result = $this->loyalty->adjust(
                $pharmacy,
                (int) $validated['user_id'],
                (int) $validated['points'],
                $validated['reason'] ?? null,
            );

            if (!$result['ok']) {
                return response()->json(['message' => $result['message']], 422);
            }

            return response()->json([
                'message' => $result['message'],
                'data' => ['balance' => $result['balance']],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function redeem(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'points' => 'required|integer|min:1|max:1000000',
                'reason' => 'nullable|string|max:255',
            ]);

            $pharmacy = $this->currentPharmacy($request);

            $blocked = $this->memberOrFail($pharmacy, (int) $validated['user_id']);
            if ($blocked) {
                return $blocked;
            }

            $result = $this->loyalty->redeem(
                $pharmacy,
                (int) $validated['user_id'],
                (int) $validated['points'],
                $validated['reason'] ?? null,
            );

            if (!$result['ok']) {
                return response()->json(['message' => $result['message']], 422);
            }

            return response()->json([
                'message' => $result['message'],
                'data' => [
                    'balance' => $result['balance'],
                    'value' => $result['value'],
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Customer app side
    // ------------------------------------------------------------------

    public function myLoyalty(Request $request): JsonResponse
    {
        try {
            return response()->json([
                'data' => $this->loyalty->customerSummary($request->user()->id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}