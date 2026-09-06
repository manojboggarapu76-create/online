# Backend setup (Laravel 10 + MySQL)

These are the custom application files only (models, controllers, routes,
migrations). You install them into a fresh Laravel project because the
full framework itself (~2000 files) isn't something to hand-copy.

## 1. Create a fresh Laravel project

```bash
composer create-project laravel/laravel:^10.0 online-class-backend
cd online-class-backend
composer require laravel/sanctum
```

## 2. Copy these files in, overwriting where they already exist

```
app/Models/ContentItem.php
app/Models/AdminSetting.php
app/Models/AdminSession.php
app/Models/User.php          (replaces the default one Laravel generated)
app/Models/UserSession.php
app/Models/Payment.php
app/Http/Controllers/Api/AdminAuthController.php
app/Http/Controllers/Api/ContentItemController.php
app/Http/Controllers/Api/AuthController.php
app/Http/Controllers/Api/PaymentController.php
app/Http/Middleware/AdminAuthenticate.php
app/Http/Middleware/UserAuthenticate.php
database/migrations/2024_01_01_000001_create_content_items_table.php
database/migrations/2024_01_01_000002_create_admin_settings_table.php
database/migrations/2024_01_01_000003_create_admin_sessions_table.php
database/migrations/2024_01_01_000004_create_user_sessions_table.php
database/migrations/2024_01_01_000005_create_payments_table.php
database/migrations/2024_01_01_000006_add_meta_to_payments_table.php
database/seeders/AdminSettingSeeder.php
routes/api.php   (replace the default one)
```

Don't add a new `users` table migration -- `composer create-project`
already generated `database/migrations/2014_10_12_000000_create_users_table.php`,
which is exactly what student accounts use.

## 3. Register the auth middleware

Open `app/Http/Kernel.php` and add these two lines inside
`$middlewareAliases` (Laravel 9) or `$routeMiddleware` (older versions):

```php
protected $middlewareAliases = [
    // ...existing entries...
    'admin.auth' => \App\Http\Middleware\AdminAuthenticate::class,
    'user.auth' => \App\Http\Middleware\UserAuthenticate::class,
];
```

`admin.auth` protects the hidden admin panel (single shared password).
`user.auth` protects student-account routes (`/auth/me`, `/payment/*`) --
separate accounts, separate tokens, same pattern.

## 4. Allow the React app to call the API (CORS)

In `config/cors.php`, set:

```php
'paths' => ['api/*', 'storage/*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => false,
```

## 5. Environment + database

```bash
cp ../.env.example .env      # or merge the values into your generated .env
php artisan key:generate
```

Create a MySQL database named `online_class` (or change `DB_DATABASE`),
matching the credentials in `.env`.

Also fill in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (from the
[Razorpay Dashboard](https://dashboard.razorpay.com/) -> Settings -> API
Keys; use the test-mode keys while developing). Without these, the
"Pay to unlock" button on the site will show a clear error instead of
opening the checkout modal -- everything else keeps working.

### Why the webhook step matters (don't skip it)

A payment can succeed at Razorpay's end even if the visitor's browser
never tells *us* -- they might close the tab right after paying, lose
their connection, or our server could be mid-restart at that exact
second. Relying only on the browser calling back is not reliable enough
for real money. The fix is a **webhook**: Razorpay calls our server
directly, independently of the browser, and automatically retries with
backoff if our server doesn't respond -- so a payment still gets
recorded correctly even if we were briefly down when it happened.

1. In the Razorpay Dashboard, go to **Settings -> Webhooks -> Add New
   Webhook**.
2. **URL**: `https://yourdomain.com/api/payment/webhook` (while
   developing locally, use a tunnel like `ngrok http 8000` and give it
   that URL instead -- Razorpay needs to reach it from the internet).
3. **Secret**: make up a strong random string, put it in `.env` as
   `RAZORPAY_WEBHOOK_SECRET`, and paste the same value into the
   dashboard. This secret is what proves a request claiming to be from
   Razorpay actually is -- it's separate from `RAZORPAY_KEY_SECRET` and
   never reaches the browser.
4. **Active events**: check `payment.captured` and `payment.failed`.

With this in place there are two independent paths that both mark a
payment paid, and either one alone is enough:

- **`/api/payment/verify`** -- the fast path. The browser calls this the
  instant Razorpay's checkout popup reports success, so the site can
  unlock the video immediately without waiting on anything else.
- **`/api/payment/webhook`** -- the authoritative path. This is what
  guarantees the payment is recorded correctly even if the browser call
  above never happens. Both paths update the same row safely (a DB row
  lock means whichever arrives first wins, and the second is a no-op),
  so there's no double-processing if both fire.

## 6. Migrate, seed, and link storage

```bash
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\AdminSettingSeeder
php artisan storage:link
```

The seeder sets the **default admin password to `1`**, hashed. It's
changed later from inside the admin panel (Settings tab) -- that just
calls `POST /api/admin/change-password`, no re-seeding needed.

## 7. Run it

```bash
php artisan serve
```

API is now at `http://localhost:8000/api`. Point the frontend's
`VITE_API_URL` at that (see `frontend/.env.example`).

## Endpoints reference

| Method | Endpoint                      | Auth  | Purpose                              |
|--------|--------------------------------|-------|---------------------------------------|
| GET    | /api/sections/{section}        | optional (student token) | Public list for a dashboard section. If a valid, paid student token is sent, Online Classes videos come back playable; otherwise they come back `locked: true` with no file URL. |
| GET    | /api/stream/{item}             | optional (student token) | Streams a file. For an Online Classes video, refuses with 403 unless the token belongs to a paid-up student. |
| POST   | /api/auth/register              | none  | `{ name, email, password, password_confirmation }` -> `{ token, user, paid }` |
| POST   | /api/auth/login                 | none  | `{ email, password }` -> `{ token, user, paid }` |
| POST   | /api/auth/logout                | student | Invalidate current token            |
| GET    | /api/auth/me                    | student | Current user + payment status       |
| POST   | /api/payment/create-order       | student | Opens a Razorpay order, returns what the frontend Checkout widget needs |
| POST   | /api/payment/verify             | student | Fast path: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` -> marks the payment paid once the signature checks out |
| POST   | /api/payment/webhook             | none (HMAC-signed by Razorpay) | Authoritative path: Razorpay calls this directly and retries automatically if we're briefly down. See "Why the webhook step matters" above. |
| GET    | /api/payment/status             | student | `{ paid: true/false }`               |
| POST   | /api/admin/login                | none  | `{ password }` -> `{ token }`         |
| POST   | /api/admin/logout               | admin | Invalidate current token              |
| GET    | /api/admin/me                   | admin | Verify a stored token                 |
| POST   | /api/admin/change-password      | admin | `{ current_password, new_password, new_password_confirmation }` |
| GET    | /api/admin/items?section=...    | admin | List all items (incl. inactive)       |
| POST   | /api/admin/items                | admin | Create (multipart, optional `file`)   |
| POST   | /api/admin/items/{id}           | admin | Update (multipart + `_method=PUT`)    |
| DELETE | /api/admin/items/{id}           | admin | Delete                                |
| GET    | /api/admin/payments             | admin | Every payment attempt with the student's name/email, newest first -- reflects a payment the instant it's verified |

`section` is one of: `lecture_material`, `online_class`, `suggestion`,
`proxy_support`, `registration`. Only `online_class` is ever paywalled;
the other four stay open to everyone as before.

"student" auth means `Authorization: Bearer <token>` where the token came
from `/api/auth/register` or `/api/auth/login` -- a completely separate
system from the admin panel's shared password.
