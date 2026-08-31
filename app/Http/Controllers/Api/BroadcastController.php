<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BroadcastMessage;
use App\Services\FcmService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BroadcastController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = BroadcastMessage::with('creator:id,name');

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            }

            if ($request->filled('audience')) {
                $query->where('audience', $request->input('audience'));
            }

            if ($request->filled('is_active')) {
                $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
            }

            $broadcasts = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json([
                'message' => 'Broadcasts retrieved.',
                'data' => $broadcasts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch broadcasts.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'audience' => 'required|in:pharmacy,customer,all',
                'send_push' => 'sometimes|boolean',
            ]);

            $broadcast = BroadcastMessage::create([
                'title' => $validated['title'],
                'message' => $validated['message'],
                'audience' => $validated['audience'],
                'created_by' => $request->user()->id,
                'is_active' => true,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'broadcast_created',
                'model_type' => BroadcastMessage::class,
                'model_id' => $broadcast->id,
                'new_values' => $broadcast->toArray(),
                'ip_address' => $request->ip(),
            ]);

            if (! empty($validated['send_push'])) {
                try {
                    app(FcmService::class)->sendToOrderTotal(
                        [],
                        $validated['title'],
                        $validated['message']
                    );
                } catch (\Throwable $e) {
                    // Non-fatal: in-app broadcast is still stored.
                }
            }

            return response()->json([
                'message' => 'Broadcast created successfully.',
                'broadcast' => $broadcast->fresh()->load('creator:id,name'),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create broadcast.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function toggleActive(Request $request, $id): JsonResponse
    {
        try {
            $broadcast = BroadcastMessage::findOrFail($id);
            $broadcast->update(['is_active' => ! $broadcast->is_active]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'broadcast_toggled',
                'model_type' => BroadcastMessage::class,
                'model_id' => $broadcast->id,
                'new_values' => ['is_active' => $broadcast->is_active],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Broadcast status updated.',
                'broadcast' => $broadcast->fresh(),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Broadcast not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update broadcast status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $broadcast = BroadcastMessage::findOrFail($id);
            $broadcast->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'broadcast_deleted',
                'model_type' => BroadcastMessage::class,
                'model_id' => $id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Broadcast deleted successfully.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Broadcast not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete broadcast.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pharmacyBroadcasts(Request $request): JsonResponse
    {
        try {
            $broadcasts = BroadcastMessage::where('is_active', true)
                ->whereIn('audience', ['pharmacy', 'all'])
                ->latest()
                ->get();

            return response()->json([
                'message' => 'Broadcasts retrieved.',
                'data' => $broadcasts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch broadcasts.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function customerBroadcasts(Request $request): JsonResponse
    {
        try {
            $broadcasts = BroadcastMessage::where('is_active', true)
                ->whereIn('audience', ['customer', 'all'])
                ->latest()
                ->get();

            return response()->json([
                'message' => 'Broadcasts retrieved.',
                'data' => $broadcasts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch broadcasts.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
