# End-to-end smoke test

This test acts like a user in a real browser. It clears cookies and browser storage, checks the API and opportunity list, verifies form validation, creates a unique account, completes the four-step application, submits it, reloads the page, and confirms the saved application is returned from the local MariaDB-backed API.

## One-time setup

From the project root:

```powershell
npm install
npm run test:e2e:install
```

Make sure XAMPP/MariaDB is installed. The test starts the client and server automatically when they are not already running.

## Run repeatedly

```powershell
npm run test:e2e
```

A successful run ends with `PASS`. Each run creates a unique test account and one application in the local database. The test does not delete real application data.

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
