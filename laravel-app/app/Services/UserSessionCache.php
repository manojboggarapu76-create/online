<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Support\Facades\Cache;

/**
 * Short-lived shared cache for bearer-token lookups.
 *
 * The database remains the source of truth. Cache failures intentionally fall
 * back to MySQL, so an unavailable cache never locks students out. With Redis
 * in production, this removes the repeated session/user query from the vast
 * majority of authenticated requests across every application server.
 */
class UserSessionCache
{
    public function resolve(string $token): ?array
    {
        $key = $this->key($token);

        try {
            $cached = Cache::get($key);
            if (is_array($cached) && ($cached['expires_at'] ?? 0) > now()->getTimestamp() && ! empty($cached['user'])) {
                return $cached;
            }
            if ($cached !== null) {
                Cache::forget($key);
            }
        } catch (\Throwable $e) {
            // Redis/cache may be temporarily unavailable. Resolve from the DB.
        }

        $session = UserSession::with('user')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $session || ! $session->user) {
            return null;
        }

        $payload = $this->payload($session);
        $this->store($token, $payload);

        return $payload;
    }

    public function put(UserSession $session, User $user): void
    {
        $session->setRelation('user', $user);
        $this->store($session->token, $this->payload($session));
    }

    public function forget(?string $token): void
    {
        if (! $token) {
            return;
        }

        try {
            Cache::forget($this->key($token));
        } catch (\Throwable $e) {
            // The DB deletion in logout is still authoritative.
        }
    }

    public function user(array $payload): User
    {
        $user = new User;
        $user->setRawAttributes($payload['user'], true);
        $user->exists = true;

        return $user;
    }

    private function payload(UserSession $session): array
    {
        return [
            'session_id' => $session->id,
            'expires_at' => $session->expires_at->getTimestamp(),
            // Do not cache password hashes or remember tokens.
            'user' => $session->user->only([
                'id', 'name', 'email', 'google_id', 'email_verified_at',
                'login_count', 'last_login_at', 'last_login_ip', 'created_at', 'updated_at',
            ]),
        ];
    }

    private function store(string $token, array $payload): void
    {
        $secondsUntilExpiry = max(1, $payload['expires_at'] - now()->getTimestamp());
        $ttl = min($secondsUntilExpiry, max(30, (int) env('AUTH_SESSION_CACHE_SECONDS', 120)));

        try {
            Cache::put($this->key($token), $payload, now()->addSeconds($ttl));
        } catch (\Throwable $e) {
            // Cache is an optimisation, not a dependency for authentication.
        }
    }

    private function key(string $token): string
    {
        // Never put the raw bearer token into a cache key.
        return 'auth-session:'.hash('sha256', $token);
    }
}
