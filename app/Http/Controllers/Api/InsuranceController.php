<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceClaim;
use App\Models\InsuranceProvider;
use App\Models\PatientInsurance;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class InsuranceController extends Controller
{
    private function currentPharmacy(Request $request): Pharmacy
    {
        $user = $request->user();
        $currentId = $user->resolveCurrentPharmacyId();
        return $currentId ? Pharmacy::findOrFail($currentId) : Pharmacy::findOrFail($user->accessiblePharmacyIds()[0] ?? 0);
    }

    private function pharmacyIds(Request $request): array
    {
        $user = $request->user();
        return $user->accessiblePharmacyIds();
    }

    // ------------------------------------------------------------------
    // Insurance Providers
    // ------------------------------------------------------------------

    public function providers(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $this->currentPharmacy($request)->id;
            $providers = InsuranceProvider::where(function ($q) use ($pharmacyId) {
                $q->where('pharmacy_id', $pharmacyId)->orWhereNull('pharmacy_id');
            })->orderBy('name')->get();

            return response()->json(['data' => $providers]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function storeProvider(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:20',
                'contact_phone' => 'nullable|string|max:30',
                'contact_email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            $pharmacy = $this->currentPharmacy($request);
            $validated['pharmacy_id'] = $pharmacy->id;

            $provider = InsuranceProvider::create($validated);

            return response()->json([
                'message' => 'Insurance provider created.',
                'data' => $provider,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function updateProvider(Request $request, string $id): JsonResponse
    {
        try {
            $provider = InsuranceProvider::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'code' => 'nullable|string|max:20',
                'contact_phone' => 'nullable|string|max:30',
                'contact_email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            $provider->update($validated);

            return response()->json([
                'message' => 'Insurance provider updated.',
                'data' => $provider->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Provider not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function destroyProvider(string $id): JsonResponse
    {
        try {
            $provider = InsuranceProvider::findOrFail($id);
            $provider->delete();
            return response()->json(['message' => 'Insurance provider deleted.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Provider not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Patient Insurance Records
    // ------------------------------------------------------------------

    public function searchUsers(Request $request): JsonResponse
    {
        try {
            $search = trim((string) $request->get('search', ''));

            $query = User::where('role', 'customer')
                ->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })
                ->select('id', 'name', 'phone', 'email')
                ->orderBy('name')
                ->limit(10);

            return response()->json(['data' => $query->get()]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function patients(Request $request): JsonResponse
    {
        try {
            $ids = $this->pharmacyIds($request);
            $search = $request->get('search');

            $query = PatientInsurance::whereIn('pharmacy_id', $ids)
                ->with(['customerUser:id,name,phone,email', 'provider:id,name,code'])
                ->orderByDesc('id');

            if ($search) {
                $query->whereHas('customerUser', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            return response()->json(['data' => $query->limit(200)->get()]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function storePatient(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_user_id' => 'required|exists:users,id',
                'insurance_provider_id' => 'required|exists:insurance_providers,id',
                'policy_number' => 'required|string|max:50',
                'group_number' => 'nullable|string|max:50',
                'member_id' => 'nullable|string|max:50',
                'holder_name' => 'nullable|string|max:255',
                'relationship' => 'sometimes|in:self,spouse,child,dependent',
                'expiry_date' => 'nullable|date',
                'coverage_percent' => 'required|numeric|min:0|max:100',
                'is_primary' => 'sometimes|boolean',
            ]);

            $pharmacy = $this->currentPharmacy($request);
            $validated['pharmacy_id'] = $pharmacy->id;

            $record = PatientInsurance::create($validated);
            $record->load(['customerUser:id,name,phone,email', 'provider:id,name,code']);

            return response()->json([
                'message' => 'Patient insurance record created.',
                'data' => $record,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function updatePatient(Request $request, string $id): JsonResponse
    {
        try {
            $record = PatientInsurance::findOrFail($id);

            $validated = $request->validate([
                'insurance_provider_id' => 'sometimes|exists:insurance_providers,id',
                'policy_number' => 'sometimes|string|max:50',
                'group_number' => 'nullable|string|max:50',
                'member_id' => 'nullable|string|max:50',
                'holder_name' => 'nullable|string|max:255',
                'relationship' => 'sometimes|in:self,spouse,child,dependent',
                'expiry_date' => 'nullable|date',
                'coverage_percent' => 'sometimes|numeric|min:0|max:100',
                'is_primary' => 'sometimes|boolean',
            ]);

            $record->update($validated);
            $record->load(['customerUser:id,name,phone,email', 'provider:id,name,code']);

            return response()->json([
                'message' => 'Patient insurance updated.',
                'data' => $record,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function destroyPatient(string $id): JsonResponse
    {
        try {
            PatientInsurance::findOrFail($id)->delete();
            return response()->json(['message' => 'Patient insurance record deleted.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Insurance Claims
    // ------------------------------------------------------------------

    public function claims(Request $request): JsonResponse
    {
        try {
            $ids = $this->pharmacyIds($request);
            $status = $request->get('status');

            $query = InsuranceClaim::whereIn('pharmacy_id', $ids)
                ->with(['patientInsurance.customerUser:id,name,phone', 'patientInsurance.provider:id,name,code'])
                ->orderByDesc('id');

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            return response()->json(['data' => $query->limit(200)->get()]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function showClaim(string $id): JsonResponse
    {
        try {
            $claim = InsuranceClaim::with([
                'patientInsurance.customerUser:id,name,phone,email',
                'patientInsurance.provider:id,name,code',
                'order:id,order_code,total',
                'processor:id,name',
            ])->findOrFail($id);

            return response()->json(['data' => $claim]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Claim not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function storeClaim(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_insurance_id' => 'required|exists:patient_insurances,id',
                'order_id' => 'nullable|exists:orders,id',
                'total_amount' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            $pharmacy = $this->currentPharmacy($request);
            $patientInsurance = PatientInsurance::findOrFail($validated['patient_insurance_id']);

            $approvedAmount = round((float) $validated['total_amount'] * (float) $patientInsurance->coverage_percent / 100, 2);
            $copay = round((float) $validated['total_amount'] - $approvedAmount, 2);

            $claim = InsuranceClaim::create([
                'pharmacy_id' => $pharmacy->id,
                'patient_insurance_id' => $patientInsurance->id,
                'order_id' => $validated['order_id'] ?? null,
                'claim_number' => 'CLM-' . strtoupper(Str::random(8)),
                'total_amount' => $validated['total_amount'],
                'approved_amount' => $approvedAmount,
                'patient_copay' => $copay,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
                'processed_by' => Auth::id(),
            ]);

            $claim->load(['patientInsurance.customerUser:id,name,phone', 'patientInsurance.provider:id,name,code']);

            return response()->json([
                'message' => 'Insurance claim created.',
                'data' => $claim,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Patient insurance record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function updateClaim(Request $request, string $id): JsonResponse
    {
        try {
            $claim = InsuranceClaim::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|in:submitted,approved,rejected,paid',
                'approved_amount' => 'sometimes|nullable|numeric|min:0',
                'patient_copay' => 'sometimes|nullable|numeric|min:0',
                'pharmacist_notes' => 'nullable|string|max:1000',
                'notes' => 'nullable|string|max:1000',
            ]);

            $data = $validated;

            if (isset($data['status']) && $data['status'] === 'submitted' && !$claim->submitted_at) {
                $data['submitted_at'] = now();
            }

            if (in_array($data['status'] ?? '', ['approved', 'rejected', 'paid'], true)) {
                $data['responded_at'] = now();
                $data['processed_by'] = Auth::id();
            }

            $claim->update($data);
            $claim->load(['patientInsurance.customerUser:id,name,phone', 'patientInsurance.provider:id,name,code']);

            return response()->json([
                'message' => 'Claim updated.',
                'data' => $claim,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Claim not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Stats
    // ------------------------------------------------------------------

    public function stats(Request $request): JsonResponse
    {
        try {
            $ids = $this->pharmacyIds($request);

            $totalClaims = InsuranceClaim::whereIn('pharmacy_id', $ids)->count();
            $pendingClaims = InsuranceClaim::whereIn('pharmacy_id', $ids)->where('status', 'submitted')->count();
            $approvedClaims = InsuranceClaim::whereIn('pharmacy_id', $ids)->where('status', 'approved')->count();
            $totalValue = InsuranceClaim::whereIn('pharmacy_id', $ids)->sum('total_amount');
            $approvedValue = InsuranceClaim::whereIn('pharmacy_id', $ids)->where('status', 'approved')->sum('approved_amount');
            $patientCount = PatientInsurance::whereIn('pharmacy_id', $ids)->distinct('customer_user_id')->count('customer_user_id');

            return response()->json([
                'data' => [
                    'total_claims' => (int) $totalClaims,
                    'pending_claims' => (int) $pendingClaims,
                    'approved_claims' => (int) $approvedClaims,
                    'total_value' => (float) $totalValue,
                    'approved_value' => (float) $approvedValue,
                    'insured_patients' => (int) $patientCount,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Customer App Side
    // ------------------------------------------------------------------

    public function availableProviders(Request $request): JsonResponse
    {
        try {
            $providers = InsuranceProvider::where(function ($q) use ($request) {
                $q->whereNull('pharmacy_id')->orWhere('pharmacy_id', $request->get('pharmacy_id'));
            })->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

            return response()->json(['data' => $providers]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function myInsurance(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;

            $records = PatientInsurance::where('customer_user_id', $userId)
                ->with(['provider:id,name,code,contact_phone', 'pharmacy:id,pharmacy_name'])
                ->orderByDesc('is_primary')
                ->orderByDesc('id')
                ->get();

            return response()->json(['data' => $records]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function storeMyInsurance(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'insurance_provider_id' => 'required|exists:insurance_providers,id',
                'policy_number' => 'required|string|max:50',
                'group_number' => 'nullable|string|max:50',
                'member_id' => 'nullable|string|max:50',
                'holder_name' => 'nullable|string|max:255',
                'relationship' => 'sometimes|in:self,spouse,child,dependent',
                'expiry_date' => 'nullable|date',
                'coverage_percent' => 'required|numeric|min:0|max:100',
                'is_primary' => 'sometimes|boolean',
            ]);

            $validated['customer_user_id'] = $request->user()->id;

            $record = PatientInsurance::create($validated);
            $record->load('provider:id,name,code');

            return response()->json([
                'message' => 'Insurance record added.',
                'data' => $record,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function destroyMyInsurance(Request $request, string $id): JsonResponse
    {
        try {
            $record = PatientInsurance::where('customer_user_id', $request->user()->id)->findOrFail($id);
            $record->delete();
            return response()->json(['message' => 'Insurance record removed.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}