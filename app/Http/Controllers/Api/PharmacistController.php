<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacist;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PharmacistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Pharmacist::with('user')
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('position')) {
                $query->where('position', $request->input('position'));
            }

            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $pharmacists = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($pharmacists);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch staff.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'required|email|unique:users,email',
                'password' => ['required', 'string', 'min:8', 'confirmed'],
                'license_number' => 'nullable|string|max:255',
                'position' => 'sometimes|in:pharmacist,technician,intern,cashier',
                'salary' => 'sometimes|numeric|min:0',
                'permissions' => 'sometimes|nullable|array',
            ]);

            DB::beginTransaction();

            $userCode = 'PHX-' . strtoupper(Str::random(6));

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role' => $validated['position'] === 'cashier' ? 'cashier' : 'pharmacist',
                'user_code' => $userCode,
                'password' => Hash::make($validated['password']),
                'is_active' => true,
            ]);

            $user->pharmacy()->attach($validated['pharmacy_id']);

            $pharmacist = Pharmacist::create([
                'user_id' => $user->id,
                'pharmacy_id' => $validated['pharmacy_id'],
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'license_number' => $validated['license_number'] ?? null,
                'position' => $validated['position'] ?? 'pharmacist',
                'salary' => $validated['salary'] ?? 0,
                'permissions' => $validated['permissions'] ?? null,
                'is_active' => true,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Staff member created successfully.',
                'pharmacist' => $pharmacist->load('user'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create staff member.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::with(['user', 'pharmacy'])
                ->where('pharmacy_id', $request->input('pharmacy_id'))
                ->findOrFail($id);

            return response()->json([
                'pharmacist' => $pharmacist,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch staff member.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::where('pharmacy_id', $request->input('pharmacy_id'))->findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'license_number' => 'sometimes|nullable|string|max:255',
                'position' => 'sometimes|in:pharmacist,technician,intern,cashier',
                'salary' => 'sometimes|numeric|min:0',
                'permissions' => 'sometimes|nullable|array',
            ]);

            $pharmacist->update($validated);

            if (isset($validated['name']) && $pharmacist->user) {
                $pharmacist->user->update(['name' => $validated['name']]);
            }

            return response()->json([
                'message' => 'Staff member updated successfully.',
                'pharmacist' => $pharmacist->fresh()->load('user'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update staff member.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::where('pharmacy_id', $request->input('pharmacy_id'))->findOrFail($id);

            if ($pharmacist->user) {
                $pharmacist->user->update(['is_active' => false]);
            }

            $pharmacist->delete();

            return response()->json([
                'message' => 'Staff member removed successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to remove staff member.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function toggleActive(Request $request, $id): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::where('pharmacy_id', $request->input('pharmacy_id'))->findOrFail($id);
            $pharmacist->update(['is_active' => !$pharmacist->is_active]);

            if ($pharmacist->user) {
                $pharmacist->user->update(['is_active' => $pharmacist->is_active]);
            }

            return response()->json([
                'message' => 'Staff member status updated.',
                'pharmacist' => $pharmacist->fresh()->load('user'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle staff status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
