# End-to-end testing

The project has two Playwright test suites. Both drive a real Chromium browser against the real Vite, Express, and MariaDB services, so they need the whole stack available (no mocks, except a few deliberate error-state checks).

| Command | Script | What it is | Typical use |
|---|---|---|---|
| `npm run test:e2e` | `scripts/e2e-smoke.mjs` | The **smoke test**: one short happy-path run | Quick "is the app basically working?" check after any change |
| `npm run test:e2e:full` | `scripts/e2e-comprehensive.mjs` | The comprehensive security and feature-matrix suite | Before merging or releasing |
| `npm run test:e2e:headed` | `scripts/e2e-headed.mjs` | The comprehensive suite in a visible, slowed-down browser | Watching or demonstrating the app |

## What the smoke test is

A *smoke test* is a fast, shallow check that the most important path works at all (the name comes from powering on hardware and seeing whether smoke comes out). When the repository owner asks whether "the tests still work like the smoke", they mean: does `npm run test:e2e` still pass after the redesign, photo, and database changes?

The smoke test acts like a new volunteer in a real browser. It:

1. Starts the backend and frontend if they are not already running, and clears cookies and browser storage.
2. Loads the Home page and confirms at least one `.opportunity-card` exists (this calls `GET /api/opportunities`, so the `volunteers` table must match the Sequelize model).
3. Clicks **Apply Now** while logged out and follows the *Create an account* link.
4. Checks the *Passwords do not match.* error, then registers a unique `e2e-<timestamp>@example.com` account.
5. Confirms it lands on `/signup` at *Step 1 of 4*, and checks the *First name is required.* validation.
6. Completes all four steps (personal info, one availability slot, experience, how they heard about us and the terms checkbox), reviews, and clicks **Confirm & Submit**.
7. Confirms the *My Applications* page shows the applicant's name, reloads, and confirms it is still there (proving it came from MariaDB).
8. Deletes the temporary account through `DELETE /api/auth/me`, which also restores the opportunity's spot.

A successful run prints `PASS: registration, validation, application submission, and database read-back (...)` followed by a cleanup message. Any failure prints `FAIL: ...` and exits with a non-zero code.

The smoke test does **not** exercise the admin panel, opportunity photos, dark mode, or the security checks; those live in the comprehensive suite.

## What the full suite covers

The full suite reads the local admin account from `server/.env` (or accepts `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` overrides). It covers public opportunity loading/search/category filters, theme switching, every opportunity Apply state, opportunity lookup errors, registration and login validation including duplicate accounts, password visibility, protected-route redirects, logout token removal, invalid-JWT redirect messaging, all admin endpoint authorization checks, empty applications, every application wizard field/control and validation gate, every availability slot and skill toggle, back/clear navigation, both success-screen navigation buttons, application persistence, concurrent last-spot submissions, admin opportunity CRUD including cancel-edit and refresh, application expansion/search/status filters/status changes/delete, pagination in both directions, CORS origin filtering, Helmet headers, and cleanup.

It does not yet check opportunity photos (setting an Image URL, the admin preview, or the placeholder fallback). See the suggestions at the end of this file.

To watch the full suite interact with the app in a visible, slowed-down browser:

```powershell
npm run test:e2e:headed
```

The test cleans up its temporary accounts, applications, and opportunities before waiting. The comprehensive runner also attempts a final admin-opportunity cleanup if an assertion fails before the normal delete step. Press Enter in the terminal when you are finished watching to close the browser.

## Status after the redesign and photo changes

Reviewed against the current code (see [Checkpoint 14](./CHANGELOG.md)):

* The selectors both suites use are still present: `.opportunity-card`, the **Apply Now** button, `.slot-btn`, the `name` attributes on form fields, `Toggle color theme`, `.admin-form`, `.admin-row`, and the *Step N of 4* text inside `main`.
* The new **Image URL** input is the fourth input in the admin form, after Name, Type, and Spots left, so the comprehensive suite's `nth(0)` / `nth(1)` fills still target Name and Type. The new field is optional, so creating an opportunity without a photo still works.
* Photos are decorative (`alt` text and CSS only), so they do not change any text the tests wait for.

**Before the tests can pass, the database must have the `volunteers.image_url` column.** New databases get it automatically. A database created before the photo change does not, because the server only creates missing tables. Fix it with `npm run db:import` or by running `ALTER TABLE volunteers ADD COLUMN image_url VARCHAR(255) NULL;`. Without the column the Home page cannot load opportunities and the smoke test fails at its first step.

The suites need MariaDB and were not executed while this documentation was updated, so run `npm run test:e2e` and record the result in the changelog.

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

Optional environment overrides (both suites): `E2E_BASE_URL` (default `http://localhost:5173`) and `E2E_API_URL` (default `http://localhost:3000`). The comprehensive suite also accepts `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, and the headed wrapper sets `E2E_HEADED`, `E2E_SLOW_MO`, and `E2E_KEEP_OPEN`.

If a run fails, first check that MariaDB is started in XAMPP, that `server/.env` exists with a `JWT_SECRET`, and that the database has the `image_url` column described above.

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

## Suggested next test additions

Neither suite covers the photo feature yet. Small additions that would close the gap:

* In the admin flow, fill the **Image URL** field with a valid `https://` URL, and confirm the preview appears and the saved value is returned by `GET /api/opportunities`.
* Send `imageUrl: "not-a-url"` to `POST /api/admin/opportunities` as the admin and expect `400`; send `imageUrl: ""` and expect the stored value to be `null`.
* Set an unreachable image URL and confirm the card's `<img>` swaps to the placeholder (`src` starts with `data:image/svg+xml`).