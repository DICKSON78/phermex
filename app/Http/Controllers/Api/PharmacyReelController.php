<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\PharmacyReel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PharmacyReelController extends Controller
{
    /** A reel stays visible for 24 hours, then it drops out of the feed. */
    public const REEL_LIFETIME_HOURS = 24;

    private function expiryCutoff(): \DateTimeInterface
    {
        return now()->subHours(self::REEL_LIFETIME_HOURS);
    }
    private function toApi(PharmacyReel $reel, bool $withPharmacy = true): array
    {
        $data = [
            'id' => $reel->id,
            'title' => $reel->title,
            'description' => $reel->description,
            'mediaType' => $reel->media_type,
            'mediaUrl' => $reel->media_url,
            'thumbnailUrl' => $reel->thumbnail_url,
            'status' => $reel->status,
            'views' => (int) $reel->views,
            'updatedAt' => $reel->updated_at?->toISOString(),
            'expiresAt' => $reel->updated_at?->copy()->addHours(self::REEL_LIFETIME_HOURS)->toISOString(),
            'expiresInHours' => self::REEL_LIFETIME_HOURS,
        ];

        if ($withPharmacy && $reel->relationLoaded('pharmacy') && $reel->pharmacy) {
            $pharmacy = $reel->pharmacy;
            $data['pharmacy'] = [
                'id' => $pharmacy->id,
                'name' => $pharmacy->name,
                'location' => $pharmacy->location ?? $pharmacy->address ?? null,
            ];
        }

        return $data;
    }

    private function currentPharmacyId(Request $request): ?int
    {
        $id = $request->input('pharmacy_id') ?? $request->user()?->resolveCurrentPharmacyId();

        return $id ? (int) $id : null;
    }

    /**
     * Public feed for the customer app. Only published reels, each pharmacy once
     * (the unique index guarantees one row per pharmacy regardless of query).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $reels = PharmacyReel::query()
                ->with('pharmacy:id,name,location,address')
                ->where('status', 'published')
                ->where('updated_at', '>=', $this->expiryCutoff())
                ->orderByDesc('updated_at')
                ->limit(50)
                ->get();

            return response()->json([
                'message' => 'Reels retrieved successfully.',
                'data' => $reels->map(fn (PharmacyReel $reel) => $this->toApi($reel))->values(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Failed to load reels.'], 500);
        }
    }

    /** The signed-in pharmacy's own reel, or null when it has not posted one. */
    public function mine(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $this->currentPharmacyId($request);

            if (! $pharmacyId) {
                throw ValidationException::withMessages([
                    'pharmacy_id' => ['No pharmacy is selected for this account.'],
                ]);
            }

            $reel = PharmacyReel::with('pharmacy:id,name,location,address')
                ->where('pharmacy_id', $pharmacyId)
                ->first();

            return response()->json([
                'message' => 'Reel retrieved successfully.',
                'data' => $reel ? $this->toApi($reel) : null,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Failed to load your reel.'], 500);
        }
    }

    /**
     * Create or replace the pharmacy's reel.
     *
     * A pharmacy can only ever have one reel: posting again replaces the existing
     * reel instead of adding a second one. updateOrCreate is keyed on pharmacy_id
     * and runs in a transaction with a lock on the row so two concurrent posts
     * cannot both insert.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $this->currentPharmacyId($request);

            if (! $pharmacyId) {
                throw ValidationException::withMessages([
                    'pharmacy_id' => ['No pharmacy is selected for this account.'],
                ]);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:150',
                'description' => 'sometimes|nullable|string|max:1000',
                'mediaType' => ['required', Rule::in(['image', 'video'])],
                'mediaUrl' => 'required|url',
                'thumbnailUrl' => 'sometimes|nullable|url',
                'status' => ['sometimes', Rule::in(['draft', 'published'])],
            ]);

            DB::transaction(function () use ($validated, $pharmacyId) {
                Pharmacy::query()->whereKey($pharmacyId)->lockForUpdate()->first();

                PharmacyReel::updateOrCreate(
                    ['pharmacy_id' => $pharmacyId],
                    [
                        'title' => $validated['title'],
                        'description' => $validated['description'] ?? null,
                        'media_type' => $validated['mediaType'],
                        'media_url' => $validated['mediaUrl'],
                        'thumbnail_url' => $validated['thumbnailUrl'] ?? null,
                        'status' => $validated['status'] ?? 'published',
                    ]
                );
            });

            $reel = PharmacyReel::with('pharmacy:id,name,location,address')
                ->where('pharmacy_id', $pharmacyId)
                ->first();

            return response()->json([
                'message' => 'Reel saved successfully. A pharmacy can only have one reel, so your previous reel was replaced.',
                'data' => $this->toApi($reel),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Failed to save your reel.'], 500);
        }
    }

    public function destroy(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $this->currentPharmacyId($request);

            if (! $pharmacyId) {
                throw ValidationException::withMessages([
                    'pharmacy_id' => ['No pharmacy is selected for this account.'],
                ]);
            }

            $deleted = PharmacyReel::where('pharmacy_id', $pharmacyId)->delete();

            return response()->json([
                'message' => $deleted > 0 ? 'Reel removed successfully.' : 'No reel to remove.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Failed to remove your reel.'], 500);
        }
    }
}
