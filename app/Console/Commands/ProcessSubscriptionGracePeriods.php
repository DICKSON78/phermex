<?php

namespace App\Console\Commands;

use App\Services\SubscriptionGracePeriodService;
use Illuminate\Console\Command;

class ProcessSubscriptionGracePeriods extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:process-grace-periods';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process expired subscriptions and activate grace periods, disable expired grace periods';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionGracePeriodService $service): int
    {
        $this->info('Processing subscription grace periods...');

        try {
            // Activate grace period for expired subscriptions
            $this->info('Activating grace periods for expired subscriptions...');
            $service->processExpiredSubscriptions();

            // Disable access for pharmacies with expired grace periods
            $this->info('Disabling access for expired grace periods...');
            $service->disableExpiredGracePeriods();

            $this->info('✓ Subscription grace period processing completed successfully');
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('✗ Error processing grace periods: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
