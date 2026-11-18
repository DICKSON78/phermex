<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SupportTicket::with(['pharmacy', 'user', 'assignee']);

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('priority')) {
                $query->where('priority', $request->input('priority'));
            }

            if ($request->filled('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            if ($request->filled('category')) {
                $query->where('category', $request->input('category'));
            }

            if ($request->filled('assigned_to')) {
                $query->where('assigned_to', $request->input('assigned_to'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('subject', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $tickets = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch tickets.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'nullable|exists:pharmacies,id',
                'subject' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'category' => 'nullable|string|max:100',
                'assigned_to' => 'nullable|exists:users,id',
            ]);

            $validated['user_id'] = $request->user()->id;
            $validated['priority'] = $validated['priority'] ?? 'medium';
            $validated['status'] = 'open';

            $ticket = SupportTicket::create($validated);
            $this->notifyNewTicket($ticket);

            return response()->json([
                'message' => 'Support ticket created.',
                'data' => $ticket->load(['pharmacy', 'user', 'assignee']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $ticket = SupportTicket::with(['pharmacy', 'user', 'assignee', 'replies.user'])
                ->findOrFail($id);

            return response()->json(['data' => $ticket]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $ticket = SupportTicket::findOrFail($id);
            $ticket->delete();

            return response()->json(['message' => 'Ticket deleted successfully.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function resolve(Request $request, $id): JsonResponse
    {
        try {
            $ticket = SupportTicket::findOrFail($id);
            $ticket->update([
                'status' => 'resolved',
                'resolved_at' => now(),
            ]);

            return response()->json([
                'message' => 'Ticket marked as resolved.',
                'data' => $ticket->fresh()->load(['pharmacy', 'user', 'assignee']),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to resolve ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function close(Request $request, $id): JsonResponse
    {
        try {
            $ticket = SupportTicket::findOrFail($id);
            $ticket->update([
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Ticket closed.',
                'data' => $ticket->fresh()->load(['pharmacy', 'user', 'assignee']),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to close ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function reply(Request $request, $id): JsonResponse
    {
        try {
            $ticket = SupportTicket::findOrFail($id);

            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $reply = TicketReply::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            // Replying reopens a finished ticket so the customer can continue
            // the conversation, matching the manufacturer/customer portals.
            if (in_array($ticket->status, ['open', 'resolved', 'closed'], true)) {
                $ticket->update([
                    'status' => 'in_progress',
                    'resolved_at' => null,
                    'closed_at' => null,
                ]);
            }

            $this->notifyReply($ticket, $request->user(), $validated['message']);

            return response()->json([
                'message' => 'Reply added.',
                'data' => $reply->load('user'),
            ], 201);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add reply.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function ownerIndex(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->pharmacy()->pluck('pharmacies.id');

            $query = SupportTicket::with(['pharmacy', 'user', 'assignee', 'replies.user'])
                ->where(function ($q) use ($user, $pharmacyIds) {
                    $q->where('user_id', $user->id)
                        ->orWhereIn('pharmacy_id', $pharmacyIds);
                });

            $tickets = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch tickets.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function ownerStore(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'subject' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'category' => 'nullable|string|max:100',
            ]);

            $validated['user_id'] = $request->user()->id;
            $validated['priority'] = $validated['priority'] ?? 'medium';
            $validated['status'] = 'open';

            $ticket = SupportTicket::create($validated);
            $this->notifyNewTicket($ticket);

            return response()->json([
                'message' => 'Support ticket created. The admin team will respond shortly.',
                'data' => $ticket->load(['pharmacy', 'user', 'assignee']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function ownerReply(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->pharmacy()->pluck('pharmacies.id');

            $ticket = SupportTicket::where('id', $id)
                ->where(function ($q) use ($user, $pharmacyIds) {
                    $q->where('user_id', $user->id)
                        ->orWhereIn('pharmacy_id', $pharmacyIds);
                })
                ->firstOrFail();

            $validated = $request->validate([
                'message' => 'required|string',
            ]);

            $reply = TicketReply::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $validated['message'],
            ]);

            if (in_array($ticket->status, ['resolved', 'closed'], true)) {
                $ticket->update([
                    'status' => 'in_progress',
                    'resolved_at' => null,
                    'closed_at' => null,
                ]);
            }

            $this->notifyReply($ticket, $user, $validated['message']);

            return response()->json([
                'message' => 'Reply added.',
                'data' => $reply->load('user'),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add reply.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    private function notifyNewTicket(SupportTicket $ticket): void
    {
        $user = $ticket->user;
        $source = $user?->role === 'manufacturer'
            ? 'Manufacturer'
            : ($user?->role === 'wholesaler' ? 'Wholesaler' : 'Pharmacy');

        app(NotificationService::class)->notifyAdmins(
            'New support ticket',
            ($user->name ?? 'Someone')." ({$source}): ".mb_substr($ticket->subject, 0, 140),
            'info',
            '/dashboard/support/'.$ticket->id,
            $ticket->user_id
        );
    }

    private function notifyReply(SupportTicket $ticket, $actor, string $message): void
    {
        $notifications = app(NotificationService::class);
        $excerpt = mb_substr($message, 0, 140);

        if ($actor->isAdmin()) {
            $notifications->notifyUser(
                (int) $ticket->user_id,
                $ticket->pharmacy_id ? (int) $ticket->pharmacy_id : null,
                'Support team replied',
                $excerpt,
                'info',
                $ticket->pharmacy_id ? '/dashboard/support' : '/dashboard/notifications'
            );
        } else {
            $notifications->notifyAdmins(
                'New support reply',
                ($actor->name ?? 'Someone').': '.$excerpt,
                'info',
                '/dashboard/support/'.$ticket->id,
                $actor->id
            );
        }
    }
}
