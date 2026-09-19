<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'pharmacy_name',
        'service',
        'message',
        'status',
    ];
}
