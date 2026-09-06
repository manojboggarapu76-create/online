# Railway deployment

This repository contains two deployable applications. Deploy them as two
services in one Railway project; `online-class-backend` is an archived partial
source tree, not a deployable Laravel application.

| Railway service | Root directory | Runtime | Public domain |
| --- | --- | --- | --- |
| `frontend` | `/online-class-frontend` | Node.js 22 / npm 11 / Vite static site | Yes |
| `api` | `/laravel-app` | PHP 8.2+ (Railpack defaults to 8.4) / Node.js 22 for Vite | Yes |
| `mysql` | Railway MySQL service | MySQL | No |
| `redis` | Railway Redis service | Redis | No |

Railway's Railpack builder automatically detects the Vite SPA and Laravel app.
Do not set a custom start command for either web service. Laravel is served by
Railpack's FrankenPHP/Caddy integration, and the Vite application is served as
a static SPA with history fallback.

## Required API variables

Set these in the `api` service. Values in angle brackets must be replaced; do
not commit production values or secrets.

```dotenv
APP_NAME="Online Class"
APP_ENV=production
APP_KEY=<output of php artisan key:generate --show>
APP_DEBUG=false
APP_URL=https://<api-public-domain>
FRONTEND_URL=https://<frontend-public-domain>
CORS_ALLOWED_ORIGINS=https://<frontend-public-domain>

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

REDIS_CLIENT=phpredis
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

FILESYSTEM_DISK=local
LOG_CHANNEL=stderr
LOG_STDERR_FORMATTER=\Monolog\Formatter\JsonFormatter
RAILPACK_SKIP_MIGRATIONS=true
```

Also set the existing Razorpay, Google OAuth, and mail variables when those
features are used. Set `GOOGLE_REDIRECT_URI` to
`https://<api-public-domain>/auth/google/callback` and
`GOOGLE_OAUTH_FRONTEND_URL` to the frontend public domain.

Attach a Railway Volume to the API service at `/app/storage/app`. This is
required because uploaded course files, thumbnails, and logos are stored on
Laravel's local disks; the normal Railway filesystem is ephemeral. Existing
uploaded files must be copied into that volume before its first production
deployment, because a new empty volume hides files baked into the image.

## Required frontend variable

Set this at build time in the `frontend` service, then redeploy it whenever
the API domain changes:

```dotenv
VITE_API_URL=https://<api-public-domain>/api
```

## Service settings

For each service, set the listed Root Directory in Railway Settings. This is
an isolated monorepo, so this prevents either service from building the other.
Generate a public domain for `frontend` and `api`; keep database and Redis
private. Add `/` as the API healthcheck path after the API has its variables.

Railpack runs Laravel migrations **and seeding** by default. This project's
seeders reset the default admin password and rebuild seeded concept records, so
the API service must set `RAILPACK_SKIP_MIGRATIONS=true`. In Railway Settings,
set the API service Pre-Deploy Command to:

```sh
php artisan migrate --force
```

For a brand-new database only, run `php artisan db:seed` once after the first
successful migration. Do not run it on routine deployments; it intentionally
initializes the default admin password and sample content.

The scheduled session cleanup command needs a separate Railway cron service if
you want it to run in production. Use the same `/laravel-app` root directory,
the same application/database/Redis variables, and this start command:

```sh
while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done
```

No queue worker is needed until the application starts dispatching queued jobs.
