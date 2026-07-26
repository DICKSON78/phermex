<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pharmacy_id',
        'supplier_id',
        'order_number',
        'order_date',
        'expected_delivery_date',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
        'payment_status',
        'amount_paid',
        'notes',
        'approved_by',
        'approved_at',
        'received_by',
        'received_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function goodsReceived(): HasMany
    {
        return $this->hasMany(GoodsReceived::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function approve(User $user): bool
    {
        if ($this->status !== 'pending_approval') {
            return false;
        }
        $this->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);
        return true;
    }

    public function cancel(): bool
    {
        if (in_array($this->status, ['received', 'cancelled'])) {
            return false;
        }
        $this->update(['status' => 'cancelled']);
        return true;
    }

    public function receive(User $user): void
    {
        $this->update([
            'status' => 'received',
            'received_by' => $user->id,
            'received_at' => now(),
        ]);
        $this->supplier->updateOrderStats();
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total_cost');
        $this->total = $this->subtotal + $this->tax_amount - $this->discount_amount;
        $this->save();
    }

    public static function generateOrderNumber(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('order_number');

        if ($latest) {
            $num = (int) str_replace('PO-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'PO-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
