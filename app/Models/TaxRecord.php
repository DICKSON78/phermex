<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxRecord extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'tax_type',
        'period_month',
        'period_year',
        'taxable_amount',
        'tax_amount',
        'status',
        'filed_date',
        'payment_date',
        'receipt_number',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'taxable_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'filed_date' => 'date',
        'payment_date' => 'date',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public static function getTaxRate(string $taxType): float
    {
        return match ($taxType) {
            'VAT' => 18.0,
            'PAYE' => 30.0,
            'NSSF' => 10.0,
            'NHIF' => 5.0,
            'Housing' => 1.5,
            default => 0,
        };
    }

    public function calculate(): float
    {
        $rate = static::getTaxRate($this->tax_type);
        $this->tax_amount = ($this->taxable_amount * $rate) / 100;
        return $this->tax_amount;
    }

    public function file(): bool
    {
        if ($this->status !== 'draft') {
            return false;
        }
        $this->update([
            'status' => 'filed',
            'filed_date' => now()->toDateString(),
        ]);
        return true;
    }

    public function markPaid(string $receiptNumber): bool
    {
        if ($this->status !== 'filed') {
            return false;
        }
        $this->update([
            'status' => 'paid',
            'payment_date' => now()->toDateString(),
            'receipt_number' => $receiptNumber,
        ]);
        return true;
    }
}
