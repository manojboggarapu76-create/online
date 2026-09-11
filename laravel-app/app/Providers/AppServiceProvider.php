<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Railway terminates TLS at the proxy. Protected signed URLs must be
        // generated from the public HTTPS backend domain, not the internal
        // HTTP request scheme.
        if ($this->app->environment('production')) {
            $publicDomain = trim((string) env('RAILWAY_PUBLIC_DOMAIN', ''));
            if ($publicDomain !== '') {
                $publicDomain = preg_replace('#^https?://#i', '', $publicDomain);
                URL::forceRootUrl('https://' . rtrim($publicDomain, '/'));
            }
            URL::forceScheme('https');
        }
    }
}
