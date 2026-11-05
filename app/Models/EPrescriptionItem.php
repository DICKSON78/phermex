<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EPrescriptionItem extends Model
{
    protected $table = 'eprescription_items';

    protected $fillable = [
        'eprescription_id',
        'drug_name',
        'dosage',
        'quantity',
        'frequency',
        'duration_days',
        'instructions',
    ];

    public function prescription()
    {
        return $this->belongsTo(EPrescription::class);
    }
}
