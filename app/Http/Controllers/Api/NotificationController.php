<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $notifications = Notification::where('user_id', $user->id)
                ->latest()
                ->paginate($request->input('per_page', 20));

            return response()->json($notifications);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            if (!$notification->read_at) {
                $notification->update(['read_at' => now()]);
            }

            return response()->json($notification);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch notification.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markAsRead($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            $notification->update(['read_at' => now()]);

            return response()->json([
                'message' => 'Notification marked as read.',
                'notification' => $notification,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark notification as read.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markAllRead(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json([
                'message' => 'All notifications marked as read.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark notifications as read.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            $notification->delete();

            return response()->json([
                'message' => 'Notification deleted.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete notification.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function unreadCount(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $count = Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->count();

            return response()->json(['unread_count' => $count]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get unread count.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
