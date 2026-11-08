<?php

namespace App\Services;

use App\Models\Drug;
use App\Models\ManufacturerOrder;
use App\Models\ManufacturerOrderEvent;
use App\Models\ManufacturerProduct;
use App\Models\User;
use App\Models\WholesaleInventory;
use App\Models\WholesaleOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Cross-portal stock movement.
 *
 * The three ledgers stay separate on purpose:
 *  - manufacturers hold production stock (manufacturer_products),
 *  - wholesalers hold distribution stock (wholesale_inventory),
 *  - pharmacies hold dispensary stock (drugs).
 *
 * A delivery moves units one step down that chain inside the same database
 * transaction that marks the order delivered, so an order can never be
 * "delivered" without the buyer's stock reflecting it.
 */
class SupplyChainService
{
    /** Units accepted by the pharmacy `drugs.unit` enum. */
    private const PHARMACY_UNITS = ['tablets', 'capsules', 'bottles', 'tubes', 'vials'];

    public function receiveWholesaleOrder(WholesaleOrder $order): void
    {
        $order->loadMissing('lineItems', 'lineItems.inventory');

        foreach ($order->lineItems as $item) {
            if ($item->quantity_received >= $item->quantity) {
                continue;
            }

            $quantity = $item->quantity - $item->quantity_received;
            $this->stockPharmacyDrug($order->pharmacy_id, $item, $quantity);
            $item->update(['quantity_received' => $item->quantity]);
        }
    }

    public function receiveManufacturerOrder(ManufacturerOrder $order): void
    {
        $order->loadMissing('lineItems', 'lineItems.product');

        foreach ($order->lineItems as $item) {
            if ($item->quantity_received >= $item->quantity) {
                continue;
            }

            $quantity = $item->quantity - $item->quantity_received;
            $this->stockWholesaler($order->wholesaler_id, $item, $quantity);
            $item->update(['quantity_received' => $item->quantity]);
        }
    }

    public function restoreManufacturerStock(ManufacturerOrder $order): void
    {
        $order->loadMissing('lineItems');

        foreach ($order->lineItems as $item) {
            $restore = $item->quantity - $item->quantity_received;

            if ($restore > 0 && $item->manufacturer_product_id) {
                ManufacturerProduct::whereKey($item->manufacturer_product_id)
                    ->increment('quantity', $restore);
            }
        }
    }

    public function addManufacturerEvent(
        ManufacturerOrder $order,
        string $status,
        string $title,
        ?string $description,
        ?User $actor
    ): void {
        ManufacturerOrderEvent::create([
            'manufacturer_order_id' => $order->id,
            'status' => $status,
            'title' => $title,
            'description' => $description,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
        ]);
    }

    /**
     * Add a delivered wholesale line to the pharmacy's own inventory.
     * Matching on name + batch keeps repeat deliveries on one drug row instead
     * of creating a duplicate every time.
     */
    private function stockPharmacyDrug(string $pharmacyId, $item, int $quantity): void
    {
        $name = trim((string) $item->drug_name);
        if ($name === '') {
            return;
        }

        $inventory = $item->relationLoaded('inventory') ? $item->inventory : null;
        $batch = $inventory?->batch_number;

        $query = Drug::withoutGlobalScopes()
            ->where('pharmacy_id', $pharmacyId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);

        if ($batch) {
            $query->where('batch_number', $batch);
        }

        $drug = $query->first();

        $unit = strtolower(trim((string) ($item->unit ?: 'tablets')));
        if (! in_array($unit, self::PHARMACY_UNITS, true)) {
            $unit = 'tablets';
        }

        if ($drug) {
            $drug->increment('quantity', $quantity);
            $drug->update([
                'buying_price' => (float) $item->unit_price > 0 ? $item->unit_price : $drug->buying_price,
                'stock_source' => 'wholesale',
                'last_received_at' => now(),
            ]);
            return;
        }

        Drug::create([
            'pharmacy_id' => $pharmacyId,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'generic_name' => null,
            'manufacturer' => $inventory?->manufacturer ?? null,
            'buying_price' => $item->unit_price,
            'selling_price' => $item->unit_price,
            'wholesale_price' => $item->unit_price,
            'quantity' => $quantity,
            'stock_source' => 'wholesale',
            'last_received_at' => now(),
            'unit' => $unit,
            'reorder_level' => 10,
            'expiry_date' => $inventory?->expiry_date ?? now()->addYear()->toDateString(),
            'batch_number' => $batch,
            'requires_prescription' => false,
            'is_published' => true,
        ]);
    }

    /**
     * Add a delivered manufacturer line to the wholesaler's catalogue.
     * The manufacturer's SKU/strength are kept in the drug name so the
     * wholesaler can see exactly which production batch arrived.
     */
    private function stockWholesaler(string $wholesalerId, $item, int $quantity): void
    {
        $name = trim((string) $item->product_name);
        if ($name === '') {
            return;
        }

        $product = $item->relationLoaded('product') ? $item->product : null;
        // `wholesale_inventory.unit` is free text, so keep the manufacturer's
        // dosage form when we know it ("tablets", "capsules", …).
        $unit = strtolower(trim((string) ($product?->dosage_form ?: 'unit'))) ?: 'unit';
        $batch = $item->batch_number ?: $product?->batch_number
            ?: 'MFG-'.strtoupper(Str::random(6));

        $query = WholesaleInventory::where('wholesaler_id', $wholesalerId)
            ->whereRaw('LOWER(drug_name) = ?', [mb_strtolower($name)])
            ->where('batch_number', $batch);

        $inventory = $query->first();

        if ($inventory) {
            $inventory->increment('quantity_in_stock', $quantity);
            $inventory->update([
                'unit_price' => $item->unit_price,
                'status' => $this->stockStatus((int) $inventory->fresh()->quantity_in_stock),
            ]);
            return;
        }

        WholesaleInventory::create([
            'wholesaler_id' => $wholesalerId,
            // `drug_id` is required and participates in a unique key. Using the
            // production SKU keeps repeat batches of the same product stable.
            'drug_id' => 'MFG-'.($product?->sku ?: $product?->id ?: Str::upper(Str::random(8))),
            'drug_name' => $name,
            'unit' => $unit,
            'pack_size' => 1,
            'category' => $product?->category,
            'batch_number' => $batch,
            'quantity_in_stock' => $quantity,
            'minimum_stock_level' => 10,
            'reorder_quantity' => 50,
            'unit_price' => $item->unit_price,
            'expiry_date' => $product?->expiry_date ?? now()->addYear()->toDateString(),
            'manufacture_date' => now()->toDateString(),
            'status' => $this->stockStatus($quantity),
        ]);
    }

    public function stockStatus(int $quantity): string
    {
        if ($quantity <= 0) {
            return 'out_of_stock';
        }

        return $quantity <= 10 ? 'low_stock' : 'available';
    }

    /**
     * Wrap multi-step stock work so a failed delivery leaves every ledger at
     * its previous value.
     */
    public function transaction(callable $callback)
    {
        return DB::transaction($callback);
    }
}
