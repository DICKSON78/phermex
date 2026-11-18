<?php

namespace App\Services;

use App\Models\Drug;
use App\Models\Notification;
use App\Models\Pharmacy;
use App\Models\User;

/**
 * Single entry point for in-app alerts and push notifications.
 *
 * The notifications table already exists (user_id, pharmacy_id, title,
 * message, type, link) so no schema change is needed for these alerts.
 */
class NotificationService
{
    public function notifyUser(
        ?int $userId,
        ?int $pharmacyId,
        string $title,
        string $message,
        string $type = 'info',
        ?string $link = null,
        bool $push = true
    ): ?Notification {
        if (!$userId) {
            return null;
        }

        $notification = Notification::create([
            'pharmacy_id' => $pharmacyId,
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
            'link' => $link,
        ]);

        if ($push) {
            app(FcmService::class)->sendToUser($userId, $title, $message, [
                'type' => $type,
                'link' => (string) $link,
                'notification_id' => (string) $notification->id,
            ]);
        }

        return $notification;
    }

    /** Notify every platform admin (the superadmin support inbox). */
    public function notifyAdmins(
        string $title,
        string $message,
        string $type = 'info',
        ?string $link = null,
        ?int $exceptUserId = null
    ): void {
        $admins = User::where('role', 'admin')
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->pluck('id');

        foreach ($admins as $adminId) {
            $this->notifyUser((int) $adminId, null, $title, $message, $type, $link, true);
        }
    }

    /** Notify the owner and tenant staff attached to a pharmacy. */
    public function notifyPharmacy(
        Pharmacy $pharmacy,
        string $title,
        string $message,
        string $type = 'warning',
        ?string $link = null
    ): void {
        $userIds = [$pharmacy->owner_id];

        foreach ($pharmacy->users ?? [] as $user) {
            $userIds[] = $user->id;
        }

        foreach (array_unique(array_filter($userIds)) as $userId) {
            $this->notifyUser((int) $userId, $pharmacy->id, $title, $message, $type, $link, true);
        }
    }

    /**
     * Alert the pharmacy when a drug crosses its reorder threshold. Only
     * fires on the crossing (above -> at/below) so repeat sales do not spam.
     */
    public function notifyLowStock(Drug $drug, int $previousQuantity): void
    {
        $current = (int) $drug->quantity;
        $reorder = (int) ($drug->reorder_level ?? 0);

        if ($previousQuantity <= $reorder || $current > $reorder || !$drug->pharmacy_id) {
            return;
        }

        $title = $current === 0 ? 'Out of stock' : 'Low stock alert';
        $message = $current === 0
            ? "{$drug->name} is now out of stock. Reorder immediately."
            : "{$drug->name} has only {$current} units left (reorder level: {$reorder}).";

        // Avoid duplicates when several batches are sold in one transaction.
        $exists = Notification::withoutGlobalScope('tenant')
            ->where('pharmacy_id', $drug->pharmacy_id)
            ->where('title', $title)
            ->where('message', $message)
            ->where('created_at', '>=', now()->subDay())
            ->exists();

        if ($exists) {
            return;
        }

        $pharmacy = Pharmacy::find($drug->pharmacy_id);
        if ($pharmacy) {
            $this->notifyPharmacy(
                $pharmacy,
                $title,
                $message,
                $current === 0 ? 'danger' : 'warning',
                '/dashboard/drugs'
            );
        }
    }
}
