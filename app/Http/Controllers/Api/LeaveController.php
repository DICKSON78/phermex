<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    private function employeeIsAccessible(Request $request, int $employeeId): bool
    {
        $employee = \App\Models\Employee::where('id', $employeeId)->first();

        return $employee && in_array((int) $employee->pharmacy_id, $request->user()->accessiblePharmacyIds(), true);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Leave::with(['employee', 'approvedBy'])->whereHas('employee');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('leave_type')) {
                $query->where('leave_type', $request->input('leave_type'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $leaves = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($leaves);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch leaves.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'leave_type' => 'required|in:annual,sick,maternity,paternity,bereavement,unpaid,study',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string|max:500',
            ]);

            $validated['days_count'] = Leave::calculateDays($validated['start_date'], $validated['end_date']);
            $validated['status'] = 'pending';

            if (!$this->employeeIsAccessible($request, (int) $validated['employee_id'])) {
                return response()->json([
                    'message' => 'You do not have access to this employee.',
                ], 403);
            }

            $leave = Leave::create($validated);

            return response()->json([
                'message' => 'Leave request submitted.',
                'leave' => $leave->load('employee'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to submit leave request.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $leave = Leave::with(['employee', 'approvedBy'])->findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $leave->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this leave request.',
                ], 403);
            }

            return response()->json(['leave' => $leave]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Leave not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch leave.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $leave = Leave::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $leave->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this leave request.',
                ], 403);
            }

            if ($leave->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending leaves can be approved.',
                ], 422);
            }

            $leave->approve($request->input('approved_by', 1));

            return response()->json([
                'message' => 'Leave approved.',
                'leave' => $leave->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Leave not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve leave.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $leave = Leave::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $leave->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this leave request.',
                ], 403);
            }

            if ($leave->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending leaves can be rejected.',
                ], 422);
            }

            $leave->reject(
                $request->input('approved_by', 1),
                $request->input('rejection_reason', '')
            );

            return response()->json([
                'message' => 'Leave rejected.',
                'leave' => $leave->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Leave not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject leave.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        try {
            $leave = Leave::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $leave->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this leave request.',
                ], 403);
            }

            if ($leave->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending leaves can be cancelled.',
                ], 422);
            }

            $leave->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Leave cancelled.',
                'leave' => $leave->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Leave not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel leave.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getBalance(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'employee_id' => 'required|exists:employees,id',
            ]);

            $employee = \App\Models\Employee::findOrFail($request->input('employee_id'));

            if (!$this->employeeIsAccessible($request, (int) $employee->id)) {
                return response()->json([
                    'message' => 'You do not have access to this employee.',
                ], 403);
            }

            $balance = $employee->getLeaveBalance();

            return response()->json(['balance' => $balance]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Employee not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch leave balance.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getCalendar(Request $request): JsonResponse
    {
        try {
            $query = Leave::with('employee')->whereHas('employee')
                ->where('status', 'approved')
                ->where('end_date', '>=', now());

            if ($request->filled('pharmacy_id')) {
                $query->whereHas('employee', fn ($q) => $q->where('pharmacy_id', $request->input('pharmacy_id')));
            }

            if ($request->filled('month')) {
                $query->whereMonth('start_date', $request->input('month'));
                $query->whereYear('start_date', $request->input('year', now()->year));
            }

            $leaves = $query->orderBy('start_date')->get();

            return response()->json(['leaves' => $leaves]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch calendar.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
