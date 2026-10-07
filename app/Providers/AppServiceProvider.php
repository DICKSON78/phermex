<?php

namespace App\Providers;

use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\PersonalAccessToken;
use App\Models\Pharmacy;
use App\Support\CacheKey;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        $this->registerReadCacheBusting();
    }

    /**
     * Bump cache versions when catalogue data mutates so the versioned read
     * caches (nearby pharmacies, pharmacy drug lists, barcode lookups, ...)
     * never serve stale data.
     *
     * Stock quantity changes via increment/decrement do not fire saved events,
     * so the read caches survive normal sales traffic.
     */
    private function registerReadCacheBusting(): void
    {
        $bumpPharmacy = static fn () => CacheKey::bump('pharmacies');

        Pharmacy::saved($bumpPharmacy);
        Pharmacy::deleted($bumpPharmacy);

        $bumpDrug = static fn (Drug $drug) => CacheKey::bump('drugs', 'drugs:'.$drug->pharmacy_id);

        Drug::saved($bumpDrug);
        Drug::deleted($bumpDrug);

        $bumpCategory = static fn (DrugCategory $category) => CacheKey::bump('drugs:'.$category->pharmacy_id);

        DrugCategory::saved($bumpCategory);
        DrugCategory::deleted($bumpCategory);
    }
}
