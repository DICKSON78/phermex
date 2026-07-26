<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyLicense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LicenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PharmacyLicense::where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('license_type')) {
                $query->where('license_type', $request->input('license_type'));
            }

            $licenses = $query->latest()->get();

            $licenses = $licenses->map(function ($license) {
                if ($license->isExpired()) {
                    $license->status = 'expired';
                    $license->save();
                } elseif ($license->isExpiringSoon()) {
                    $license->status = 'expiring';
                    $license->save();
                }
                return $license;
            });

            return response()->json(['licenses' => $licenses]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch licenses.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'license_type' => 'required|in:pharmacy_license,drug_dealer_license,tmda_registration,business_license,fire_safety,health_certificate',
                'license_number' => 'required|string|max:255',
                'issue_date' => 'required|date',
                'expiry_date' => 'required|date|after:issue_date',
                'issuing_authority' => 'required|string|max:255',
                'document_path' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $license = PharmacyLicense::create([
                ...$validated,
                'status' => 'active',
            ]);

            return response()->json(['message' => 'License added.', 'license' => $license], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to add license.', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $license = PharmacyLicense::findOrFail($id);

            $validated = $request->validate([
                'license_number' => 'sometimes|string|max:255',
                'issue_date' => 'sometimes|date',
                'expiry_date' => 'sometimes|date',
                'issuing_authority' => 'sometimes|string|max:255',
                'document_path' => 'nullable|string',
                'renewal_reminder_days' => 'sometimes|integer|min:1|max:90',
                'notes' => 'nullable|string',
            ]);

            $license->update($validated);

            return response()->json(['message' => 'License updated.', 'license' => $license->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'License not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update license.', 'error' => $e->getMessage()], 500);
        }
    }

    public function renew(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'issue_date' => 'required|date',
                'expiry_date' => 'required|date|after:issue_date',
                'license_number' => 'sometimes|string|max:255',
                'issuing_authority' => 'sometimes|string|max:255',
            ]);

            $license = PharmacyLicense::findOrFail($id);
            $license->renew($validated);

            return response()->json(['message' => 'License renewed.', 'license' => $license->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'License not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to renew license.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getExpiryAlert(Request $request): JsonResponse
    {
        try {
            $licenses = PharmacyLicense::where('pharmacy_id', $request->input('pharmacy_id'))
                ->where('status', '!=', 'suspended')
                ->get()
                ->filter(fn ($l) => $l->isExpiringSoon() || $l->isExpired())
                ->values();

            return response()->json([
                'alerts' => $licenses,
                'count' => $licenses->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch alerts.', 'error' => $e->getMessage()], 500);
        }
    }
}
