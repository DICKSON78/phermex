<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'photo',
        'role',
        'location',
        'street',
        'road',
        'user_code',
        'is_active',
        'is_verified',
        'current_pharmacy_id',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'is_verified' => 'boolean',
        'password' => 'hashed',
    ];

    public static function generateUserCode(): string
    {
        do {
            $code = 'USR-' . strtoupper(Str::random(8));
        } while (static::where('user_code', $code)->exists());

        return $code;
    }

    public function pharmacy(): BelongsToMany
    {
        return $this->belongsToMany(Pharmacy::class, 'pharmacy_user');
    }

    public function currentPharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class, 'current_pharmacy_id');
    }

    public function accessiblePharmacies()
    {
        if ($this->isOwner()) {
            $owned = Pharmacy::where('owner_id', $this->id)->pluck('id');
            $pivoted = $this->pharmacy()->pluck('pharmacies.id');

            return Pharmacy::whereIn('id', $owned->merge($pivoted)->unique())->orderBy('pharmacy_name')->get();
        }

        return $this->pharmacy()->orderBy('pharmacy_name')->get();
    }

    public function resolveCurrentPharmacyId(): ?int
    {
        if ($this->current_pharmacy_id) {
            return $this->current_pharmacy_id;
        }

        $first = $this->accessiblePharmacies()->first();

        return $first?->id;
    }

    public function isTenantUser(): bool
    {
        return in_array($this->role, ['owner', 'pharmacist', 'cashier', 'delivery']);
    }

    public function accessiblePharmacyIds(): array
    {
        return $this->accessiblePharmacies()->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    public function customerAppOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isPharmacist(): bool
    {
        return $this->role === 'pharmacist';
    }

    public function isCashier(): bool
    {
        return $this->role === 'cashier';
    }

    public function isDelivery(): bool
    {
        return $this->role === 'delivery';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }
}
