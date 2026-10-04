<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyReel extends Model
{
    use HasFactory;

    protected $table = 'pharmacy_reels';

    protected $fillable = [
        'pharmacy_id',
        'title',
        'description',
        'media_type',
        'media_url',
        'thumbnail_url',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'pharmacy_id' => 'integer',
            'views' => 'integer',
        ];
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }
}
