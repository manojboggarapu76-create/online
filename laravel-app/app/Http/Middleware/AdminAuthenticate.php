<?php

namespace App\Http\Middleware;

use App\Models\AdminSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    /**
     * Expects: Authorization: Bearer <token>
     * The token is the one returned by POST /api/admin/login.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Admin authentication required.'], 401);
        }

        $session = AdminSession::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $session) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }

        // Sliding expiry: every authenticated action extends the session by 4 hours.
        $session->update(['expires_at' => now()->addHours(4)]);

        return $next($request);
    }
}
