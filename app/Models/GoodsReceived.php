<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceived extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'purchase_order_id',
        'grn_number',
        'received_date',
        'received_by',
        'supplier_id',
        'total_items',
        'total_value',
        'status',
        'quality_check',
        'quality_notes',
        'notes',
    ];

    protected $casts = [
        'received_date' => 'date',
        'total_items' => 'integer',
        'total_value' => 'decimal:2',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function performQualityCheck(string $result, ?string $notes = null): void
    {
        $this->update([
            'quality_check' => $result,
            'quality_notes' => $notes,
        ]);
    }

    public static function generateGrnNumber(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('grn_number');

        if ($latest) {
            $num = (int) str_replace('GRN-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'GRN-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
