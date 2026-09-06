<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\UserSessionIssuer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleOAuthController extends Controller
{
    private const STATE_KEY = 'google_oauth.state';
    private const VERIFIER_KEY = 'google_oauth.verifier';
    private const HANDOFF_PREFIX = 'google_oauth.handoff.';

    /** Start the OAuth authorization-code flow with PKCE and a CSRF state. */
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->redirectToFrontend('/login', [
                'oauth_error' => 'Google sign-in is not configured yet. Please use email sign-in or contact support.',
            ]);
        }

        $state = Str::random(64);
        $verifier = Str::random(96);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        $request->session()->put(self::STATE_KEY, $state);
        $request->session()->put(self::VERIFIER_KEY, $verifier);

        $query = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
            'prompt' => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);

        return redirect()->away("https://accounts.google.com/o/oauth2/v2/auth?{$query}");
    }

    /** Receive Google's callback, validate it, and create an existing API session. */
    public function callback(Request $request, UserSessionIssuer $sessions): RedirectResponse
    {
        $state = (string) $request->session()->pull(self::STATE_KEY, '');
        $verifier = (string) $request->session()->pull(self::VERIFIER_KEY, '');

        if ($request->filled('error')) {
            return $this->redirectToFrontend('/login', [
                'oauth_error' => 'Google sign-in was cancelled or denied.',
            ]);
        }

        if (! $this->isConfigured() || ! $request->filled('code') || ! $state || ! $verifier || ! hash_equals($state, (string) $request->input('state'))) {
            return $this->redirectToFrontend('/login', [
                'oauth_error' => 'Google sign-in could not be verified. Please try again.',
            ]);
        }

        try {
            $tokenResponse = Http::asForm()
                ->acceptJson()
                ->timeout(15)
                ->post('https://oauth2.googleapis.com/token', [
                    'code' => $request->input('code'),
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'redirect_uri' => config('services.google.redirect_uri'),
                    'grant_type' => 'authorization_code',
                    'code_verifier' => $verifier,
                ]);

            if (! $tokenResponse->successful() || ! $tokenResponse->json('access_token')) {
                return $this->redirectToFrontend('/login', [
                    'oauth_error' => 'Google sign-in could not be completed. Please try again.',
                ]);
            }

            $profileResponse = Http::withToken($tokenResponse->json('access_token'))
                ->acceptJson()
                ->timeout(15)
                ->get('https://openidconnect.googleapis.com/v1/userinfo');

            if (! $profileResponse->successful()) {
                return $this->redirectToFrontend('/login', [
                    'oauth_error' => 'Google account details could not be verified. Please try again.',
                ]);
            }

            $profile = $profileResponse->json();
            if (! is_array($profile)) {
                return $this->redirectToFrontend('/login', [
                    'oauth_error' => 'Google account details could not be verified. Please try again.',
                ]);
            }
            $googleId = trim((string) ($profile['sub'] ?? ''));
            $email = strtolower(trim((string) ($profile['email'] ?? '')));
            $emailVerified = filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (! $googleId || ! filter_var($email, FILTER_VALIDATE_EMAIL) || ! $emailVerified) {
                return $this->redirectToFrontend('/login', [
                    'oauth_error' => 'A verified Google email address is required to sign in.',
                ]);
            }

            $googleUser = User::where('google_id', $googleId)->first();
            $emailUser = User::where('email', $email)->first();

            if ($googleUser && $emailUser && $googleUser->id !== $emailUser->id) {
                return $this->redirectToFrontend('/login', [
                    'oauth_error' => 'This Google account is linked to a different student account.',
                ]);
            }

            $user = $googleUser ?: $emailUser;
            if (! $user) {
                $user = User::create([
                    'name' => trim((string) ($profile['name'] ?? '')) ?: Str::before($email, '@'),
                    'email' => $email,
                    // A Google-only account has no usable local password. A
                    // high-entropy hash preserves the existing schema safely.
                    'password' => Hash::make(Str::random(64)),
                    'google_id' => $googleId,
                    'email_verified_at' => now(),
                ]);
            } elseif (! $user->google_id) {
                $user->forceFill([
                    'google_id' => $googleId,
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ])->save();
            }

            $handoff = Str::random(64);
            Cache::put(self::HANDOFF_PREFIX.$handoff, $sessions->issue($user, $request), now()->addMinute());

            return $this->redirectToFrontend('/auth/google/callback', ['handoff' => $handoff]);
        } catch (\Throwable $e) {
            report($e);

            return $this->redirectToFrontend('/login', [
                'oauth_error' => 'Google sign-in is temporarily unavailable. Please try again.',
            ]);
        }
    }

    /** Exchange the short-lived, one-time browser handoff for the API session. */
    public function exchange(Request $request)
    {
        $validated = $request->validate([
            'handoff' => ['required', 'string', 'size:64'],
        ]);

        $session = Cache::pull(self::HANDOFF_PREFIX.$validated['handoff']);

        if (! is_array($session) || empty($session['token']) || empty($session['user'])) {
            return response()->json([
                'message' => 'This Google sign-in link has expired. Please sign in again.',
            ], 422);
        }

        return response()->json($session);
    }

    private function isConfigured(): bool
    {
        return (bool) (config('services.google.client_id')
            && config('services.google.client_secret')
            && config('services.google.redirect_uri')
            && config('services.google.frontend_url'));
    }

    private function redirectToFrontend(string $path, array $query = []): RedirectResponse
    {
        $url = rtrim((string) config('services.google.frontend_url'), '/').$path;

        if ($query) {
            $url .= '?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        }

        return redirect()->away($url);
    }
}
