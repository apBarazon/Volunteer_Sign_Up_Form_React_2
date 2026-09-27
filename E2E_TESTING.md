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
