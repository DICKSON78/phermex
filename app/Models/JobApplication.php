<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    protected $fillable = [
        'job_listing_id',
        'full_name',
        'email',
        'phone',
        'cover_letter',
        'cv_path',
        'portfolio_url',
        'linkedin_url',
        'status',
        'admin_notes',
    ];

    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }
}
