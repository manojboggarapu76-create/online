<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            if ($request->is('api/stream/*') || $request->is('api/download/*') || $request->is('api/welcome-screen/stream')) {
                return Limit::none();
            }

            // The former IP-only limit would reject legitimate students who
            // share a campus/company NAT during a simultaneous login event.
            // Limit each account attempt independently while retaining an IP
            // ceiling that protects password hashing from brute-force bursts.
            if ($request->is('api/auth/login')) {
                $email = strtolower(trim((string) $request->input('email')));

                return [
                    Limit::perMinute(10)->by('login-email:'.hash('sha256', $email)),
                    Limit::perMinute(500)->by('login-ip:'.$request->ip()),
                ];
            }

            if ($request->is('api/auth/register')) {
                $email = strtolower(trim((string) $request->input('email')));

                return [
                    Limit::perMinute(5)->by('register-email:'.hash('sha256', $email)),
                    Limit::perMinute(100)->by('register-ip:'.$request->ip()),
                ];
            }

            return Limit::perMinute((int) env('API_RATE_LIMIT_PER_MINUTE', 120))
                ->by($request->user()?->id ?: $request->ip());
        });
    }
}
