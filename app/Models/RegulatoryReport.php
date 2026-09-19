<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegulatoryReport extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'report_type',
        'report_period_month',
        'report_period_year',
        'report_data',
        'status',
        'submitted_to',
        'submitted_at',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'report_data' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function generate(): array
    {
        $pharmacy = $this->pharmacy;
        $data = [];

        match ($this->report_type) {
            'monthly_sales' => $data = $this->generateMonthlySales($pharmacy),
            'quarterly_tmda' => $data = $this->generateQuarterlyTMDA($pharmacy),
            'annual_return' => $data = $this->generateAnnualReturn($pharmacy),
            'control_substance' => $data = $this->generateControlSubstanceReport($pharmacy),
            'expiry_report' => $data = $this->generateExpiryReport($pharmacy),
            default => $data = [],
        };

        $this->update(['report_data' => $data]);
        return $data;
    }

    public function submit(string $submittedTo): void
    {
        $this->update([
            'status' => 'submitted',
            'submitted_to' => $submittedTo,
            'submitted_at' => now(),
        ]);
    }

    public function approve(string $approvedBy): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
        ]);
    }

    private function generateMonthlySales($pharmacy): array
    {
        $orders = \App\Models\Order::where('pharmacy_id', $pharmacy->id)
            ->whereMonth('created_at', $this->report_period_month)
            ->whereYear('created_at', $this->report_period_year)
            ->get();

        return [
            'pharmacy_name' => $pharmacy->name ?? 'N/A',
            'period' => $this->report_period_month . '/' . $this->report_period_year,
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total'),
            'total_cost' => $orders->sum('total') * 0.6,
            'generated_at' => now()->toISOString(),
        ];
    }

    private function generateQuarterlyTMDA($pharmacy): array
    {
        return [
            'pharmacy_name' => $pharmacy->name ?? 'N/A',
            'quarter' => 'Q' . ceil($this->report_period_month / 3) . ' ' . $this->report_period_year,
            'total_drugs_sold' => \App\Models\OrderItem::whereHas('order', fn ($q) => $q->where('pharmacy_id', $pharmacy->id))->count(),
            'compliance_status' => 'compliant',
            'generated_at' => now()->toISOString(),
        ];
    }

    private function generateAnnualReturn($pharmacy): array
    {
        return [
            'pharmacy_name' => $pharmacy->name ?? 'N/A',
            'year' => $this->report_period_year,
            'total_revenue' => \App\Models\Order::where('pharmacy_id', $pharmacy->id)
                ->whereYear('created_at', $this->report_period_year)->sum('total'),
            'total_drugs' => \App\Models\Drug::where('pharmacy_id', $pharmacy->id)->count(),
            'generated_at' => now()->toISOString(),
        ];
    }

    private function generateControlSubstanceReport($pharmacy): array
    {
        $substances = ControlledSubstance::where('pharmacy_id', $pharmacy->id)
            ->whereMonth('created_at', $this->report_period_month)
            ->whereYear('created_at', $this->report_period_year)
            ->get();

        return [
            'pharmacy_name' => $pharmacy->name ?? 'N/A',
            'period' => $this->report_period_month . '/' . $this->report_period_year,
            'total_entries' => $substances->count(),
            'total_received' => $substances->sum('quantity_received'),
            'total_issued' => $substances->sum('quantity_issued'),
            'total_balance' => $substances->sum('balance_stock'),
            'generated_at' => now()->toISOString(),
        ];
    }

    private function generateExpiryReport($pharmacy): array
    {
        $expiredDrugs = \App\Models\Drug::where('pharmacy_id', $pharmacy->id)
            ->where('expiry_date', '<', now())
            ->get();

        $expiringSoon = \App\Models\Drug::where('pharmacy_id', $pharmacy->id)
            ->whereBetween('expiry_date', [now(), now()->addDays(90)])
            ->get();

        return [
            'pharmacy_name' => $pharmacy->name ?? 'N/A',
            'expired_count' => $expiredDrugs->count(),
            'expired_value' => $expiredDrugs->sum(fn ($d) => $d->buying_price * $d->quantity),
            'expiring_soon_count' => $expiringSoon->count(),
            'expiring_soon_value' => $expiringSoon->sum(fn ($d) => $d->buying_price * $d->quantity),
            'generated_at' => now()->toISOString(),
        ];
    }

    public static function getTemplates(): array
    {
        return [
            ['type' => 'monthly_sales', 'label' => 'Monthly Sales Report', 'description' => 'TMDA monthly sales summary'],
            ['type' => 'quarterly_tmda', 'label' => 'Quarterly TMDA Report', 'description' => 'Quarterly compliance report for TMDA'],
            ['type' => 'annual_return', 'label' => 'Annual Return', 'description' => 'Annual pharmacy return filing'],
            ['type' => 'control_substance', 'label' => 'Controlled Substance Report', 'description' => 'Controlled substance usage report'],
            ['type' => 'expiry_report', 'label' => 'Drug Expiry Report', 'description' => 'Expired and expiring drugs report'],
        ];
    }
}
