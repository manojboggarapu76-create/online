<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserAuthenticate
{
    /**
     * Expects: Authorization: Bearer <token>
     * The token is the one returned by /api/auth/login or /api/auth/register.
     * On success the resolved user is attached to the request as "auth_user"
     * so controllers can read it with $request->attributes->get('auth_user').
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Login required.'], 401);
        }

        $session = UserSession::with('user')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $session || ! $session->user) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }

        // Sliding expiry: every authenticated action extends the session by 30 days.
        $session->update(['expires_at' => now()->addDays(30)]);

        $request->attributes->set('auth_user', $session->user);

        return $next($request);
    }
}
