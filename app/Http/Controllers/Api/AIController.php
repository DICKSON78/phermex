<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Drug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function salesHistory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'required|integer|exists:pharmacies,id',
            'drug_id' => 'required|integer|exists:drugs,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $items = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.drug_id', $request->drug_id)
            ->where('orders.pharmacy_id', $request->pharmacy_id)
            ->whereBetween('orders.created_at', [$request->start_date, $request->end_date])
            ->whereIn('orders.status', ['delivered', 'confirmed', 'completed'])
            ->selectRaw('DATE(orders.created_at) as date, SUM(order_items.quantity) as quantity')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($i) => ['date' => $i->date, 'quantity' => (int) $i->quantity]);

        return response()->json($items);
    }

    public function totalSalesHistory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'required|integer|exists:pharmacies,id',
            'days' => 'integer|min:30|max:730',
        ]);

        $days = $request->input('days', 365);
        
        $sales = Order::where('pharmacy_id', $request->pharmacy_id)
            ->whereIn('status', ['delivered', 'confirmed', 'completed'])
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, SUM(total) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($s) => ['date' => $s->date, 'total' => (float) $s->total]);

        return response()->json($sales);
    }

    public function interactions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'nullable|integer|exists:pharmacies,id',
            'days' => 'integer|min:30|max:365',
        ]);

        $days = $request->input('days', 180);
        $pharmacyId = $request->input('pharmacy_id');

        $query = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.created_at', '>=', now()->subDays($days))
            ->whereIn('orders.status', ['delivered', 'confirmed', 'completed']);

        if ($pharmacyId) {
            $query->where('orders.pharmacy_id', $pharmacyId);
        }

        $interactions = $query->select([
            'orders.user_id',
            'order_items.drug_id',
            'order_items.quantity',
            'orders.created_at'
        ])->get()
        ->map(fn ($i) => [
            'user_id' => $i->user_id,
            'drug_id' => $i->drug_id,
            'quantity' => (int) $i->quantity,
            'date' => $i->created_at->toDateString(),
        ]);

        return response()->json($interactions);
    }

    public function topSelling(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'required|integer|exists:pharmacies,id',
            'limit' => 'integer|min:1|max:50',
        ]);

        $drugs = Drug::join('order_items', 'drugs.id', '=', 'order_items.drug_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.pharmacy_id', $request->pharmacy_id)
            ->whereIn('orders.status', ['delivered', 'confirmed', 'completed'])
            ->where('orders.created_at', '>=', now()->subDays(90))
            ->select('drugs.id', 'drugs.name', 'drugs.price', 'drugs.category')
            ->selectRaw('SUM(order_items.quantity) as total_quantity')
            ->groupBy('drugs.id', 'drugs.name', 'drugs.price', 'drugs.category')
            ->orderByDesc('total_quantity')
            ->limit($request->input('limit', 10))
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'price' => (float) $d->price,
                'category' => $d->category,
            ]);

        return response()->json($drugs);
    }

    public function drugsBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drug_ids' => 'required|array',
            'drug_ids.*' => 'integer|exists:drugs,id',
        ]);

        $drugs = Drug::whereIn('id', $request->drug_ids)
            ->select('id', 'name', 'price', 'category')
            ->get()
            ->keyBy('id');

        return response()->json($drugs->values());
    }
}