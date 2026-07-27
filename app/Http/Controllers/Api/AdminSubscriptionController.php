<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Subscription::with(['pharmacy', 'plan']);

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('plan')) {
                $query->where('plan', $request->input('plan'));
            }

            $subscriptions = $query->latest()->get();

            $active = $subscriptions->where('status', 'active')->count();
            $trial = $subscriptions->where('status', 'trial')->count();
            $expired = $subscriptions->where('status', 'expired')->count();
            $suspended = $subscriptions->where('status', 'suspended')->count();

            $thisMonth = now()->month;
            $thisYear = now()->year;
            $monthlyRevenue = $subscriptions->where('status', 'active')
                ->filter(fn($s) => $s->created_at && $s->created_at->month === $thisMonth && $s->created_at->year === $thisYear)
                ->sum('amount');

            $churnRate = $subscriptions->count() > 0
                ? round(($expired / $subscriptions->count()) * 100, 1)
                : 0;

            return response()->json([
                'data' => [
                    'subscriptions' => $subscriptions,
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
}
