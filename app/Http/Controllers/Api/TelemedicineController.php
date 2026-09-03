<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pharmacy;
use App\Models\TelemedicineSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelemedicineController extends Controller
{
    /**
     * Base server url for Jitsi rooms (self-hosted or public).
     */
    private function jitsiServer(): string
    {
        return rtrim(config('services.jitsi.server', 'https://meet.jit.si'), '/');
    }

    private function roomUrl(string $code): string
    {
        return $this->jitsiServer() . '/' . $code;
    }

    private function serialize(TelemedicineSession $s): array
    {
        $s->load(['patient:id,name,phone', 'pharmacist:id,name,phone', 'pharmacy:id,pharmacy_name']);
        return array_merge($s->toArray(), [
            'room_url' => $this->roomUrl($s->room_code),
            'jitsi_server' => $this->jitsiServer(),
        ]);
    }

    // ------------------------------------------------------------------
    // Customer app endpoints
    // ------------------------------------------------------------------

    public function requestConsult(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
            ]);

            $user = $request->user();

            // A customer has at most one active (requested/live) consult.
            $existing = TelemedicineSession::where('patient_user_id', $user->id)
                ->active()
                ->latest()
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'You already have an active consultation.',
                    'data' => $this->serialize($existing),
                ], 200);
            }

            $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);

            $session = TelemedicineSession::create([
                'patient_user_id' => $user->id,
                'pharmacy_id' => $pharmacy->id,
                'room_code' => TelemedicineSession::generateRoomCode(),
                'status' => 'requested',
            ]);

            Notification::create([
                'pharmacy_id' => $pharmacy->id,
                'user_id' => $pharmacy->owner_id,
                'title' => 'Video Consultation Request',
                'message' => "{$user->name} is requesting a live video consultation. Open the telemedicine panel to join.",
                'type' => 'info',
                'is_read' => false,
                'link' => '/telemedicine',
            ]);

            return response()->json([
                'message' => 'Consultation requested. The pharmacist will join shortly.',
                'data' => $this->serialize($session),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to request consultation.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function activeConsult(Request $request): JsonResponse
    {
        try {
            $session = TelemedicineSession::where('patient_user_id', $request->user()->id)
                ->active()
                ->latest()
                ->first();

            return response()->json([
                'data' => $session ? $this->serialize($session) : null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function cancelConsult(Request $request, string $id): JsonResponse
    {
        try {
            $session = TelemedicineSession::where('patient_user_id', $request->user()->id)
                ->findOrFail($id);

            if (!in_array($session->status, ['requested', 'live'])) {
                return response()->json(['message' => 'Consultation is no longer active.'], 422);
            }

            $session->update(['status' => 'ended', 'ended_at' => now()]);

            return response()->json(['message' => 'Consultation ended.', 'data' => $this->serialize($session)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Consultation not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Pharmacy-side endpoints
    // ------------------------------------------------------------------

    public function pendingConsults(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->isOwner()
                ? Pharmacy::where('owner_id', $user->id)->pluck('id')
                : $user->pharmacy()->pluck('pharmacies.id');

            $sessions = TelemedicineSession::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'requested')
                ->latest()
                ->get()
                ->map(fn ($s) => $this->serialize($s));

            return response()->json(['data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function liveConsults(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->isOwner()
                ? Pharmacy::where('owner_id', $user->id)->pluck('id')
                : $user->pharmacy()->pluck('pharmacies.id');

            $sessions = TelemedicineSession::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'live')
                ->latest()
                ->get()
                ->map(fn ($s) => $this->serialize($s));

            return response()->json(['data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function acceptConsult(Request $request, string $id): JsonResponse
    {
        try {
            $session = TelemedicineSession::findOrFail($id);

            $session->update([
                'pharmacist_user_id' => $request->user()->id,
                'status' => 'live',
                'started_at' => $session->started_at ?? now(),
            ]);

            return response()->json([
                'message' => 'Consultation live. Joining the room now.',
                'data' => $this->serialize($session),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Consultation not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function endConsult(Request $request, string $id): JsonResponse
    {
        try {
            $session = TelemedicineSession::findOrFail($id);
            $session->update(['status' => 'ended', 'ended_at' => now()]);

            return response()->json(['message' => 'Consultation ended.', 'data' => $this->serialize($session)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Consultation not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}