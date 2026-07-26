<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        try {
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'required|string|max:20',
                'password' => ['required', 'string', 'min:8', 'confirmed'],
                'role' => 'sometimes|in:owner,pharmacist,cashier,delivery,customer',
            ];

            if ($request->role === 'owner' || $request->input('role', 'owner') === 'owner') {
                $rules['pharmacy_name'] = 'required|string|max:255';
                $rules['pharmacy_type'] = 'sometimes|string|max:50';
                $rules['license_number'] = 'sometimes|string|max:100';
                $rules['license_expiry'] = 'sometimes|nullable|date';
                $rules['country'] = 'required|string|max:100';
                $rules['region'] = 'required|string|max:255';
                $rules['district'] = 'required|string|max:255';
                $rules['ward'] = 'sometimes|nullable|string|max:255';
                $rules['street'] = 'sometimes|nullable|string|max:255';
                $rules['latitude'] = 'sometimes|nullable|numeric|between:-90,90';
                $rules['longitude'] = 'sometimes|nullable|numeric|between:-180,180';
                $rules['opening_capital'] = 'sometimes|nullable|numeric|min:0';
                $rules['working_days'] = 'sometimes|nullable|array';
                $rules['working_hours'] = 'sometimes|nullable|array';
                $rules['description'] = 'sometimes|nullable|string|max:1000';
                $rules['subscription_plan_id'] = 'required|exists:subscription_plans,id';
            }

            $validated = $request->validate($rules);

            $userCode = 'PHX-' . strtoupper(Str::random(6));

            DB::beginTransaction();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'role' => $validated['role'] ?? 'owner',
                'user_code' => $userCode,
                'password' => Hash::make($validated['password']),
                'is_active' => true,
            ]);

            $pharmacy = null;

            if ($user->isOwner()) {
                $pharmacyCode = 'PHM-' . strtoupper(Str::random(6));

                $pharmacyData = [
                    'owner_id' => $user->id,
                    'pharmacy_name' => $validated['pharmacy_name'],
                    'pharmacy_code' => $pharmacyCode,
                    'pharmacy_type' => $validated['pharmacy_type'] ?? 'independent',
                    'license_number' => $validated['license_number'] ?? null,
                    'license_expiry' => $validated['license_expiry'] ?? null,
                    'country' => $validated['country'],
                    'region' => $validated['region'],
                    'district' => $validated['district'],
                    'ward' => $validated['ward'] ?? null,
                    'street' => $validated['street'] ?? null,
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'phone' => $validated['phone'],
                    'email' => $validated['email'],
                    'description' => $validated['description'] ?? null,
                    'working_days' => $validated['working_days'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    'working_hours' => $validated['working_hours'] ?? ['open' => '08:00', 'close' => '18:00'],
                    'opening_capital' => $validated['opening_capital'] ?? 0,
                    'status' => 'pending',
                    'application_status' => 'pending',
                    'is_published' => false,
                    'subscription_plan_id' => $validated['subscription_plan_id'],
                    'subscription_amount' => \App\Models\SubscriptionPlan::find($validated['subscription_plan_id'])?->price,
                    'payment_status' => 'unpaid',
                    'trial_ends_at' => now()->addDays(7),
                ];

                $pharmacy = Pharmacy::create($pharmacyData);

                $user->pharmacy()->attach($pharmacy->id);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            DB::commit();

            return response()->json([
                'message' => 'Registration successful.',
                'user' => $user->load('pharmacy'),
                'pharmacy' => $pharmacy,
                'token' => $token,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'login' => 'required|string',
                'password' => 'required|string',
            ]);

            $login = $request->input('login');
            $password = $request->input('password');

            $query = User::where(function ($q) use ($login) {
                $q->where('email', $login)->orWhere('phone', $login);
            });

            $user = $query->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            $pharmacy = $user->pharmacy()->first();
            $appStatus = null;
            $subscriptionInfo = null;

            if ($pharmacy) {
                $appStatus = $pharmacy->application_status;

                $subscriptionInfo = [
                    'application_status' => $appStatus,
                    'subscription_type' => $pharmacy->subscriptionType(),
                    'days_remaining' => $pharmacy->daysRemaining(),
                    'trial_ends_at' => $pharmacy->trial_ends_at?->toISOString(),
                    'subscription_end_date' => $pharmacy->subscription_end_date?->toISOString(),
                    'payment_status' => $pharmacy->payment_status,
                ];

                if ($appStatus === 'rejected') {
                    return response()->json([
                        'message' => 'Your application has been rejected.',
                        'rejection_reason' => $pharmacy->rejection_reason,
                        'application_status' => 'rejected',
                    ], 403);
                }

                if ($appStatus === 'pending' || $appStatus === 'approved') {
                    if ($pharmacy->payment_status !== 'paid') {
                        $subscriptionInfo['requires_payment'] = true;
                    }
                    if ($appStatus === 'pending') {
                        $subscriptionInfo['pending_approval'] = true;
                    }
                }
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful.',
                'user' => $user->load('pharmacy'),
                'token' => $token,
                'subscription' => $subscriptionInfo,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logged out successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load('pharmacy');

            return response()->json($user);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);

            $user = $request->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }

            $user->update(['password' => Hash::make($validated['password'])]);

            return response()->json(['message' => 'Password changed successfully.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to change password.', 'error' => $e->getMessage()], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'photo' => 'sometimes|nullable|string|max:255',
                'location' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'road' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            ]);

            if (isset($validated['password']) && $validated['password']) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user->fresh()->load('pharmacy'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update profile.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
