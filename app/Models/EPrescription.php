<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EPrescription extends Model
{
    protected $table = 'eprescriptions';

    protected $fillable = [
        'prescription_id',
        'patient_id',
        'patient_name',
        'patient_phone',
        'patient_email',
        'patient_dob',
        'patient_national_id',
        'healthcare_facility',
        'moh_facility_code',
        'prescriber_name',
        'prescriber_license',
        'prescriber_specialty',
        'notes',
        'valid_until',
        'status',
        'qr_code',
        'fulfilled_at',
        'fulfilled_by_pharmacy',
        'fulfillment_notes',
    ];

    protected $casts = [
        'valid_until' => 'datetime',
        'fulfilled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(EPrescriptionItem::class);
    }

    public function deliveryTracking()
    {
        return $this->hasOne(DeliveryTracking::class, 'prescription_id', 'id');
    }
}
