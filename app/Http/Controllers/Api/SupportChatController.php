<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * One support conversation API for every authenticated panel.
 *
 * Pharmacy users (owner and staff), manufacturers, wholesalers and platform
 * admins all use the same endpoints. The source of a ticket is derived from
 * the authenticated user's role, so a client cannot impersonate another
 * panel or attach a ticket to a pharmacy it does not own.
 */
class SupportChatController extends Controller
{
    /** @var array<string, string> */
    private const SOURCES = [
        'admin' => 'Superadmin',
        'owner' => 'Pharmacy',
        'pharmacist' => 'Pharmacy',
        'cashier' => 'Pharmacy',
        'delivery' => 'Pharmacy',
        'manufacturer' => 'Manufacturer',
        'wholesaler' => 'Wholesaler',
        'customer' => 'Customer',
    ];

    public function index(Request $request): JsonResponse
    {
        try {
            $tickets = $this->visibleTickets($request)
                ->latest()
                ->limit(50)
                ->get()
                ->map(function (SupportTicket $ticket) {
                    $data = $ticket->toArray();
                    $data['source'] = $this->sourceFor($ticket);

                    return $data;
                });

            return response()->json([
                'message' => 'Conversations retrieved.',
                'tickets' => $tickets,
                'data' => $tickets,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to load conversations.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'subject' => 'sometimes|string|max:255',
                'description' => 'required|string|max:5000',
                'priority' => 'sometimes|in:low,medium,high,urgent',
            ]);

            $user = $request->user();
            $source = $this->sourceFor($user);
            $message = trim($validated['description']);

            $ticket = SupportTicket::create([
                'pharmacy_id' => $user->isTenantUser() ? $user->resolveCurrentPharmacyId() : null,
                'user_id' => $user->id,
                'subject' => $validated['subject'] ?? Str::limit($message, 60),
                'description' => $message,
                'priority' => $validated['priority'] ?? 'medium',
                'category' => 'Support Chat: '.$source,
                'status' => 'open',
            ]);

            $ticket->load(['user', 'pharmacy', 'replies.user']);

            app(NotificationService::class)->notifyAdmins(
                'New support chat',
                "{$user->name} ({$source}): ".Str::limit($message, 140),
                'info',
                '/dashboard/support/'.$ticket->id,
                $user->id
            );

            return response()->json([
                'message' => 'Message sent. The support team will reply shortly.',
                'ticket' => $this->withSource($ticket),
                'data' => $this->withSource($ticket),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send message.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $user = $request->user();
            $ticket = $this->visibleTickets($request)->findOrFail($id);
            $message = trim($validated['message']);

            $reply = TicketReply::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $message,
            ]);

            // A reply from either side reopens a finished conversation.
            if (in_array($ticket->status, ['resolved', 'closed'], true)) {
                $ticket->update([
                    'status' => 'in_progress',
                    'resolved_at' => null,
                    'closed_at' => null,
                ]);
            }

            $notifications = app(NotificationService::class);

            if ($user->isAdmin()) {
                $notifications->notifyUser(
                    (int) $ticket->user_id,
                    $ticket->pharmacy_id ? (int) $ticket->pharmacy_id : null,
                    'Support team replied',
                    Str::limit($message, 140),
                    'info',
                    $this->linkFor($ticket),
                    true
                );
            } else {
                $source = $this->sourceFor($user);
                $notifications->notifyAdmins(
                    'New support chat reply',
                    "{$user->name} ({$source}): ".Str::limit($message, 140),
                    'info',
                    '/dashboard/support/'.$ticket->id,
                    $user->id
                );
            }

            return response()->json([
                'message' => 'Reply sent.',
                'reply' => $reply->load('user'),
                'ticket' => $this->withSource($ticket->fresh()->load(['user', 'pharmacy', 'replies.user'])),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send reply.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    private function visibleTickets(Request $request)
    {
        $user = $request->user();

        // Tenant scope is removed here because conversation access is decided
        // explicitly below (a manufacturer/wholesaler ticket has no pharmacy).
        $query = SupportTicket::withoutGlobalScope('tenant')
            ->with(['user', 'pharmacy', 'replies.user']);

        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isTenantUser()) {
            $pharmacyIds = $user->accessiblePharmacyIds();

            return $query->where(function ($q) use ($user, $pharmacyIds) {
                $q->where('user_id', $user->id)
                    ->orWhereIn('pharmacy_id', $pharmacyIds);
            });
        }

        return $query->where('user_id', $user->id);
    }

    private function sourceFor($subject): string
    {
        if ($subject instanceof SupportTicket) {
            $category = (string) $subject->category;
            if (str_contains($category, ':')) {
                return trim(substr($category, strpos($category, ':') + 1));
            }

            return $this->sourceFor($subject->user);
        }

        $role = is_object($subject) ? ($subject->role ?? null) : $subject;

        return self::SOURCES[$role] ?? 'Pharmacy';
    }

    /** @return array<string, mixed> */
    private function withSource(SupportTicket $ticket): array
    {
        $data = $ticket->toArray();
        $data['source'] = $this->sourceFor($ticket);

        return $data;
    }

    private function linkFor(SupportTicket $ticket): string
    {
        $role = $ticket->user?->role;

        return match ($role) {
            'manufacturer' => '/dashboard/manufacturer/help',
            'wholesaler' => '/dashboard/wholesaler',
            default => '/dashboard/support',
        };
    }
}
