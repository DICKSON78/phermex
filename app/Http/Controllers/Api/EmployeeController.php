<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Employee::with('user')
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->filled('department')) {
                $query->where('department', $request->input('department'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('employment_type')) {
                $query->where('employment_type', $request->input('employment_type'));
            }

            $employees = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($employees);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch employees.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:255',
                'date_of_birth' => 'nullable|date',
                'gender' => 'sometimes|in:male,female,other',
                'national_id' => 'nullable|string|max:255',
                'position' => 'required|string|max:255',
                'department' => 'required|in:pharmacy,management,finance,operations,hr',
                'employment_type' => 'required|in:full_time,part_time,contract,intern',
                'hire_date' => 'required|date',
                'contract_end_date' => 'nullable|date|after:hire_date',
                'basic_salary' => 'required|numeric|min:0',
                'allowances' => 'sometimes|numeric|min:0',
                'tax_id' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:255',
                'bank_account_number' => 'nullable|string|max:255',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:255',
                'user_id' => 'nullable|exists:users,id',
            ]);

            $validated['employee_number'] = Employee::generateEmployeeNumber($validated['pharmacy_id']);
            $validated['status'] = 'active';

            $employee = Employee::create($validated);

            return response()->json([
                'message' => 'Employee created successfully.',
                'employee' => $employee,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create employee.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $employee = Employee::with(['user', 'attendance' => function ($q) {
                $q->latest()->limit(30);
            }, 'leaves' => function ($q) {
                $q->latest()->limit(20);
            }, 'payroll' => function ($q) {
                $q->latest()->limit(12);
            }, 'performanceReviews' => function ($q) {
                $q->latest()->limit(10);
            }])->findOrFail($id);

            return response()->json(['employee' => $employee]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Employee not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch employee.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);

            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255',
                'phone' => 'sometimes|string|max:255',
                'date_of_birth' => 'nullable|date',
                'gender' => 'sometimes|in:male,female,other',
                'national_id' => 'nullable|string|max:255',
                'position' => 'sometimes|string|max:255',
                'department' => 'sometimes|in:pharmacy,management,finance,operations,hr',
                'employment_type' => 'sometimes|in:full_time,part_time,contract,intern',
                'hire_date' => 'sometimes|date',
                'contract_end_date' => 'nullable|date',
                'basic_salary' => 'sometimes|numeric|min:0',
                'allowances' => 'sometimes|numeric|min:0',
                'tax_id' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:255',
                'bank_account_number' => 'nullable|string|max:255',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:255',
                'status' => 'sometimes|in:active,inactive,suspended,terminated',
                'user_id' => 'nullable|exists:users,id',
            ]);

            $employee->update($validated);

            return response()->json([
                'message' => 'Employee updated successfully.',
                'employee' => $employee->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Employee not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update employee.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee->delete();

            return response()->json(['message' => 'Employee deleted successfully.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Employee not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete employee.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getStats(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $baseQuery = Employee::when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            $total = (clone $baseQuery)->count();
            $active = (clone $baseQuery)->where('status', 'active')->count();
            $onLeave = (clone $baseQuery)->where('status', 'active')
                ->whereHas('leaves', fn ($q) => $q->where('status', 'approved')
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())
                )->count();
            $newThisMonth = (clone $baseQuery)->whereMonth('hire_date', now()->month)
                ->whereYear('hire_date', now()->year)->count();

            $byDepartment = (clone $baseQuery)->selectRaw('department, count(*) as count')
                ->groupBy('department')->get();

            $byStatus = (clone $baseQuery)->selectRaw('status, count(*) as count')
                ->groupBy('status')->get();

            return response()->json([
                'total' => $total,
                'active' => $active,
                'on_leave' => $onLeave,
                'new_this_month' => $newThisMonth,
                'by_department' => $byDepartment,
                'by_status' => $byStatus,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch stats.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function toggleStatus($id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee->status = $employee->status === 'active' ? 'inactive' : 'active';
            $employee->save();

            return response()->json([
                'message' => 'Employee status updated.',
                'employee' => $employee->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Employee not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
