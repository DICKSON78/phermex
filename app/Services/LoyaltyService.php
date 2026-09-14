<?php

namespace App\Services;

use App\Models\LoyaltyPoint;
use App\Models\Order;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LoyaltyService
{
    /**
     * Points earned for a given order value (TZS) under a pharmacy's config.
     */
    public function pointsForValue(Pharmacy $pharmacy, float $amount): int
    {
        $rate = (float) ($pharmacy->loyalty_points_per_tsh ?? 0.001);
        return (int) floor($amount * $rate);
    }

    /**
     * Current redeemable balance for a customer at a pharmacy.
     */
    public function balanceFor(Pharmacy $pharmacy, int $customerUserId): int
    {
        return (int) LoyaltyPoint::where('pharmacy_id', $pharmacy->id)
            ->where('customer_user_id', $customerUserId)
            ->sum('points');
    }

    /**
     * Last known running balance (from the most recent ledger entry).
     */
    public function lastBalanceFor(Pharmacy $pharmacy, int $customerUserId): int
    {
        $last = LoyaltyPoint::where('pharmacy_id', $pharmacy->id)
            ->where('customer_user_id', $customerUserId)
            ->orderByDesc('id')
            ->first();

        return $last ? (int) $last->balance_after : 0;
    }

    /**
     * Award points for a completed (delivered/dispensed) paid order.
     * Idempotent — guarded by orders.loyalty_awarded.
     */
    public function awardForOrder(Order $order): void
    {
        if ($order->loyalty_awarded) {
            return;
        }

        $pharmacy = Pharmacy::find($order->pharmacy_id);
        if (!$pharmacy || !$pharmacy->loyalty_enabled) {
            return;
        }

        $customerUserId = $order->user_id;
        if (!$customerUserId) {
            return;
        }

        $points = $this->pointsForValue($pharmacy, (float) $order->total);
        if ($points <= 0) {
            $order->update(['loyalty_awarded' => true]);
            return;
        }

        DB::transaction(function () use ($order, $pharmacy, $customerUserId, $points) {
            $balance = $this->balanceFor($pharmacy, $customerUserId);

            LoyaltyPoint::create([
                'pharmacy_id' => $order->pharmacy_id,
                'customer_user_id' => $customerUserId,
                'points' => $points,
                'type' => 'earn',
                'order_id' => $order->id,
                'description' => 'Points earned on order #' . $order->order_code,
                'balance_after' => $balance + $points,
            ]);

            $order->update(['loyalty_awarded' => true]);
        });
    }

    /**
     * Redeem points for a customer (pharmacist-driven discount).
     */
    public function redeem(Pharmacy $pharmacy, int $customerUserId, int $points, ?string $reason = null): array
    {
        if ($points <= 0) {
            return ['ok' => false, 'message' => 'Redeem amount must be greater than zero.'];
        }

        $balance = $this->balanceFor($pharmacy, $customerUserId);
        if ($points > $balance) {
            return ['ok' => false, 'message' => 'Customer does not have enough points.'];
        }

        DB::transaction(function () use ($pharmacy, $customerUserId, $points, $reason) {
            LoyaltyPoint::create([
                'pharmacy_id' => $pharmacy->id,
                'customer_user_id' => $customerUserId,
                'points' => -$points,
                'type' => 'redeem',
                'description' => $reason ?: 'Points redeemed against purchase',
                'balance_after' => $this->balanceFor($pharmacy, $customerUserId) - $points,
            ]);
        });

        return [
            'ok' => true,
            'message' => 'Redeemed ' . $points . ' points.',
            'balance' => $this->balanceFor($pharmacy, $customerUserId),
            'value' => $points * (float) ($pharmacy->loyalty_redeem_tsh_per_point ?? 20),
        ];
    }

    /**
     * Manual adjustment (add or subtract) with a staff explanation.
     */
    public function adjust(Pharmacy $pharmacy, int $customerUserId, int $points, ?string $reason = null): array
    {
        if ($points === 0) {
            return ['ok' => false, 'message' => 'Adjustment must not be zero.'];
        }

        $balance = $this->balanceFor($pharmacy, $customerUserId);
        if ($points < 0 && abs($points) > $balance) {
            return ['ok' => false, 'message' => 'Adjustment would make the balance negative.'];
        }

        DB::transaction(function () use ($pharmacy, $customerUserId, $points, $reason) {
            LoyaltyPoint::create([
                'pharmacy_id' => $pharmacy->id,
                'customer_user_id' => $customerUserId,
                'points' => $points,
                'type' => 'adjust',
                'description' => $reason ?: 'Manual adjustment',
                'balance_after' => $this->balanceFor($pharmacy, $customerUserId) + $points,
            ]);
        });

        return [
            'ok' => true,
            'message' => ($points > 0 ? 'Added ' : 'Deducted ') . abs($points) . ' points.',
            'balance' => $this->balanceFor($pharmacy, $customerUserId),
        ];
    }

    /**
     * Ledger history for a customer at a pharmacy.
     */
    public function ledger(Pharmacy $pharmacy, int $customerUserId): \Illuminate\Support\Collection
    {
        return LoyaltyPoint::where('pharmacy_id', $pharmacy->id)
            ->where('customer_user_id', $customerUserId)
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(fn (LoyaltyPoint $lp) => [
                'id' => $lp->id,
                'points' => (int) $lp->points,
                'type' => $lp->type,
                'description' => $lp->description,
                'balance_after' => (int) $lp->balance_after,
                'created_at' => $lp->created_at?->format('d M Y, H:i'),
            ]);
    }

    /**
     * A customer's points aggregated across pharmacies (customer app).
     */
    public function customerSummary(int $customerUserId): array
    {
        $rows = LoyaltyPoint::selectRaw('pharmacy_id, SUM(points) as total')
            ->where('customer_user_id', $customerUserId)
            ->groupBy('pharmacy_id')
            ->get();

        $pharmacies = [];
        foreach ($rows as $row) {
            $pharmacy = Pharmacy::withTrashed()->find($row->pharmacy_id);
            if (!$pharmacy) {
                continue;
            }
            $pharmacies[] = [
                'pharmacy_id' => $pharmacy->id,
                'pharmacy_name' => $pharmacy->pharmacy_name,
                'points' => (int) $row->total,
                'redeem_tsh_per_point' => (float) ($pharmacy->loyalty_redeem_tsh_per_point ?? 20),
            ];
        }

        usort($pharmacies, fn ($a, $b) => $b['points'] <=> $a['points']);

        $transactions = LoyaltyPoint::with('pharmacy:id,pharmacy_name')
            ->where('customer_user_id', $customerUserId)
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (LoyaltyPoint $lp) => [
                'id' => $lp->id,
                'points' => (int) $lp->points,
                'type' => $lp->type,
                'description' => $lp->description,
                'pharmacy_name' => $lp->pharmacy?->pharmacy_name,
                'created_at' => $lp->created_at?->format('d M Y, H:i'),
            ]);

        return [
            'pharmacies' => $pharmacies,
            'transactions' => $transactions,
        ];
    }

    /**
     * Pharmacy-side member list: users with purchases at this pharmacy,
     * enriched with current loyalty balances.
     */
    public function members(int $pharmacyId, ?string $search = null): \Illuminate\Support\Collection
    {
        $query = Order::query()
            ->where('pharmacy_id', $pharmacyId)
            ->whereNotNull('user_id')
            ->select('user_id', DB::raw('COUNT(*) as orders_count'), DB::raw('SUM(total) as total_value'))
            ->groupBy('user_id');

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->limit(200)->get()->map(function ($row) use ($pharmacyId) {
            $user = User::find($row->user_id);
            if (!$user) {
                return null;
            }
            $pharmacy = Pharmacy::find($pharmacyId);
            $balance = $pharmacy ? $this->balanceFor($pharmacy, (int) $row->user_id) : 0;
            return [
                'user_id' => (int) $row->user_id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'orders_count' => (int) $row->orders_count,
                'total_value' => (float) $row->total_value,
                'points' => $balance,
            ];
        })->filter()->values();
    }
}