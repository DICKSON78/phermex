<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTake extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'pharmacy_id',
        'stock_take_code',
        'title',
        'count_type',
        'status',
        'category_id',
        'total_items',
        'counted_items',
        'variance_total',
        'notes',
        'started_at',
        'completed_at',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'counted_items' => 'integer',
        'total_items' => 'integer',
        'variance_total' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DrugCategory::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTakeItem::class);
    }

    public function start(int $userId): bool
    {
        if ($this->status !== 'draft' || $this->items()->count() === 0) {
            return false;
        }

        $this->update([
            'status' => 'in_progress',
            'started_at' => now(),
            'created_by' => $userId,
        ]);

        return true;
    }

    public function complete(): array|bool
    {
        $items = $this->items()->get();

        if ($items->isEmpty() || $items->contains(fn ($item) => $item->counted_quantity === null)) {
            return false;
        }

        $variance = $items->sum('variance');

        $this->update([
            'status' => 'completed',
            'counted_items' => $items->count(),
            'total_items' => $items->count(),
            'variance_total' => $variance,
            'completed_at' => now(),
        ]);

        return [
            'total_items' => $items->count(),
            'counted_items' => $items->count(),
            'variance_total' => $variance,
            'items' => $items->map(fn ($item) => [
                'drug_id' => $item->drug_id,
                'system_quantity' => $item->system_quantity,
                'counted_quantity' => $item->counted_quantity,
                'variance' => $item->variance,
            ]),
        ];
    }

    public function approve(int $userId): bool
    {
        if ($this->status !== 'completed') {
            return false;
        }

        foreach ($this->items()->with('drug')->get() as $item) {
            if ($item->variance === 0 || ! $item->drug) {
                continue;
            }

            $drug = Drug::query()->whereKey($item->drug_id)->lockForUpdate()->first();

            if ($drug) {
                $drug->increment('quantity', $item->variance);

                DrugMovement::create([
                    'pharmacy_id' => $this->pharmacy_id,
                    'drug_id' => $item->drug_id,
                    'movement_type' => 'adjustment',
                    'quantity' => $item->variance,
                    'reference_number' => $this->stock_take_code,
                    'notes' => 'Stock take adjustment (physical count): '.$this->stock_take_code,
                    'performed_by' => $userId,
                ]);
            }
        }

        $this->update([
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        return true;
    }

    public function cancel(): bool
    {
        if (in_array($this->status, ['completed', 'cancelled'])) {
            return false;
        }

        $this->update(['status' => 'cancelled']);

        return true;
    }

    public static function generateStockTakeCode(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('stock_take_code');

        if ($latest) {
            $num = (int) str_replace('ST-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'ST-'.str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
