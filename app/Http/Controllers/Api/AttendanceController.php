<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Attendance::with('employee');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('date_from')) {
                $query->where('date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('date', '<=', $request->input('date_to'));
            }

            $attendance = $query->latest('date')->paginate($request->input('per_page', 20));

            return response()->json($attendance);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch attendance records.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'date' => 'required|date',
                'status' => 'required|in:present,absent,late,half_day,leave,holiday',
                'notes' => 'nullable|string|max:255',
                'recorded_by' => 'nullable|exists:users,id',
            ]);

            $existing = Attendance::where('employee_id', $validated['employee_id'])
                ->where('date', $validated['date'])
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Attendance record already exists for this date.',
                ], 422);
            }

            $validated['hours_worked'] = 0;
            $validated['overtime_hours'] = 0;

            $attendance = Attendance::create($validated);

            return response()->json([
                'message' => 'Attendance recorded.',
                'attendance' => $attendance->load('employee'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to record attendance.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function clockIn(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'employee_id' => 'required|exists:employees,id',
            ]);

            $today = now()->toDateString();

            $attendance = Attendance::where('employee_id', $request->input('employee_id'))
                ->where('date', $today)
                ->first();

            if ($attendance && $attendance->clock_in) {
                return response()->json([
                    'message' => 'Already clocked in today.',
                ], 422);
            }

            if ($attendance) {
                $attendance->clock_in = now();
                $attendance->status = now()->hour >= 8 ? 'late' : 'present';
                $attendance->save();
            } else {
                $attendance = Attendance::create([
                    'employee_id' => $request->input('employee_id'),
                    'date' => $today,
                    'clock_in' => now(),
                    'status' => now()->hour >= 8 ? 'late' : 'present',
                    'hours_worked' => 0,
                    'overtime_hours' => 0,
                    'recorded_by' => $request->input('recorded_by'),
                ]);
            }

            return response()->json([
                'message' => 'Clocked in successfully.',
                'attendance' => $attendance->load('employee'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to clock in.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function clockOut(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'employee_id' => 'required|exists:employees,id',
            ]);

            $today = now()->toDateString();

            $attendance = Attendance::where('employee_id', $request->input('employee_id'))
                ->where('date', $today)
                ->first();

            if (!$attendance || !$attendance->clock_in) {
                return response()->json([
                    'message' => 'No clock-in record found for today.',
                ], 422);
            }

            if ($attendance->clock_out) {
                return response()->json([
                    'message' => 'Already clocked out today.',
                ], 422);
            }

            $attendance->clock_out = now();
            $attendance->calculateHours();
            $attendance->save();

            return response()->json([
                'message' => 'Clocked out successfully.',
                'attendance' => $attendance->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to clock out.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $attendance = Attendance::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|in:present,absent,late,half_day,leave,holiday',
                'clock_in' => 'nullable|date',
                'clock_out' => 'nullable|date|after_or_equal:clock_in',
                'hours_worked' => 'sometimes|numeric|min:0',
                'overtime_hours' => 'sometimes|numeric|min:0',
                'notes' => 'nullable|string|max:255',
            ]);

            $attendance->update($validated);

            return response()->json([
                'message' => 'Attendance updated.',
                'attendance' => $attendance->fresh()->load('employee'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Attendance record not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update attendance.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $attendance = Attendance::findOrFail($id);
            $attendance->delete();

            return response()->json(['message' => 'Attendance record deleted.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Attendance record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete attendance.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getReport(Request $request): JsonResponse
    {
        try {
            $query = Attendance::with('employee');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('date_from')) {
                $query->where('date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('date', '<=', $request->input('date_to'));
            }

            $records = $query->get();

            $totalDays = $records->count();
            $present = $records->where('status', 'present')->count();
            $absent = $records->where('status', 'absent')->count();
            $late = $records->where('status', 'late')->count();
            $onLeave = $records->where('status', 'leave')->count();
            $totalHours = $records->sum('hours_worked');
            $totalOvertime = $records->sum('overtime_hours');
            $attendanceRate = $totalDays > 0 ? round(($present / $totalDays) * 100, 1) : 0;

            return response()->json([
                'total_days' => $totalDays,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'on_leave' => $onLeave,
                'total_hours' => round($totalHours, 2),
                'total_overtime' => round($totalOvertime, 2),
                'attendance_rate' => $attendanceRate,
                'avg_hours_per_day' => $totalDays > 0 ? round($totalHours / $totalDays, 2) : 0,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
