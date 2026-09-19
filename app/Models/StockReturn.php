<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockReturn extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'supplier_id',
        'return_number',
        'return_date',
        'reason',
        'status',
        'total_items',
        'total_value',
        'notes',
    ];

    protected $casts = [
        'return_date' => 'date',
        'total_items' => 'integer',
        'total_value' => 'decimal:2',
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
        return $this->hasMany(StockReturnItem::class);
    }

    public function approve(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }
        $this->update(['status' => 'approved']);
        return true;
    }

    public function ship(): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }
        $this->update(['status' => 'shipped']);
        return true;
    }

    public function refund(): bool
    {
        if ($this->status !== 'shipped') {
            return false;
        }
        $this->update(['status' => 'refunded']);
        return true;
    }

    public static function generateReturnNumber(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('return_number');

        if ($latest) {
            $num = (int) str_replace('SR-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'SR-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
