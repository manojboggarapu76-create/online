# Online Class

A student-facing site with a 6-second welcome screen that leads into a
dashboard of five admin-managed sections: **Lectures & Materials**, **Online
Classes**, **Suggestions**, **Proxy Support**, and **Registrations**. Every
section is edited from a hidden admin panel — add, edit, delete, upload
files — with no code changes needed to update content.

- **Frontend:** React + React Router + Bootstrap 5 (`/frontend`)
- **Backend:** Laravel 10 API + MySQL (`/backend`)

## How the two pieces fit together

The React app is a pure client that talks to the Laravel API over HTTP.
Public pages read from `GET /api/sections/{section}`; nothing there needs a
login. The admin panel talks to `/api/admin/*`, which requires a bearer
token obtained by logging in with the panel password.

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

Visit `http://localhost:5173`. You'll land on the welcome screen, which
moves to `/dashboard` on its own after 6 seconds (or click "Skip"). Go to
`http://localhost:5173/class/developer` for the admin panel.

## Design notes

The look is a "student binder" rather than a generic dashboard template:
ink-navy covers, cream index cards, and folder tabs colour-coded per
section. Fonts are Fraunces (headings), Source Sans 3 (body) and IBM Plex
Mono (dates, labels) — loaded from Google Fonts in `index.html`. All of it
lives in `frontend/src/theme.css` if you want to adjust the palette.

## Notes on the delivered files

To keep this reviewable, `/backend` contains only the custom application
code (models, controllers, migrations, routes) rather than a full Laravel
install (~2,000 framework files) — `backend/SETUP.md` walks through
dropping it into a fresh `laravel new` project. `/frontend` is a complete,
already-building React + Vite app; just `npm install` and go.
