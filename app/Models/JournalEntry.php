<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class JournalEntry extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'entry_number',
        'entry_date',
        'description',
        'reference_type',
        'reference_id',
        'total_debit',
        'total_credit',
        'status',
        'posted_by',
        'posted_at',
        'reversed_by',
        'reversed_at',
        'reversal_reason',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'total_debit' => 'decimal:2',
        'total_credit' => 'decimal:2',
        'posted_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reverser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public static function generateEntryNumber(int $pharmacyId): string
    {
        $year = now()->format('Y');
        $prefix = 'JE-' . $year . '-';
        $lastEntry = static::where('pharmacy_id', $pharmacyId)
            ->where('entry_number', 'like', $prefix . '%')
            ->orderByDesc('entry_number')
            ->first();

        if ($lastEntry) {
            $lastNum = (int) substr($lastEntry->entry_number, strlen($prefix));
            $nextNum = $lastNum + 1;
        } else {
            $nextNum = 1;
        }

        return $prefix . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
    }

    public function validate(): bool
    {
        return abs($this->total_debit - $this->total_credit) < 0.01;
    }

    public function post(int $userId): bool
    {
        if ($this->status !== 'draft') {
            return false;
        }

        if (!$this->validate()) {
            return false;
        }

        DB::beginTransaction();
        try {
            $this->update([
                'status' => 'posted',
                'posted_by' => $userId,
                'posted_at' => now(),
            ]);

            foreach ($this->lines as $line) {
                $account = $line->account;
                if ($account) {
                    $newBalance = $account->balance + $line->debit - $line->credit;
                    $account->update(['balance' => $newBalance]);
                }
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function reverse(int $userId, string $reason = null): bool
    {
        if ($this->status !== 'posted') {
            return false;
        }

        DB::beginTransaction();
        try {
            foreach ($this->lines as $line) {
                $account = $line->account;
                if ($account) {
                    $newBalance = $account->balance - $line->debit + $line->credit;
                    $account->update(['balance' => $newBalance]);
                }
            }

            $this->update([
                'status' => 'reversed',
                'reversed_by' => $userId,
                'reversed_at' => now(),
                'reversal_reason' => $reason,
            ]);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
