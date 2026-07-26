<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'transfer_number',
        'from_location',
        'to_location',
        'status',
        'total_items',
        'total_value',
        'requested_by',
        'approved_by',
        'approved_at',
        'shipped_at',
        'received_at',
        'notes',
    ];

    protected $casts = [
        'total_items' => 'integer',
        'total_value' => 'decimal:2',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approve(User $user): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }
        $this->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);
        return true;
    }

    public function ship(): bool
    {
        if (!in_array($this->status, ['approved'])) {
            return false;
        }
        $this->update([
            'status' => 'in_transit',
            'shipped_at' => now(),
        ]);
        return true;
    }

    public function receive(): bool
    {
        if ($this->status !== 'in_transit') {
            return false;
        }
        $this->update([
            'status' => 'completed',
            'received_at' => now(),
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

    public static function generateTransferNumber(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('transfer_number');

        if ($latest) {
            $num = (int) str_replace('ST-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'ST-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
