<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ControlledSubstance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlledSubstanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ControlledSubstance::with(['drug', 'issuingPharmacist'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('schedule')) {
                $query->bySchedule($request->input('schedule'));
            }

            $substances = $query->latest()->paginate($request->input('per_page', 50));

            return response()->json($substances);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch records.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'drug_id' => 'required|exists:drugs,id',
                'schedule' => 'required|in:schedule_i,schedule_ii,schedule_iii',
                'date_received' => 'required|date',
                'quantity_received' => 'required|integer|min:1',
                'notes' => 'nullable|string',
            ]);

            $registerNumber = ControlledSubstance::generateRegisterNumber(
                $validated['pharmacy_id'],
                $validated['schedule']
            );

            $substance = ControlledSubstance::create([
                ...$validated,
                'register_number' => $registerNumber,
                'balance_stock' => $validated['quantity_received'],
            ]);

            return response()->json([
                'message' => 'Controlled substance registered.',
                'substance' => $substance->load('drug'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to register.', 'error' => $e->getMessage()], 500);
        }
    }

    public function issue(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'issued_to' => 'required|string|max:255',
                'quantity_issued' => 'required|integer|min:1',
                'issue_date' => 'sometimes|date',
                'receiving_person_name' => 'required|string|max:255',
                'receiving_person_id_number' => 'required|string|max:50',
                'witness_name' => 'required|string|max:255',
                'witness_id_number' => 'required|string|max:50',
                'notes' => 'nullable|string',
            ]);

            $substance = ControlledSubstance::findOrFail($id);

            if ($validated['quantity_issued'] > $substance->balance_stock) {
                return response()->json(['message' => 'Insufficient stock balance.'], 422);
            }

            $substance->issue([
                ...$validated,
                'issuing_pharmacist_id' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Substance issued and recorded.',
                'substance' => $substance->fresh()->load('drug', 'issuingPharmacist'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to issue substance.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $substance = ControlledSubstance::with(['drug', 'issuingPharmacist'])
                ->findOrFail($id);

            return response()->json(['substance' => $substance]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch record.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getRegister(Request $request): JsonResponse
    {
        try {
            $query = ControlledSubstance::with(['drug', 'issuingPharmacist'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('schedule')) {
                $query->bySchedule($request->input('schedule'));
            }

            $records = $query->orderBy('date_received')->get();

            $register = $records->map(function ($r) {
                return [
                    'register_number' => $r->register_number,
                    'drug_name' => $r->drug->name ?? 'N/A',
                    'generic_name' => $r->drug->generic_name ?? 'N/A',
                    'schedule' => strtoupper(str_replace('_', ' ', $r->schedule)),
                    'date_received' => $r->date_received->format('d/m/Y'),
                    'quantity_received' => $r->quantity_received,
                    'balance_stock' => $r->balance_stock,
                    'issued_to' => $r->issued_to ?? '—',
                    'quantity_issued' => $r->quantity_issued ?: '—',
                    'issue_date' => $r->issue_date?->format('d/m/Y') ?? '—',
                    'pharmacist' => $r->issuingPharmacist->name ?? '—',
                    'witness' => $r->witness_name ?? '—',
                    'witness_id' => $r->witness_id_number ?? '—',
                ];
            });

            return response()->json(['register' => $register]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch register.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getAuditTrail(Request $request): JsonResponse
    {
        try {
            $query = ControlledSubstance::with(['drug', 'issuingPharmacist'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('schedule')) {
                $query->bySchedule($request->input('schedule'));
            }

            $records = $query->orderBy('date_received')->get()->map->getAuditTrail();

            return response()->json(['audit_trail' => $records]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch audit trail.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getBalanceReport(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $substances = ControlledSubstance::where('pharmacy_id', $pharmacyId)
                ->with('drug')
                ->get();

            $bySchedule = $substances->groupBy('schedule')->map(function ($items, $schedule) {
                return [
                    'schedule' => $schedule,
                    'total_received' => $items->sum('quantity_received'),
                    'total_issued' => $items->sum('quantity_issued'),
                    'total_balance' => $items->sum('balance_stock'),
                    'entries' => $items->count(),
                ];
            });

            return response()->json([
                'total_received' => $substances->sum('quantity_received'),
                'total_issued' => $substances->sum('quantity_issued'),
                'total_balance' => $substances->sum('balance_stock'),
                'by_schedule' => $bySchedule,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch balance report.', 'error' => $e->getMessage()], 500);
        }
    }
}
