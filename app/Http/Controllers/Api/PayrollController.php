<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Payroll::with('employee');

            if ($request->filled('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('period_month')) {
                $query->where('period_month', $request->input('period_month'));
            }

            if ($request->filled('period_year')) {
                $query->where('period_year', $request->input('period_year'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $payroll = $query->latest('period_year')->latest('period_month')
                ->paginate($request->input('per_page', 20));

            return response()->json($payroll);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch payroll records.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'period_month' => 'required|integer|min:1|max:12',
                'period_year' => 'required|integer|min:2020|max:2100',
            ]);

            $existingCount = Payroll::where('pharmacy_id', $validated['pharmacy_id'])
                ->where('period_month', $validated['period_month'])
                ->where('period_year', $validated['period_year'])
                ->whereNotIn('status', ['cancelled'])
                ->count();

            if ($existingCount > 0) {
                return response()->json([
                    'message' => 'Payroll already exists for this period.',
                ], 422);
            }

            $employees = Employee::where('pharmacy_id', $validated['pharmacy_id'])
                ->where('status', 'active')
                ->get();

            if ($employees->isEmpty()) {
                return response()->json([
                    'message' => 'No active employees found for this pharmacy.',
                ], 422);
            }

            $payrollRecords = [];
            foreach ($employees as $employee) {
                $record = Payroll::processPayroll([
                    'employee_id' => $employee->id,
                    'basic_salary' => $employee->basic_salary,
                    'allowances' => $employee->allowances,
                    'overtime_pay' => 0,
                    'other_deductions' => 0,
                ], $validated['pharmacy_id'], $validated['period_month'], $validated['period_year']);

                $payrollRecords[] = $record;
            }

            return response()->json([
                'message' => 'Payroll generated for ' . $employees->count() . ' employees.',
                'payroll' => $payrollRecords,
                'count' => count($payrollRecords),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate payroll.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $payroll = Payroll::with('employee')->findOrFail($id);

            return response()->json(['payroll' => $payroll]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Payroll record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch payroll record.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function approve($id): JsonResponse
    {
        try {
            $payroll = Payroll::findOrFail($id);

            if ($payroll->status !== 'draft') {
                return response()->json([
                    'message' => 'Only draft payroll records can be approved.',
                ], 422);
            }

            $payroll->update(['status' => 'approved']);

            return response()->json([
                'message' => 'Payroll approved.',
                'payroll' => $payroll->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Payroll record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve payroll.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pay(Request $request, $id): JsonResponse
    {
        try {
            $payroll = Payroll::findOrFail($id);

            if (!in_array($payroll->status, ['draft', 'approved'])) {
                return response()->json([
                    'message' => 'Only approved or draft payroll can be marked as paid.',
                ], 422);
            }

            $payroll->update([
                'status' => 'paid',
                'paid_date' => now()->toDateString(),
                'payment_method' => $request->input('payment_method', 'bank'),
            ]);

            return response()->json([
                'message' => 'Payroll marked as paid.',
                'payroll' => $payroll->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Payroll record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process payment.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $payroll = Payroll::findOrFail($id);

            if ($payroll->status === 'paid') {
                return response()->json([
                    'message' => 'Paid payroll cannot be cancelled.',
                ], 422);
            }

            $payroll->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Payroll cancelled.',
                'payroll' => $payroll->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Payroll record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel payroll.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getSummary(Request $request): JsonResponse
    {
        try {
            $query = Payroll::query();

            if ($request->filled('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            if ($request->filled('period_month')) {
                $query->where('period_month', $request->input('period_month'));
            }

            if ($request->filled('period_year')) {
                $query->where('period_year', $request->input('period_year'));
            }

            $records = $query->get();

            return response()->json([
                'total_gross' => round($records->sum('gross_salary'), 2),
                'total_paye' => round($records->sum('paye_tax'), 2),
                'total_nssf' => round($records->sum('nssf_employee'), 2),
                'total_nhif' => round($records->sum('nhif'), 2),
                'total_housing_levy' => round($records->sum('housing_levy'), 2),
                'total_deductions' => round(
                    $records->sum('paye_tax') + $records->sum('nssf_employee') + $records->sum('nhif') + $records->sum('housing_levy') + $records->sum('other_deductions'),
                    2
                ),
                'total_net' => round($records->sum('net_salary'), 2),
                'employee_count' => $records->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch summary.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getPayslip($id): JsonResponse
    {
        try {
            $payroll = Payroll::with('employee')->findOrFail($id);

            $breakdown = [
                'earnings' => [
                    'Basic Salary' => (float) $payroll->basic_salary,
                    'Allowances' => (float) $payroll->allowances,
                    'Overtime Pay' => (float) $payroll->overtime_pay,
                ],
                'deductions' => [
                    'PAYE Tax' => (float) $payroll->paye_tax,
                    'NSSF (Employee)' => (float) $payroll->nssf_employee,
                    'NHIF' => (float) $payroll->nhif,
                    'Housing Levy' => (float) $payroll->housing_levy,
                    'Other Deductions' => (float) $payroll->other_deductions,
                ],
                'employer_costs' => [
                    'NSSF (Employer)' => (float) $payroll->nssf_employer,
                ],
            ];

            return response()->json([
                'payroll' => $payroll,
                'breakdown' => $breakdown,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Payroll record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch payslip.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
