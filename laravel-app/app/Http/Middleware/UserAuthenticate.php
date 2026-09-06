<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use App\Services\UserSessionCache;
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

        $sessionCache = app(UserSessionCache::class);
        $cached = $sessionCache->resolve($token);

        if (! $cached) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }

        $expiresAt = now()->setTimestamp($cached['expires_at']);

        // Preserve the rolling 30-day expiry without writing on every request.
        // This avoids a database write storm when many students browse at once.
        if ($expiresAt->lte(now()->addDays(7))) {
            $newExpiry = now()->addDays(30);
            UserSession::whereKey($cached['session_id'])->update(['expires_at' => $newExpiry]);
            $cached['expires_at'] = $newExpiry->getTimestamp();
            $renewedSession = new UserSession;
            $renewedSession->forceFill([
                'id' => $cached['session_id'],
                'token' => $token,
                'expires_at' => $newExpiry,
            ]);
            $sessionCache->put($renewedSession, $sessionCache->user($cached));
        }

        $request->attributes->set('auth_user', $sessionCache->user($cached));

        return $next($request);
    }
}
