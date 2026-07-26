<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::with('pharmacy');

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('user_code', 'like', "%{$search}%");
                });
            }

            if ($request->filled('role')) {
                $query->where('role', $request->input('role'));
            }

            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $users = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch users.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'role' => 'required|in:admin,owner,pharmacist,cashier,delivery,customer',
                'is_active' => 'boolean',
                'password' => 'required|string|min:8',
            ]);

            $validated['user_code'] = User::generateUserCode();
            $validated['password'] = Hash::make($validated['password']);
            $validated['is_active'] = $validated['is_active'] ?? true;

            $user = User::create($validated);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_created',
                'model_type' => User::class,
                'model_id' => $user->id,
                'new_values' => $user->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'User created successfully.',
                'user' => $user->load('pharmacy'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = User::with('pharmacy')->findOrFail($id);

            $data = $user->toArray();
            $data['orders_count'] = $user->customerAppOrders()->count();
            $data['prescriptions_count'] = \App\Models\Prescription::where('user_id', $user->id)->count();

            return response()->json(['data' => $data]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:20',
                'role' => 'sometimes|in:admin,owner,pharmacist,cashier,delivery,customer',
                'is_active' => 'boolean',
                'password' => 'nullable|string|min:8',
            ]);

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $oldValues = $user->only(array_keys($validated));
            $user->update($validated);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_updated',
                'model_type' => User::class,
                'model_id' => $user->id,
                'old_values' => $oldValues,
                'new_values' => $user->fresh()->toArray(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => $user->fresh()->load('pharmacy'),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'User not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            if ($user->id === $request->user()->id) {
                return response()->json(['message' => 'You cannot delete your own account.'], 400);
            }

            $user->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_deleted',
                'model_type' => User::class,
                'model_id' => $id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'User deleted successfully.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleActive(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['is_active' => !$user->is_active]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_active_toggled',
                'model_type' => User::class,
                'model_id' => $user->id,
                'new_values' => ['is_active' => $user->is_active],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'User status toggled.',
                'user' => $user->fresh()->load('pharmacy'),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle user status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
