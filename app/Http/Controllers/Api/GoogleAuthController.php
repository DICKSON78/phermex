<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * "Sign in with Google" for the customer app and the dashboard.
 *
 * The token is verified against Google's signing keys before anything is read
 * from it, so a caller cannot invent an email address.
 *
 * Customers: a Google account is enough to get an account, so we create one on
 * first sign-in (customers have no approval or payment gate).
 *
 * Staff and owners: the account must already exist. Creating them here would
 * hand out dashboard access — and a paid plan — to any Google account, which
 * would bypass registration, approval and payment.
 */
class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly GoogleTokenVerifier $verifier,
        private readonly AuthController $auth,
    ) {
    }

    /**
     * POST /api/customer-app/login/google
     */
    public function customerLogin(Request $request): JsonResponse
    {
        try {
            $request->validate(['id_token' => 'required|string']);

            $google = $this->verifier->verify((string) $request->input('id_token'));

            $user = User::where('email', $google['email'])->first();

            if ($user && $user->role !== 'customer') {
                // Same address is already a staff account; don't mix identities.
                return response()->json([
                    'message' => 'This email is already registered as a pharmacy account. Please sign in with your password.',
                ], 403);
            }

            if (! $user) {
                $user = User::create([
                    'name' => $google['name'] ?: Str::before($google['email'], '@'),
                    'email' => $google['email'],
                    'photo' => $google['picture'],
                    'role' => 'customer',
                    'user_code' => 'CUS-'.strtoupper(Str::random(8)),
                    // Unusable password: this account signs in with Google only.
                    'password' => Hash::make(Str::random(40)),
                    'is_active' => true,
                ]);
            }

            if (! $user->is_active) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            $user->forceFill([
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            return $this->success($user, $user->wasRecentlyCreated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Google sign-in failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    /**
     * POST /api/auth/google
     */
    public function staffLogin(Request $request): JsonResponse
    {
        try {
            $request->validate(['id_token' => 'required|string']);

            $google = $this->verifier->verify((string) $request->input('id_token'));

            $user = User::where('email', $google['email'])->first();

            if (! $user || $user->role === 'customer') {
                return response()->json([
                    'message' => 'No pharmacy account uses this email. Please register and complete your plan first.',
                ], 403);
            }

            if (! $user->is_active) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            // Same module gating the password login applies, so Google sign-in
            // cannot be used to reach a rejected or unpaid account.
            $session = $this->auth->buildSession($user);

            if (! empty($session['rejected'])) {
                return response()->json([
                    'message' => 'Your application has been rejected.',
                    'rejection_reason' => $session['rejection_reason'],
                    'application_status' => 'rejected',
                ], 403);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful.',
                'user' => $session['user'],
                'token' => $token,
                'subscription' => $session['subscription'],
                'email_verified' => $session['email_verified'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Google sign-in failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    private function success(User $user, bool $created): JsonResponse
    {
        $token = $user->createToken('customer-auth-token')->plainTextToken;

        return response()->json([
            'message' => $created ? 'Account created.' : 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'created' => $created,
            ],
        ], $created ? 201 : 200);
    }
}
