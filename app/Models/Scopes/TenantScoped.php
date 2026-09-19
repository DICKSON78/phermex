<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait TenantScoped
{
    public static function bootTenantScoped(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            $user = Auth::guard('sanctum')->user();

            if (!$user || !$user->isTenantUser()) {
                return;
            }

            $ids = $user->accessiblePharmacyIds();

            if ($ids) {
                $builder->whereIn($builder->qualifyColumn('pharmacy_id'), $ids);
            } else {
                $builder->whereRaw('1 = 0');
            }
        });
    }
}
