<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DrugCategory extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'name',
        'description',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function drugs(): HasMany
    {
        return $this->hasMany(Drug::class, 'category_id');
    }
}
