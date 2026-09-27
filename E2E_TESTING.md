# End-to-end testing

The project has a short smoke test and a comprehensive security regression suite. Both use Playwright against the real Vite, Express, and MariaDB services.

Run the full browser coverage suite with:

```powershell
npm run test:e2e:full
```

The full suite reads the local admin account from `server/.env` (or accepts `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` overrides). It covers public opportunity loading/search/category filters, theme switching, every opportunity Apply state, opportunity lookup errors, registration and login validation including duplicate accounts, password visibility, protected-route redirects, logout token removal, invalid-JWT redirect messaging, all admin endpoint authorization checks, empty applications, every application wizard field/control and validation gate, every availability slot and skill toggle, back/clear navigation, both success-screen navigation buttons, application persistence, concurrent last-spot submissions, admin opportunity CRUD including cancel-edit and refresh, application expansion/search/status filters/status changes/delete, pagination in both directions, CORS origin filtering, Helmet headers, and cleanup.

To watch the full suite interact with the app in a visible, slowed-down browser:

```powershell
npm run test:e2e:headed
```

The test cleans up its temporary accounts, applications, and opportunities before waiting. Press Enter in the terminal when you are finished watching to close the browser.
## Smoke test

This test acts like a user in a real browser. It clears cookies and browser storage, checks the API and opportunity list, verifies form validation, creates a unique account, completes the four-step application, submits it, reloads the page, and confirms the saved application is returned from the local MariaDB-backed API.

## One-time setup

From the project root:

```powershell
npm install
npm run test:e2e:install
```

Make sure XAMPP/MariaDB is installed. The test starts the client and server automatically when they are not already running.

Create the local backend environment file on each computer after pulling the repository:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` with that computer's MariaDB settings, a unique local `JWT_SECRET`, `ADMIN_PASSWORD`, and `FRONTEND_ORIGINS`. Use `http://localhost:5173` for local development; comma-separate any deployed frontend origins. The real `server/.env` is intentionally ignored by Git; commit only `server/.env.example` so credentials are not shared publicly.

## Run repeatedly

```powershell
npm run test:e2e
```

A successful run ends with `PASS`, followed by a cleanup message. Each run creates a unique temporary account and application, verifies the saved record, then deletes the test data and restores the opportunity capacity.

The comprehensive suite requires the configured admin account because it creates a temporary one-spot opportunity for the concurrent-submission test and exercises admin-only routes directly with a regular user's JWT.

## Sync the local database between laptops

From the project root, on the laptop with the newest data:

```powershell
npm run db:export
```

This creates `database/volunteer_app.sql`. Move that file to the other laptop's project root, then run:

```powershell
npm run db:import
```

The commands use the MariaDB settings in `server/.env` and look for XAMPP at `C:\xampp\mysql\bin`. Set `MYSQL_BIN_DIR` if XAMPP is installed elsewhere. The SQL file is tracked by Git so it can be pushed and pulled between laptops. Only commit it to a private repository because it may contain account and applicant data.

## Enable the admin panel

Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`. On startup, the server creates that account if it is missing, or promotes the matching account to the `admin` role if it already exists. No manual database update or registration step is required.
