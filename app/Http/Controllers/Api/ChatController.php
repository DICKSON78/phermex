<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Pharmacy;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    // ── Customer endpoints ──────────────────────────────

    public function customerConversations(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;

            $conversations = Message::select('pharmacy_id', DB::raw('MAX(id) as last_id'), DB::raw('COUNT(CASE WHEN receiver_id = '.$userId.' AND is_read = 0 THEN 1 END) as unread_count'))
                ->where('sender_id', $userId)
                ->orWhere('receiver_id', $userId)
                ->groupBy('pharmacy_id')
                ->orderByDesc('last_id')
                ->get()
                ->map(function ($c) use ($userId) {
                    $last = Message::with('sender')->find($c->last_id);
                    $pharmacy = Pharmacy::find($c->pharmacy_id);
                    $otherUser = $last->sender_id === $userId
                        ? User::find($last->receiver_id)
                        : $last->sender;

                    return [
                        'pharmacy_id' => $c->pharmacy_id,
                        'pharmacy_name' => $pharmacy->pharmacy_name ?? 'Pharmacy',
                        'other_user_name' => $otherUser->name ?? 'Staff',
                        'last_message' => $last->message,
                        'last_message_time' => $last->created_at,
                        'unread_count' => (int) $c->unread_count,
                        'message_type' => $last->message_type,
                    ];
                });

            return response()->json([
                'message' => 'Conversations retrieved.',
                'data' => $conversations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve conversations.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function customerMessages(Request $request, string $pharmacyId): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = Pharmacy::findOrFail($pharmacyId);

            // A customer may be answered by the owner or by any pharmacy
            // staff member, so the whole pharmacy team is part of the thread.
            $staffIds = $this->pharmacyStaffIds($pharmacy);

            $messages = Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->where(function ($q) use ($userId, $staffIds) {
                    $q->where(function ($q) use ($userId, $staffIds) {
                        $q->where('sender_id', $userId)->whereIn('receiver_id', $staffIds);
                    })->orWhere(function ($q) use ($userId, $staffIds) {
                        $q->whereIn('sender_id', $staffIds)->where('receiver_id', $userId);
                    });
                })
                ->with('sender')
                ->orderBy('created_at')
                ->get();

            // Mark pharmacy→customer messages as read.
            Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->whereIn('sender_id', $staffIds)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'message' => 'Messages retrieved.',
                'data' => $messages,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve messages.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function customerSend(Request $request, string $pharmacyId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:2000',
                'message_type' => 'sometimes|string|in:text,order_inquiry,prescription_inquiry,emergency',
            ]);

            $user = $request->user();
            $pharmacy = Pharmacy::findOrFail($pharmacyId);

            $msg = Message::create([
                'pharmacy_id' => $pharmacyId,
                'sender_id' => $user->id,
                'receiver_id' => $pharmacy->owner_id,
                'message' => $validated['message'],
                'message_type' => $validated['message_type'] ?? 'text',
                'is_read' => false,
            ]);

            app(NotificationService::class)->notifyPharmacy(
                $pharmacy,
                'New customer chat',
                $user->name.': '.mb_substr($validated['message'], 0, 140),
                'info',
                '/dashboard/chats/'.$user->id
            );

            $msg->load('sender');

            return response()->json([
                'message' => 'Message sent.',
                'data' => $msg,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send message.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function customerMarkRead(Request $request, string $pharmacyId): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = Pharmacy::findOrFail($pharmacyId);

            Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->whereIn('sender_id', $this->pharmacyStaffIds($pharmacy))
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json(['message' => 'Messages marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ── Pharmacy (owner/staff) endpoints ────────────────

    private function pharmacyForTenant(Request $request): ?Pharmacy
    {
        $user = $request->user();

        if (!$user || !$user->isTenantUser()) {
            return null;
        }

        $pharmacyId = $user->resolveCurrentPharmacyId();

        if (!$pharmacyId) {
            return null;
        }

        return Pharmacy::find($pharmacyId);
    }

    /** Owner plus every staff member attached to the pharmacy. */
    private function pharmacyStaffIds(Pharmacy $pharmacy): array
    {
        $ids = [$pharmacy->owner_id];

        foreach ($pharmacy->users()->pluck('users.id') as $userId) {
            $ids[] = $userId;
        }

        return array_values(array_unique(array_filter($ids)));
    }

    public function pharmacyConversations(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = $this->pharmacyForTenant($request);

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $staffIds = $this->pharmacyStaffIds($pharmacy);

            $conversations = Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->where(function ($q) use ($staffIds) {
                    $q->where(function ($q) use ($staffIds) {
                        $q->whereIn('sender_id', $staffIds)->whereNotIn('receiver_id', $staffIds);
                    })->orWhere(function ($q) use ($staffIds) {
                        $q->whereNotIn('sender_id', $staffIds)->whereIn('receiver_id', $staffIds);
                    });
                })
                ->with('sender')
                ->orderByDesc('id')
                ->get()
                ->groupBy(function ($message) use ($staffIds) {
                    return in_array((int) $message->sender_id, $staffIds, true)
                        ? $message->receiver_id
                        : $message->sender_id;
                })
                ->map(function ($items, $otherUserId) use ($userId) {
                    $last = $items->first();
                    $otherUser = User::find($otherUserId);

                    return [
                        'customer_id' => (int) $otherUserId,
                        'customer_name' => $otherUser->name ?? 'Customer',
                        'customer_phone' => $otherUser->phone ?? '',
                        'last_message' => $last->message,
                        'last_message_time' => $last->created_at,
                        'unread_count' => (int) $items->where('receiver_id', $userId)->where('is_read', false)->count(),
                        'message_type' => $last->message_type,
                    ];
                })
                ->sortByDesc('last_message_time')
                ->values();

            return response()->json([
                'message' => 'Conversations retrieved.',
                'data' => $conversations,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function pharmacyMessages(Request $request, string $customerId): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = $this->pharmacyForTenant($request);

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $staffIds = $this->pharmacyStaffIds($pharmacy);

            $messages = Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->where(function ($q) use ($customerId, $staffIds) {
                    $q->where(function ($q) use ($customerId, $staffIds) {
                        $q->where('sender_id', $customerId)->whereIn('receiver_id', $staffIds);
                    })->orWhere(function ($q) use ($customerId, $staffIds) {
                        $q->whereIn('sender_id', $staffIds)->where('receiver_id', $customerId);
                    });
                })
                ->with('sender')
                ->orderBy('created_at')
                ->get();

            // Mark customer→pharmacy messages read for the current user.
            Message::withoutGlobalScope('tenant')
                ->where('pharmacy_id', $pharmacy->id)
                ->where('sender_id', $customerId)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'message' => 'Messages retrieved.',
                'data' => $messages,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function pharmacySend(Request $request, string $customerId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:2000',
            ]);

            $userId = $request->user()->id;
            $pharmacy = $this->pharmacyForTenant($request);

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $customer = User::findOrFail($customerId);

            $msg = Message::create([
                'pharmacy_id' => $pharmacy->id,
                'sender_id' => $userId,
                'receiver_id' => $customer->id,
                'message' => $validated['message'],
                'message_type' => 'text',
                'is_read' => false,
            ]);

            app(NotificationService::class)->notifyUser(
                (int) $customer->id,
                $pharmacy->id,
                'New message from '.$pharmacy->pharmacy_name,
                $request->user()->name.': '.mb_substr($validated['message'], 0, 140),
                'info',
                null
            );

            $msg->load('sender');

            return response()->json([
                'message' => 'Message sent.',
                'data' => $msg,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function pharmacyMarkRead(Request $request, string $customerId): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = $this->pharmacyForTenant($request);

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            Message::where('pharmacy_id', $pharmacy->id)
                ->where('sender_id', $customerId)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json(['message' => 'Messages marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
