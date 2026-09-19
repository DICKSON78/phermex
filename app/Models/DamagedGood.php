<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamagedGood extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'drug_id',
        'damage_number',
        'damage_date',
        'quantity',
        'unit_cost',
        'total_loss',
        'reason',
        'reported_by',
        'disposal_method',
        'notes',
    ];

    protected $casts = [
        'damage_date' => 'date',
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_loss' => 'decimal:2',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function drug(): BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function process(string $disposalMethod): void
    {
        $this->update(['disposal_method' => $disposalMethod]);
    }

    public static function generateDamageNumber(int $pharmacyId): string
    {
        $latest = self::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('damage_number');

        if ($latest) {
            $num = (int) str_replace('DG-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return 'DG-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
