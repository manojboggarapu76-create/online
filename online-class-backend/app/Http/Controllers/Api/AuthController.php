<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     * Body: name, email, password, password_confirmation
     * Creates the account and immediately signs the person in, same as login.
     */
    public function register(Request $request)
    {
        // Normalize before validating, so "Jane@Example.com " and
        // "jane@example.com" are treated as the same address consistently
        // -- this is what actually prevents mobile-keyboard autocapitalize
        // or a stray trailing space from producing a confusing "email
        // already taken" or "no account found" a moment later.
        $request->merge([
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return $this->issueSession($user, 201);
    }

    /**
     * POST /api/auth/login
     * Body: email, password
     */
    public function login(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Those credentials don\'t match an account.'],
            ]);
        }

        return $this->issueSession($user, 200);
    }

    /**
     * POST /api/auth/logout (auth required)
     */
    public function logout(Request $request)
    {
        UserSession::where('token', $request->bearerToken())->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * GET /api/auth/me (auth required)
     * Lets the frontend restore a session on page load and check payment status.
     */
    public function me(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'paid' => $user->hasPaidForOnlineClass(),
        ]);
    }

    private function issueSession(User $user, int $status)
    {
        $token = Str::random(64);

        UserSession::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'paid' => $user->hasPaidForOnlineClass(),
        ], $status);
    }
}
