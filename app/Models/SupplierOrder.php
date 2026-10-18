<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierOrder extends Model
{
    use HasFactory, TenantScoped;

    protected $fillable = [
        'pharmacy_id',
        'supplier_id',
        'order_code',
        'status',
        'notes',
        'created_by',
        'approved_by',
        'approved_at',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierOrderItem::class);
    }

    public function submit(): bool
    {
        if ($this->status !== 'draft' || $this->items()->count() === 0) {
            return false;
        }

        $this->update(['status' => 'submitted']);

        return true;
    }

    public function approve(int $userId): bool
    {
        if ($this->status !== 'submitted') {
            return false;
        }

        $this->update([
            'status' => 'approved',
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

    public static function generateOrderCode(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('order_code');

        if ($latest) {
            $num = (int) str_replace('SO-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'SO-'.str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
