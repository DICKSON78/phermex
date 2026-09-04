<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pharmacy;
use App\Models\TelemedicineSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
        $s->load(['patient:id,name,phone', 'pharmacist:id,name,phone', 'pharmacy:id,pharmacy_name,working_hours']);
        return array_merge($s->toArray(), [
            'room_url' => $this->roomUrl($s->room_code),
            'jitsi_server' => $this->jitsiServer(),
        ]);
    }

    private function notifyPharmacy(Pharmacy $pharmacy, string $title, string $message, string $link)
    {
        Notification::create([
            'pharmacy_id' => $pharmacy->id,
            'user_id' => $pharmacy->owner_id,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'is_read' => false,
            'link' => $link,
        ]);
    }

    private function notifyUser(int $userId, int $pharmacyId, string $title, string $message, string $link)
    {
        Notification::create([
            'pharmacy_id' => $pharmacyId,
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'is_read' => false,
            'link' => $link,
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
                'topic' => 'nullable|string|max:120',
                'patient_notes' => 'nullable|string|max:1000',
            ]);

            $user = $request->user();

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
                'topic' => $validated['topic'] ?? null,
                'patient_notes' => $validated['patient_notes'] ?? null,
            ]);

            $this->notifyPharmacy(
                $pharmacy,
                'Live Video Consultation',
                $user->name . ' is requesting a live video consultation. Open the telemedicine panel to join.',
                '/telemedicine'
            );

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

    public function bookConsult(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'scheduled_at' => 'required|date_format:Y-m-d H:i|after:now',
                'topic' => 'nullable|string|max:120',
                'patient_notes' => 'nullable|string|max:1000',
            ]);

            $user = $request->user();
            $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);

            $scheduled = Carbon::parse($validated['scheduled_at']);

            $conflict = TelemedicineSession::where('pharmacy_id', $pharmacy->id)
                ->where('status', 'scheduled')
                ->where('scheduled_at', $scheduled)
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'That time slot is already booked. Please choose another.'], 422);
            }

            $session = TelemedicineSession::create([
                'patient_user_id' => $user->id,
                'pharmacy_id' => $pharmacy->id,
                'room_code' => TelemedicineSession::generateRoomCode(),
                'status' => 'scheduled',
                'scheduled_at' => $scheduled,
                'topic' => $validated['topic'] ?? null,
                'patient_notes' => $validated['patient_notes'] ?? null,
            ]);

            $this->notifyPharmacy(
                $pharmacy,
                'New Telemedicine Appointment',
                $user->name . ' booked a video appointment for ' . $scheduled->format('d M Y, H:i') .
                    (isset($validated['topic']) ? ' - ' . $validated['topic'] : '') . '.',
                '/telemedicine'
            );

            return response()->json([
                'message' => 'Appointment booked. You will receive a reminder when it starts.',
                'data' => $this->serialize($session),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to book appointment.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
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

    public function appointments(Request $request): JsonResponse
    {
        try {
            $sessions = TelemedicineSession::withTrashed()
                ->where('patient_user_id', $request->user()->id)
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn ($s) => $this->serialize($s));

            return response()->json(['data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function cancelConsult(Request $request, string $id): JsonResponse
    {
        try {
            $session = TelemedicineSession::where('patient_user_id', $request->user()->id)
                ->findOrFail($id);

            if (!in_array($session->status, ['requested', 'live', 'scheduled'])) {
                return response()->json(['message' => 'Consultation is no longer active.'], 422);
            }

            $wasScheduled = $session->status === 'scheduled';
            $session->update(['status' => 'cancelled', 'ended_at' => now()]);

            if ($wasScheduled && $session->pharmacy_id) {
                $pharmacy = Pharmacy::find($session->pharmacy_id);
                if ($pharmacy) {
                    $this->notifyPharmacy($pharmacy, 'Appointment Cancelled', 'A patient cancelled their telemedicine appointment.', '/telemedicine');
                }
            }

            return response()->json(['message' => 'Consultation cancelled.', 'data' => $this->serialize($session)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Consultation not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    /**
     * Build available appointment slots for a pharmacy over the next $days days
     * based on pharmacy working_hours, excluding already-booked slots.
     */
    public function scheduleSlots(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'days' => 'nullable|integer|min:1|max:14',
            ]);

            $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);
            $days = $validated['days'] ?? 7;

            $hours = $pharmacy->working_hours ?? ['open' => '08:00', 'close' => '18:00'];
            $open = $hours['open'] ?? '08:00';
            $close = $hours['close'] ?? '18:00';

            // Days this pharmacy is open, keyed by short name, e.g. ["Mon","Tue",...].
            // If unset, treat every day as open.
            $workingDays = $pharmacy->working_days ?? [];
            $openDayNames = array_map(fn ($d) => strtolower((string) $d), $workingDays);

            $slotMinutes = 20;
            $slotGapMinutes = 10;
            $slotSize = $slotMinutes + $slotGapMinutes;

            $booked = TelemedicineSession::where('pharmacy_id', $pharmacy->id)
                ->where('status', 'scheduled')
                ->where('scheduled_at', '>', now())
                ->pluck('scheduled_at')
                ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d H:i'))
                ->all();

            $slots = [];
            foreach ($this->nextDays($days) as $dayDate) {
                $dayName = strtolower($dayDate->format('D'));
                if (count($openDayNames) > 0 && !in_array($dayName, $openDayNames)) {
                    continue;
                }
                $dayKey = $dayDate->format('Y-m-d');
                $dateTime = Carbon::parse($dayKey . ' ' . $open);
                while ($dateTime->format('H:i') < $close) {
                    $slotKey = $dateTime->format('Y-m-d H:i');
                    if ($dateTime->gt(now()) && !in_array($slotKey, $booked)) {
                        $slots[] = [
                            'start' => $slotKey,
                            'end' => $dateTime->copy()->addMinutes($slotMinutes)->format('H:i'),
                            'date_label' => $dayDate->format('D, M j'),
                            'time_label' => $dateTime->format('g:i A'),
                        ];
                    }
                    $dateTime->addMinutes($slotSize);
                }
            }

            return response()->json(['data' => $slots]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    private function nextDays(int $days): array
    {
        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $out[] = Carbon::today()->addDays($i);
        }
        return $out;
    }

    // ------------------------------------------------------------------
    // Pharmacy-side endpoints
    // ------------------------------------------------------------------

    private function pharmacyIds(Request $request)
    {
        $user = $request->user();
        if ($user->isOwner()) {
            return Pharmacy::where('owner_id', $user->id)->pluck('id');
        }
        return $user->pharmacy()->pluck('pharmacies.id');
    }

    public function pendingConsults(Request $request): JsonResponse
    {
        try {
            $sessions = TelemedicineSession::whereIn('pharmacy_id', $this->pharmacyIds($request))
                ->where('status', 'requested')
                ->latest()
                ->get()
                ->map(fn ($s) => $this->serialize($s));

            return response()->json(['data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function scheduledAppointments(Request $request): JsonResponse
    {
        try {
            $sessions = TelemedicineSession::whereIn('pharmacy_id', $this->pharmacyIds($request))
                ->where('status', 'scheduled')
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
            $sessions = TelemedicineSession::whereIn('pharmacy_id', $this->pharmacyIds($request))
                ->where('status', 'live')
                ->latest()
                ->get()
                ->map(fn ($s) => $this->serialize($s));

            return response()->json(['data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function notifyPatientBeforeCall(Request $request, string $id): JsonResponse
    {
        try {
            $session = TelemedicineSession::findOrFail($id);
            if ($session->patient_user_id) {
                $this->notifyUser(
                    $session->patient_user_id,
                    $session->pharmacy_id,
                    'Your Video Consult is Starting',
                    'The pharmacist is ready. Tap to join the video call now.',
                    '/telemedicine'
                );
            }
            return response()->json(['message' => 'Patient notified.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Consultation not found.'], 404);
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

            if ($session->patient_user_id) {
                $this->notifyUser(
                    $session->patient_user_id,
                    $session->pharmacy_id,
                    'Video Consult is Live',
                    'The pharmacist has joined. Tap to start / join the video call.',
                    '/telemedicine'
                );
            }

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