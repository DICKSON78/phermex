<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DrugRecall extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'drug_id',
        'recall_number',
        'recall_reason',
        'severity',
        'manufacturer',
        'batch_numbers',
        'date_issued',
        'date_acknowledged',
        'affected_quantity',
        'returned_quantity',
        'status',
        'notes',
    ];

    protected $casts = [
        'batch_numbers' => 'array',
        'date_issued' => 'date',
        'date_acknowledged' => 'date',
        'affected_quantity' => 'integer',
        'returned_quantity' => 'integer',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function drug(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }

    public function acknowledge(): void
    {
        $this->update([
            'status' => 'acknowledged',
            'date_acknowledged' => now()->toDateString(),
        ]);
    }

    public function process(): void
    {
        $this->update(['status' => 'in_progress']);
    }

    public function complete(int $returnedQty): void
    {
        $this->update([
            'status' => 'completed',
            'returned_quantity' => $returnedQty,
        ]);
    }

    public static function getSeverityColor(string $severity): string
    {
        return match ($severity) {
            'class_i' => 'red',
            'class_ii' => 'yellow',
            'class_iii' => 'blue',
            default => 'gray',
        };
    }
}
