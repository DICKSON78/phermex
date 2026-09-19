<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobListing extends Model
{
    protected $fillable = [
        'title',
        'department',
        'location',
        'type',
        'description',
        'requirements',
        'responsibilities',
        'salary_range',
        'status',
        'is_hot',
        'is_new',
        'closes_at',
    ];

    protected $casts = [
        'is_hot' => 'boolean',
        'is_new' => 'boolean',
        'closes_at' => 'date',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
