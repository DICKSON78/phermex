<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class VerifyEmailController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->email_verified_at) {
                return response()->json(['message' => 'Email already verified.']);
            }

            $code = strtoupper(Str::random(6));

            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => $code,
                'created_at' => now(),
            ]);

            Mail::raw("Your Pharmex verification code is: {$code}\n\nThis code expires in 15 minutes.", function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Verify your Pharmex email');
            });

            return response()->json([
                'message' => 'Verification code sent.',
                'debug_code' => config('app.debug') ? $code : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send verification code.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function verify(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|size:6',
            ]);

            $user = $request->user();

            $token = DB::table('password_reset_tokens')
                ->where('email', $user->email)
                ->where('token', $validated['code'])
                ->where('created_at', '>', now()->subMinutes(15))
                ->first();

            if (!$token) {
                return response()->json(['message' => 'Invalid or expired verification code.'], 422);
            }

            $user->update(['email_verified_at' => now()]);

            DB::table('password_reset_tokens')
                ->where('email', $user->email)
                ->delete();

            return response()->json(['message' => 'Email verified successfully.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Verification failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
