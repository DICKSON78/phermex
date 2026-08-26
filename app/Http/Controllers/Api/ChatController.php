<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Pharmacy;
use App\Models\User;
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

            $messages = Message::conversation($userId, $pharmacy->owner_id, $pharmacyId)
                ->with('sender')
                ->get();

            // Mark pharmacy→customer as read
            Message::where('pharmacy_id', $pharmacyId)
                ->where('sender_id', $pharmacy->owner_id)
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

            Message::where('pharmacy_id', $pharmacyId)
                ->where('sender_id', $pharmacy->owner_id)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json(['message' => 'Messages marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ── Pharmacy (owner/staff) endpoints ────────────────

    public function pharmacyConversations(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = Pharmacy::where('owner_id', $userId)->first();

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $conversations = Message::selectRaw('CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id, MAX(id) as last_id, COUNT(CASE WHEN receiver_id = ? AND is_read = 0 THEN 1 END) as unread_count', [$userId, $userId])
                ->where('pharmacy_id', $pharmacy->id)
                ->where(function ($q) use ($userId) {
                    $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
                })
                ->groupBy('other_user_id')
                ->orderByDesc('last_id')
                ->get()
                ->map(function ($c) use ($userId) {
                    $last = Message::with('sender')->find($c->last_id);
                    $otherUserId = $c->other_user_id;
                    $otherUser = User::find($otherUserId);

                    return [
                        'customer_id' => $otherUserId,
                        'customer_name' => $otherUser->name ?? 'Customer',
                        'customer_phone' => $otherUser->phone ?? '',
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
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function pharmacyMessages(Request $request, string $customerId): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            $pharmacy = Pharmacy::where('owner_id', $userId)->first();

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $messages = Message::conversation($customerId, $userId, $pharmacy->id)
                ->with('sender')
                ->get();

            // Mark customer→pharmacy as read
            Message::where('pharmacy_id', $pharmacy->id)
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
            $pharmacy = Pharmacy::where('owner_id', $userId)->first();

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found.'], 404);
            }

            $msg = Message::create([
                'pharmacy_id' => $pharmacy->id,
                'sender_id' => $userId,
                'receiver_id' => $customerId,
                'message' => $validated['message'],
                'message_type' => 'text',
                'is_read' => false,
            ]);

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
            $pharmacy = Pharmacy::where('owner_id', $userId)->first();

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
