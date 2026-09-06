# Online Class

A student-facing site that opens straight on a dashboard of five
admin-managed sections: **Lectures & Materials**, **Online Classes**,
**Suggestions**, **Proxy Support**, and **Registrations**. Every section is
edited from a hidden admin panel — add, edit, delete, upload files — with
no code changes needed to update content.

Visitors can browse every section without an account. Watching a video in
**Online Classes** is the one thing that's gated: a visitor has to create
an account (or log in) and pay for Online Class access via Razorpay before
that video will play. Every other section stays fully open.

- **Frontend:** React + React Router + Bootstrap 5 (`/frontend`)
- **Backend:** Laravel 10 API + MySQL (`/backend`)

## How the two pieces fit together

The React app is a pure client that talks to the Laravel API over HTTP.
Public pages read from `GET /api/sections/{section}`; nothing there needs a
login, except that an Online Classes video only comes back playable if the
request carries a logged-in, paid student's token. The admin panel talks to
`/api/admin/*`, which requires a bearer token obtained by logging in with
the panel password — a completely separate system from student accounts.

## Student accounts & payment

- **Sign up / log in:** available from the navbar on every page
  (`/signup`, `/login`). This is a normal email + password account, unrelated
  to the admin password.
- **Paying for Online Classes:** once logged in, clicking a locked video
  shows a "Pay to unlock" button. That opens a Razorpay Checkout popup for a
  one-time payment (amount set by `RAZORPAY_COURSE_AMOUNT` in the backend
  `.env`). Payment confirmation uses two independent, idempotent paths so
  it's correct even if the visitor's browser disappears right after paying:
  the browser's own callback unlocks things instantly when it can, and a
  Razorpay **webhook** — called directly by Razorpay, retried automatically
  if our server is briefly unreachable — guarantees the payment is recorded
  either way. See `backend/SETUP.md` for the one-time webhook setup step.
  Once verified, access is permanent — no re-purchase needed.
- **Admin visibility:** the admin panel has a **Payments** tab listing every
  payment attempt (who, how much, status, Razorpay IDs, and which path
  confirmed it), newest first. It reads the payments table directly, so a
  payment shows up there the moment it's verified.

## The admin panel

- **URL:** go to `/class/developer` in the site (not linked anywhere in the
  public nav — visiting that path is how you reach it).
- **Default password:** `1`, exactly as requested. It's hashed in the
  database, not stored in plain text.
- **Changing the password:** once logged in, open the **Settings** tab in
  the sidebar and set a new one. This is the *only* place it can be
  changed — there's no separate config file to edit.
- Each of the five sections has its own tab in the sidebar with a live list
  of everything posted, an **Add item** form (title, description, an
  optional link, an optional date/time, an optional file upload, and a
  visible/hidden toggle), and **Edit** / **Delete** on every row.

## Quick start

**1. Backend** — see `backend/SETUP.md` for the full walkthrough
(`composer create-project`, copy in the app files, migrate, seed). The
short version:

```bash
composer create-project laravel/laravel:^10.0 online-class-backend
# copy backend/app, backend/database, backend/routes/api.php in — see SETUP.md
cd online-class-backend
composer require laravel/sanctum
cp ../backend/.env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\AdminSettingSeeder
php artisan storage:link
php artisan serve
```

**2. Frontend**

```bash
cd frontend
npm install
cp .env.example .env    # points VITE_API_URL at the backend above
npm run dev
```

Visit `http://localhost:5173`. You land straight on the dashboard — no
splash screen or loading animation in between. Go to
`http://localhost:5173/class/developer` for the admin panel.

## Design notes

Clean, professional SaaS look: deep navy header/nav, a neutral light-grey
canvas, white cards, and a cohesive blue/teal/violet/amber accent set per
section tab. Fonts are Inter (headings + body) and IBM Plex Mono (dates,
labels, eyebrows) — loaded from Google Fonts in `index.html`. All of it
lives in `frontend/src/theme.css` if you want to adjust the palette.

Hovering a dashboard card lifts it into a small preview "popup" (more of
its posted items, full description) while the rest of the grid dims and
softens behind it, so attention stays on the one card. Section names no
longer float as separate coloured tags beside the icon — the section title
now only appears once, in the card body, for a cleaner look.

## Notes on the delivered files

To keep this reviewable, `/backend` contains only the custom application
code (models, controllers, migrations, routes) rather than a full Laravel
install (~2,000 framework files) — `backend/SETUP.md` walks through
dropping it into a fresh `laravel new` project. `/frontend` is a complete,
already-building React + Vite app; just `npm install` and go.
