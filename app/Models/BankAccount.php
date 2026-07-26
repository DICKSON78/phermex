<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'account_id',
        'bank_name',
        'account_name',
        'account_number',
        'swift_code',
        'opening_balance',
        'current_balance',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function getBalance()
    {
        return (float) $this->current_balance;
    }

    public function reconcile(int $transactionId): bool
    {
        $transaction = $this->transactions()->find($transactionId);
        if (!$transaction || $transaction->reconciled) {
            return false;
        }

        $transaction->update([
            'reconciled' => true,
            'reconciled_at' => now(),
        ]);

        return true;
    }
}
