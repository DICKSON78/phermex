<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PasswordResetController extends Controller
{
    private const CODE_TTL_MINUTES = 15;

    public function sendCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => 'required|string|max:255',
        ]);

        $user = $this->findUserByIdentifier($validated['identifier']);

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists for that email or phone, a reset code has been sent.',
            ]);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        try {
            Mail::raw(
                "Hello {$user->name},\n\nYour Helix password reset code is: {$code}\n\nThis code expires in "
                . self::CODE_TTL_MINUTES
                . " minutes. If you did not request a password reset, you can safely ignore this email.\n\n— The Helix Team",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Your Helix Password Reset Code');
                }
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'We could not send the reset code right now. Please try again later or contact support.',
            ], 500);
        }

        $response = [
            'message' => 'Reset code sent! Check your email inbox.',
            'data' => [
                'sent_to' => $this->maskIdentifier($validated['identifier']),
                'expires_in_minutes' => self::CODE_TTL_MINUTES,
            ],
        ];

        return response()->json($response);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => 'required|string|max:255',
            'code' => 'required|string|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $this->findUserByIdentifier($validated['identifier']);

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired reset code.'], 422);
        }

        $record = DB::table('password_reset_tokens')->where('email', $user->email)->first();

        if (
            !$record
            || now()->diffInMinutes(\Illuminate\Support\Carbon::parse($record->created_at)) > self::CODE_TTL_MINUTES
            || !Hash::check($validated['code'], $record->token)
        ) {
            return response()->json(['message' => 'Invalid or expired reset code.'], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json([
            'message' => 'Password reset successfully. You can now log in with your new password.',
        ]);
    }

    private function findUserByIdentifier(string $identifier): ?User
    {
        $identifier = trim($identifier);

        return User::where(function ($query) use ($identifier) {
            $query->where('email', $identifier)->orWhere('phone', $identifier);
        })->first();
    }

    private function maskIdentifier(string $identifier): string
    {
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            [$local, $domain] = explode('@', $identifier, 2);

            return substr($local, 0, min(2, strlen($local))) . '***@' . $domain;
        }

        return str_repeat('*', max(0, strlen($identifier) - 3)) . substr($identifier, -3);
    }
}
