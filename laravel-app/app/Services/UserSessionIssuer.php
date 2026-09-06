<?php

namespace App\Services;

use App\Models\LoginRecord;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates the API-token session used by every student authentication method.
 * Keeping this in one place prevents Google sign-in and password sign-in from
 * drifting apart in their access, audit, and expiry behaviour.
 */
class UserSessionIssuer
{
    public function issue(User $user, Request $request): array
    {
        $token = Str::random(64);

        $session = UserSession::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(30),
        ]);

        try {
            LoginRecord::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent() ?? 'Web Browser',
                'login_at' => now(),
            ]);

            // One atomic update is materially cheaper than calling increment()
            // and update() separately during a large simultaneous login wave.
            DB::table('users')->where('id', $user->id)->update([
                'login_count' => DB::raw('COALESCE(login_count, 0) + 1'),
                'last_login_at' => now(),
                'last_login_ip' => $request->ip() ?? '127.0.0.1',
                'updated_at' => now(),
            ]);
            $user->refresh();
        } catch (\Throwable $e) {
            // Authentication must still succeed if optional analytics storage
            // is temporarily unavailable.
        }

        app(UserSessionCache::class)->put($session, $user);

        return [
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'login_count' => $user->login_count ?? 1,
                'last_login_at' => $user->last_login_at,
            ],
            'paid' => $user->hasPaidForOnlineClass(),
        ];
    }
}
