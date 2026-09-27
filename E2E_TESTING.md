# End-to-end testing

Run the full browser coverage suite with:

```powershell
npm run test:e2e:full
```

The full suite reads the local admin account from `server/.env` (or accepts `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` overrides). It covers public opportunity loading/search/category filters, theme switching, opportunity lookup errors, registration and login validation including duplicate accounts, password visibility, protected-route redirects, logout, regular-user admin denial, empty applications, all application wizard validation gates, back/clear navigation, application persistence, admin opportunity CRUD and deletion protection, application details/search/status/delete, and API authorization responses.

To watch the full suite interact with the app in a visible, slowed-down browser:

```powershell
npm run test:e2e:headed
```

The test cleans up its temporary account and application before waiting. Press Enter in the terminal when you are finished watching to close the browser.
# End-to-end smoke test

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

Edit `server/.env` with that computer's MariaDB settings and a unique local `JWT_SECRET` and `ADMIN_PASSWORD`. The real `server/.env` is intentionally ignored by Git; commit only `server/.env.example` so credentials are not shared publicly.

## Run repeatedly

```powershell
npm run test:e2e
```

A successful run ends with `PASS`, followed by a cleanup message. Each run creates a unique temporary account and application, verifies the saved record, then deletes the test data and restores the opportunity capacity.

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
