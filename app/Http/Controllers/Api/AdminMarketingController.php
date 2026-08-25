<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MarketingCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMarketingController extends Controller
{
    private function toApi(MarketingCampaign $campaign): array
    {
        return [
            'id' => $campaign->id,
            'name' => $campaign->name,
            'type' => ucfirst($campaign->type === 'in-app' ? 'In-App' : $campaign->type),
            'audience' => $campaign->audience,
            'status' => ucfirst($campaign->status),
            'startDate' => $campaign->start_date?->toDateString(),
            'endDate' => $campaign->end_date?->toDateString(),
            'description' => $campaign->description,
            'impressions' => (int) $campaign->impressions,
            'clicks' => (int) $campaign->clicks,
            'conversions' => (int) $campaign->conversions,
            'spend' => (float) $campaign->spend,
            'created_at' => $campaign->created_at?->toISOString(),
        ];
    }

    private function normalizeInput(array $validated): array
    {
        $data = $validated;

        if (isset($data['type'])) {
            $data['type'] = strtolower(str_replace(' ', '-', $data['type']));
        }

        if (isset($data['status'])) {
            $data['status'] = strtolower($data['status']);
        }

        if (isset($data['startDate'])) {
            $data['start_date'] = $data['startDate'];
            unset($data['startDate']);
        }

        if (isset($data['endDate'])) {
            $data['end_date'] = $data['endDate'];
            unset($data['endDate']);
        }

        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = MarketingCampaign::query();

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('audience', 'like', "%{$search}%");
                });
            }

            if ($request->filled('type')) {
                $query->where('type', strtolower(str_replace(' ', '-', $request->input('type'))));
            }

            if ($request->filled('status')) {
                $query->where('status', strtolower($request->input('status')));
            }

            $campaigns = $query->latest()->get();

            $stats = [
                'total' => $campaigns->count(),
                'active' => $campaigns->where('status', 'active')->count(),
                'draft' => $campaigns->where('status', 'draft')->count(),
                'paused' => $campaigns->where('status', 'paused')->count(),
                'completed' => $campaigns->where('status', 'completed')->count(),
                'totalReach' => $campaigns->sum('impressions'),
                'totalConversions' => $campaigns->sum('conversions'),
            ];

            return response()->json([
                'data' => [
                    'campaigns' => $campaigns->map(fn ($c) => $this->toApi($c)),
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch campaigns.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|string|in:Email,SMS,Push,In-App',
                'audience' => 'required|string|max:255',
                'status' => 'sometimes|string|in:Draft,Active,Paused,Completed',
                'startDate' => 'required|date',
                'endDate' => 'required|date|after_or_equal:startDate',
                'description' => 'nullable|string',
            ]);

            $campaign = MarketingCampaign::create($this->normalizeInput($validated));

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'marketing_campaign_created',
                'model_type' => MarketingCampaign::class,
                'model_id' => $campaign->id,
                'new_values' => $campaign->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Campaign created successfully.',
                'campaign' => $this->toApi($campaign->fresh()),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create campaign.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $campaign = MarketingCampaign::findOrFail($id);

            return response()->json(['data' => $this->toApi($campaign)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Campaign not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch campaign.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $campaign = MarketingCampaign::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'type' => 'sometimes|string|in:Email,SMS,Push,In-App',
                'audience' => 'sometimes|string|max:255',
                'status' => 'sometimes|string|in:Draft,Active,Paused,Completed',
                'startDate' => 'sometimes|date',
                'endDate' => 'sometimes|date',
                'description' => 'nullable|string',
            ]);

            $campaign->update($this->normalizeInput($validated));

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'marketing_campaign_updated',
                'model_type' => MarketingCampaign::class,
                'model_id' => $campaign->id,
                'new_values' => $campaign->fresh()->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Campaign updated successfully.',
                'campaign' => $this->toApi($campaign->fresh()),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Campaign not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update campaign.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        try {
            $campaign = MarketingCampaign::findOrFail($id);

            $current = strtolower($campaign->status);
            $newStatus = $current === 'active' ? 'paused' : 'active';
            $campaign->update(['status' => $newStatus]);

            return response()->json([
                'message' => 'Campaign status updated.',
                'campaign' => $this->toApi($campaign->fresh()),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Campaign not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update campaign status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $campaign = MarketingCampaign::findOrFail($id);
            $campaign->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'marketing_campaign_deleted',
                'model_type' => MarketingCampaign::class,
                'model_id' => $id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Campaign deleted successfully.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Campaign not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete campaign.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function duplicate(Request $request, $id): JsonResponse
    {
        try {
            $campaign = MarketingCampaign::findOrFail($id);

            $copy = $campaign->replicate();
            $copy->name = $campaign->name . ' (Copy)';
            $copy->status = 'draft';
            $copy->save();

            return response()->json([
                'message' => 'Campaign duplicated successfully.',
                'campaign' => $this->toApi($copy->fresh()),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Campaign not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to duplicate campaign.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
