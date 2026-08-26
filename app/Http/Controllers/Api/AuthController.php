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
                $rules['pharmacy_name'] = 'sometimes|required_without:pharmacies|string|max:255';
                $rules['pharmacy_type'] = 'sometimes|string|max:50';
                $rules['license_number'] = 'sometimes|string|max:100';
                $rules['license_expiry'] = 'sometimes|nullable|date';
                $rules['country'] = 'required|string|max:100';
                $rules['region'] = 'sometimes|required_without:pharmacies|string|max:255';
                $rules['district'] = 'sometimes|required_without:pharmacies|string|max:255';
                $rules['ward'] = 'sometimes|nullable|string|max:255';
                $rules['street'] = 'sometimes|nullable|string|max:255';
                $rules['latitude'] = 'sometimes|nullable|numeric|between:-90,90';
                $rules['longitude'] = 'sometimes|nullable|numeric|between:-180,180';
                $rules['opening_capital'] = 'sometimes|nullable|numeric|min:0';
                $rules['working_days'] = 'sometimes|nullable|array';
                $rules['working_hours'] = 'sometimes|nullable|array';
                $rules['description'] = 'sometimes|nullable|string|max:1000';
                $rules['subscription_plan_id'] = 'required|exists:subscription_plans,id';

                $rules['pharmacies'] = 'sometimes|array|min:1';
                $rules['pharmacies.*.pharmacy_name'] = 'required|string|max:255';
                $rules['pharmacies.*.pharmacy_type'] = 'sometimes|string|max:50';
                $rules['pharmacies.*.license_number'] = 'sometimes|nullable|string|max:100';
                $rules['pharmacies.*.license_expiry'] = 'sometimes|nullable|date';
                $rules['pharmacies.*.country'] = 'sometimes|nullable|string|max:100';
                $rules['pharmacies.*.region'] = 'required|string|max:255';
                $rules['pharmacies.*.district'] = 'required|string|max:255';
                $rules['pharmacies.*.ward'] = 'sometimes|nullable|string|max:255';
                $rules['pharmacies.*.street'] = 'sometimes|nullable|string|max:255';
                $rules['pharmacies.*.latitude'] = 'sometimes|nullable|numeric|between:-90,90';
                $rules['pharmacies.*.longitude'] = 'sometimes|nullable|numeric|between:-180,180';
                $rules['pharmacies.*.opening_capital'] = 'sometimes|nullable|numeric|min:0';
                $rules['pharmacies.*.working_days'] = 'sometimes|nullable|array';
                $rules['pharmacies.*.working_hours'] = 'sometimes|nullable|array';
                $rules['pharmacies.*.description'] = 'sometimes|nullable|string|max:1000';
            }

            $validated = $request->validate($rules);

            $userCode = User::generateUserCode();

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
            $pharmacies = [];

            if ($user->isOwner()) {
                $pharmacyInputs = [];

                if (!empty($validated['pharmacies'])) {
                    $pharmacyInputs = $validated['pharmacies'];
                } else {
                    $pharmacyInputs[] = [
                        'pharmacy_name' => $validated['pharmacy_name'],
                        'pharmacy_type' => $validated['pharmacy_type'] ?? 'independent',
                        'license_number' => $validated['license_number'] ?? null,
                        'license_expiry' => $validated['license_expiry'] ?? null,
                        'country' => $validated['country'] ?? null,
                        'region' => $validated['region'] ?? null,
                        'district' => $validated['district'] ?? null,
                        'ward' => $validated['ward'] ?? null,
                        'street' => $validated['street'] ?? null,
                        'latitude' => $validated['latitude'] ?? null,
                        'longitude' => $validated['longitude'] ?? null,
                        'opening_capital' => $validated['opening_capital'] ?? 0,
                        'working_days' => $validated['working_days'] ?? null,
                        'working_hours' => $validated['working_hours'] ?? null,
                        'description' => $validated['description'] ?? null,
                    ];
                }

                foreach ($pharmacyInputs as $input) {
                    $pharmacyData = [
                        'owner_id' => $user->id,
                        'pharmacy_name' => $input['pharmacy_name'],
                        'pharmacy_code' => 'PHM-' . strtoupper(Str::random(6)),
                        'pharmacy_type' => $input['pharmacy_type'] ?? 'independent',
                        'license_number' => $input['license_number'] ?? null,
                        'license_expiry' => $input['license_expiry'] ?? null,
                        'country' => $input['country'] ?? $validated['country'],
                        'region' => $input['region'],
                        'district' => $input['district'],
                        'ward' => $input['ward'] ?? null,
                        'street' => $input['street'] ?? null,
                        'latitude' => $input['latitude'] ?? null,
                        'longitude' => $input['longitude'] ?? null,
                        'phone' => $validated['phone'],
                        'email' => $validated['email'],
                        'description' => $input['description'] ?? null,
                        'working_days' => $input['working_days'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        'working_hours' => $input['working_hours'] ?? ['open' => '08:00', 'close' => '18:00'],
                        'opening_capital' => $input['opening_capital'] ?? 0,
                        'status' => 'pending',
                        'application_status' => 'pending',
                        'is_published' => false,
                        'subscription_plan_id' => $validated['subscription_plan_id'],
                        'subscription_amount' => \App\Models\SubscriptionPlan::find($validated['subscription_plan_id'])?->price,
                        'payment_status' => 'unpaid',
                    ];

                    $created = Pharmacy::create($pharmacyData);

                    $user->pharmacy()->attach($created->id);

                    if ($pharmacy === null) {
                        $pharmacy = $created;
                    }

                    $pharmacies[] = $created;
                }

                if ($pharmacies) {
                    $user->update(['current_pharmacy_id' => $pharmacies[0]->id]);
                    $user->refresh();
                }
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            DB::commit();

            $user->accessible_pharmacies = $user->accessiblePharmacies();

            return response()->json([
                'message' => 'Registration successful.',
                'user' => $user->load('pharmacy'),
                'pharmacy' => $pharmacy,
                'pharmacies' => $pharmacies,
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
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
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

            if (!$user->current_pharmacy_id) {
                $user->update(['current_pharmacy_id' => $user->resolveCurrentPharmacyId()]);
                $user->refresh();
            }

            $pharmacyId = $user->resolveCurrentPharmacyId();
            $pharmacy = $pharmacyId ? \App\Models\Pharmacy::find($pharmacyId) : null;
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
                'user' => $user->load('pharmacy', 'currentPharmacy'),
                'token' => $token,
                'subscription' => $subscriptionInfo,
                'email_verified' => $user->email_verified_at !== null,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
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
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user->current_pharmacy_id) {
                $user->update(['current_pharmacy_id' => $user->resolveCurrentPharmacyId()]);
                $user->refresh();
            }

            $user->load('pharmacy', 'currentPharmacy');
            $user->accessible_pharmacies = $user->accessiblePharmacies();

            return response()->json($user);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve user.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
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
            return response()->json(['message' => 'Failed to change password.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
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
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
