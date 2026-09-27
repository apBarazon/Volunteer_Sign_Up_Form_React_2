# Project Checkpoint & Changelog

This document tracks the progress, architectural decisions, and current status of the **Volunteer Sign-Up Form Application**. Whenever an AI assistant or team member makes updates, a new timestamped checkpoint should be added here.

---

## Quick Project Overview

* **Goal**: A volunteer portal where anyone can browse opportunities, while registered users can submit and review their own applications.
* **Stack**:
   * **Frontend**: React + TypeScript (Vite) + Zod validation in `client/`
  * **Backend**: Node.js + Express (ES Modules) + JWT authentication in `server/`
  * **Database**: MariaDB (local) via Sequelize ORM
   * **Validation**: Zod schemas on both client and server

---

## Component Status Board

| Layer | File / Feature | Status | Description |
|---|---|---|---|
| **Architecture** | [`volunteer-app-architecture.md`](./volunteer-app-architecture.md) | Complete | Blueprint & specifications for the entire stack |
| **Documentation** | [`CODEBASE_EXPLAINER.md`](./CODEBASE_EXPLAINER.md) | Complete | Plain-English beginner guide explaining every file & concept |
| **Git Config** | [`.gitignore`](./.gitignore) | Complete | Root ignore rules (prevents tracking `node_modules` and `.env`) |
| **Backend Config** | [`server/.env.example`](./server/.env.example) | Complete | Template for teammates to configure their local MariaDB |
| **Backend Config** | [`server/package.json`](./server/package.json) | Complete | Express, Sequelize, MySQL2, Zod, CORS, Dotenv, bcryptjs, and jsonwebtoken |
| **Backend Config** | [`server/.env`](./server/.env) | Complete | MariaDB connection variables and local JWT signing secret |
| **Backend Config** | [`server/src/config/db.js`](./server/src/config/db.js) | Complete | Sequelize MariaDB connection setup and automatic database creation |
| **Backend Server** | [`server/src/server.js`](./server/src/server.js) | Complete | Associations, safe table sync, account ownership upgrade, seeding, LAN listener |
| **Backend Server** | [`server/src/app.js`](./server/src/app.js) | Complete | Express app with public opportunity routes, auth routes, protected application routes, and error handler |
| **Authentication** | [`server/src/models/account.model.js`](./server/src/models/account.model.js) | Complete | Separate login account table with unique email and password hash |
| **Authentication** | [`server/src/controllers/auth.controller.js`](./server/src/controllers/auth.controller.js) | Complete | Registration, login, password hashing, JWT creation, and current-account response |
| **Authentication** | [`server/src/middleware/requireAuth.js`](./server/src/middleware/requireAuth.js) | Complete | Verifies Bearer JWTs and attaches the account to the request |
| **Authentication** | [`server/src/routes/auth.routes.js`](./server/src/routes/auth.routes.js) | Complete | `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me` |
| **Application Ownership** | [`server/src/models/userApplication.model.js`](./server/src/models/userApplication.model.js) | Complete | Existing `users` application table with nullable `account_id` ownership link |
| **Application Ownership** | [`server/src/routes/application.routes.js`](./server/src/routes/application.routes.js) | Complete | Requires authentication for listing and submitting applications |
| **Database Models** | [`server/src/models/volunteer.model.js`](./server/src/models/volunteer.model.js) | Complete | Volunteer entity (`id`, `full_name`, `email`, `phone`) |
| **Database Models** | [`server/src/models/event.model.js`](./server/src/models/event.model.js) | Complete | Event entity (`id`, `title`, `description`, `event_date`, `location`, `capacity`) |
| **Database Models** | [`server/src/models/signup.model.js`](./server/src/models/signup.model.js) | Complete | Join table linking `volunteer_id` to `event_id` with unique constraint |
| **Validation** | [`server/src/schemas/volunteer.schema.js`](./server/src/schemas/volunteer.schema.js) | Complete | Zod schema validating volunteer sign-up inputs |
| **Middleware** | [`server/src/middleware/validate.js`](./server/src/middleware/validate.js) | Complete | Express middleware running Zod schema validation on `req.body` |
| **Middleware** | [`server/src/middleware/errorHandler.js`](./server/src/middleware/errorHandler.js) | Complete | Global error handler with clean JSON responses and Sequelize error handling |
| **Controllers** | [`server/src/controllers/volunteer.controller.js`](./server/src/controllers/volunteer.controller.js) | Complete | `signup` handler: capacity check, duplicate check, volunteer create, signup insert |
| **Controllers** | [`server/src/controllers/event.controller.js`](./server/src/controllers/event.controller.js) | Complete | `getEvents` handler: queries events ordered by date |
| **Routes** | [`server/src/routes/volunteer.routes.js`](./server/src/routes/volunteer.routes.js) | Complete | `POST /signup` with Zod validation middleware |
| **Routes** | [`server/src/routes/event.routes.js`](./server/src/routes/event.routes.js) | Complete | `GET /` to fetch upcoming events |
| **Frontend UI** | [`client/src/App.tsx`](./client/src/App.tsx) | Complete | React Router SPA with public browsing and guarded application routes |
| **Frontend API** | [`client/src/api/api.ts`](./client/src/api/api.ts) | Complete | Opportunity, auth, and application requests with bearer-token support |
| **Frontend Auth** | [`client/src/context/AuthContext.tsx`](./client/src/context/AuthContext.tsx) | Complete | Persists the JWT, restores `/me`, and exposes login/register/logout |
| **Frontend Auth** | [`client/src/pages/LoginPage.tsx`](./client/src/pages/LoginPage.tsx) | Complete | Login form with Zod credential validation and return-path handling |
| **Frontend Auth** | [`client/src/pages/RegisterPage.tsx`](./client/src/pages/RegisterPage.tsx) | Complete | Registration form with password confirmation and return-path handling |
| **Frontend Form** | [`client/src/pages/SignUpPage.tsx`](./client/src/pages/SignUpPage.tsx) | Complete | Four-step application form with comprehensive client/server validation |
| **Frontend Guard** | [`client/src/components/RequireAuth.tsx`](./client/src/components/RequireAuth.tsx) | Complete | Redirects logged-out users to login for signup and My Applications |
| **Automated Testing** | [`E2E_TESTING.md`](./E2E_TESTING.md) | Complete | Instructions for repeatable browser and database smoke tests |
| **Automated Testing** | [`scripts/e2e-smoke.mjs`](./scripts/e2e-smoke.mjs) | Complete | Playwright workflow covering validation, auth, submission, reload, and read-back |
| **Database Sync** | [`scripts/db-sync.mjs`](./scripts/db-sync.mjs) | Complete | Root commands for exporting and importing local MariaDB data |
| **Administration** | [`client/src/pages/AdminPage.tsx`](./client/src/pages/AdminPage.tsx) | Complete | Admin-only opportunity CRUD and application management dashboard |

---

## [Checkpoint 6] Account Authentication & Per-User Applications
**Timestamp**: `2026-09-26`
**Contributors**: User, GitHub Copilot

#### What Was Accomplished:
1. **Account Authentication**:
   - Added a separate `accounts` table and Sequelize model so login identities are not mixed with application records in the existing `users` table.
   - Added registration and login with bcrypt password hashing and seven-day JWT sessions.
   - Added `GET /api/auth/me` and bearer-token middleware for protected requests.
2. **Application Ownership**:
   - Added nullable `account_id` to the existing applications table through an idempotent startup upgrade.
   - Protected `GET /api/applications` and `POST /api/applications`.
   - New applications store the authenticated account ID; application listings are filtered to that account.
   - Existing pre-authentication applications remain unassigned and are not shown to new accounts.
3. **Frontend SPA Flow**:
   - Added persistent auth state, login/register pages, route guards, return-path handling, and logged-in/logged-out navbar states.
   - Browsing opportunities remains public; Apply Now and My Applications require authentication.
4. **Verification**:
   - Client production build passes.
   - Server starts with MariaDB synchronization complete.
   - Registration, login, `/me`, unauthenticated rejection, and account-scoped application retrieval were tested.

---

## Checkpoint Log

### [Checkpoint 7] Local Setup Automation & End-to-End Smoke Testing
**Timestamp**: `2026-09-27`
**Contributors**: User, GitHub Copilot

#### What Was Accomplished:
1. Added automatic creation of the configured local MariaDB database before Sequelize connects.
2. Enabled LAN access for the backend and Vite development server so multiple devices on the same network can use the app.
3. Added a root-level Playwright smoke test that clears browser state, exercises validation and authentication, submits an application, reloads the page, and confirms database-backed read-back.
4. Added a startup check for the required `JWT_SECRET` setting and documented local setup in [`E2E_TESTING.md`](./E2E_TESTING.md).

#### Verification:
- `npm run test:e2e` passes.
- `npm run build` passes in `client/`.

### [Checkpoint 8] Local Database Export and Import Commands
**Timestamp**: `2026-09-27`
**Contributors**: User, GitHub Copilot

#### What Was Accomplished:
1. Added `npm run db:export` to create `database/volunteer_app.sql` from the local MariaDB database.
2. Added `npm run db:import` to restore that SQL dump on another laptop.
3. Added XAMPP path detection, `server/.env` configuration loading, and an optional `MYSQL_BIN_DIR` override.
4. Made the SQL export Git-trackable so private repositories can synchronize database data between laptops. The export should not be committed to a public repository.

#### Verification:
- Database export completed successfully.
- Database import completed successfully.
- The E2E smoke test remains available after database restoration.

### [Checkpoint 9] Admin Panel and Role-Protected CRUD
**Timestamp**: `2026-09-27`
**Contributors**: User, GitHub Copilot

#### What Was Accomplished:
1. Added persistent `user` and `admin` account roles with a safe upgrade for existing databases.
2. Added `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` bootstrap configuration for creating or promoting the definitive admin account at backend startup.
3. Added admin-only CRUD endpoints for volunteer opportunities.
4. Added admin application review and deletion, restoring an opportunity spot when an application is removed.
5. Added the protected Admin Panel route and responsive dashboard UI.
6. Added transactional E2E cleanup so generated accounts and applications do not accumulate or consume opportunity capacity.

#### Verification:
- Client production build passes.
- Existing non-admin accounts remain blocked from admin endpoints.

### [Checkpoint 5] Antigravity Handoff & GitHub Publishing Recovery
**Timestamp**: `2026-09-22`
**Contributors**: User, GitHub Copilot

#### What Was Accomplished:
2. **GitHub Publishing Recovery**:
   - Integrated the separately initialized remote history without losing the local UI implementation.
   - Updated the published commit identity to use GitHub's no-reply address, keeping the user's personal email private.
   - Successfully pushed the completed project to `origin/main`.
   - Preserved the pre-email-fix local history on the `local-before-email-fix` branch.
3. **Documentation**:
   - Updated this changelog and [`CODEBASE_EXPLAINER.md`](./CODEBASE_EXPLAINER.md) to reflect the handoff and current repository state.

#### Current Status:
- The working `main` branch is clean and synchronized with `origin/main`.
- The application implementation is complete according to the Component Status Board above.
- Future commits should use a GitHub no-reply email unless email privacy protection is intentionally disabled.

### [Checkpoint 4] Full End-to-End Implementation: Controllers, Routes, DB Auto-Sync & React SPA
**Timestamp**: `2026-09-22 23:15:00 (GMT+8)`  
**Contributors**: Antigravity, User

#### What Was Accomplished:
1. **Backend Implementation**:
   - Implemented `getEvents` in [`event.controller.js`](./server/src/controllers/event.controller.js).
   - Implemented `signup` in [`volunteer.controller.js`](./server/src/controllers/volunteer.controller.js) with event existence verification, capacity limit check, duplicate prevention, and transactional record creation.
   - Connected routes in [`event.routes.js`](./server/src/routes/event.routes.js) and [`volunteer.routes.js`](./server/src/routes/volunteer.routes.js).
   - Implemented global error handling in [`errorHandler.js`](./server/src/middleware/errorHandler.js).
   - Mounted routes & error handler in [`app.js`](./server/src/app.js).
   - Configured `sequelize.sync({ alter: true })` in [`server.js`](./server/src/server.js) so tables are created automatically on MariaDB startup without typing SQL.
   - Added automatic seeding of 3 realistic community events into MariaDB if the table is empty.
2. **Frontend React SPA Built**:
   - Installed `zod` and created client validation schema in `client/src/schemas/volunteer.schema.js`.
   - Created API client in `client/src/api/volunteerApi.js` connecting to backend endpoints.
   - Built `VolunteerForm.jsx` with input handling, inline error feedback, and a built-in educational **Live Data Inspector** (allows students/teachers to see React state & JSON payload in real time).
   - Built `ConfirmationModal.jsx` for registration success details.
   - Built modern, responsive styles in `client/src/App.css`.
   - Passed all strict ESLint checks (`npm run lint` = 0 errors) and verified production build (`vite build` = 139ms).

---

### [Checkpoint 3] Repository Hardening & Codebase Explainer Guide
**Timestamp**: `2026-09-22 22:30:00 (GMT+8)`  
**Contributors**: User, Antigravity

#### What Was Accomplished:
1. **Codebase Explainer Guide**:
   - Created [`CODEBASE_EXPLAINER.md`](./CODEBASE_EXPLAINER.md) giving a thorough, plain-English breakdown of all files, MVC / Layered Architecture concepts, database models vs. validation schemas, and cheat-sheet answers for presentation.
2. **Git Protection & Sanitization**:
   - Created root [`.gitignore`](./.gitignore) to ensure `node_modules` (4,000+ files) and sensitive `.env` files are never pushed to GitHub.
   - Created [`server/.env.example`](./server/.env.example) so classmates have an immediate template for configuring their own local MariaDB connection.
   - Cleaned up git staging area so the repository is clean and ready to branch/publish.

#### Immediate Next Steps:
1. Publish/push branch to GitHub for team sharing.
2. Implement controllers and routes in `server/`.
3. Auto-sync tables with MariaDB via `sequelize.sync()`.
4. Build the basic React sign-up form in `client/`.

---

### [Checkpoint 2] Frontend Client Initialized (React + Vite)
**Timestamp**: `2026-09-22 22:12:00 (GMT+8)`  
**Contributors**: User (Scaffolding Vite React), Antigravity (Verification & Checkpoint update)

#### What Was Accomplished:
1. **Frontend App Initialized**:
   - Created `client/` directory with Vite + React 19.
   - Initialized `client/package.json` with scripts (`dev`, `build`, `lint`, `preview`).
   - Standard ESLint config (`eslint.config.js`) installed for React best practices.
   - Tested production build (`vite build`), compiling successfully with zero errors.
2. **Current Monorepo Layout**:
   - Both `server/` (Node/Express) and `client/` (React/Vite) are now properly structured side-by-side as prescribed in [`volunteer-app-architecture.md`](./volunteer-app-architecture.md).

#### Immediate Next Steps:
1. Complete the backend API controllers and routes in `server/`.
2. Connect database and verify endpoints.
3. Install frontend dependencies (e.g. `zod` for shared schema validation) and build the sign-up UI components in `client/src/components/`.

---

### [Checkpoint 1] Initial Backend Scaffolding & Data Layer
**Timestamp**: `2026-09-22 22:00:00 (GMT+8)`  
**Contributors**: Claude (Architecture blueprint), GitHub Copilot (Scaffolding), Antigravity (Inspection & Checkpoint setup)

#### What Was Accomplished:
1. **Architecture Blueprint**:
   - Claude generated [`volunteer-app-architecture.md`](./volunteer-app-architecture.md) defining the monorepo folder layout, MariaDB schema, REST routes, and build order.
2. **Server Environment & Dependencies**:
   - Initialized `server/` with `"type": "module"` in `package.json`.
   - Installed `express`, `sequelize`, `mysql2`, `zod`, `cors`, and `dotenv`.
   - Configured `.env` with default MariaDB settings on port 3306.
3. **Database Layer (Sequelize)**:
   - Configured DB connection in `server/src/config/db.js`.
   - Created `Volunteer` model in `server/src/models/volunteer.model.js`.
   - Created `Event` model in `server/src/models/event.model.js`.
   - Created `Signup` join table model in `server/src/models/signup.model.js` with composite unique constraint on `(volunteer_id, event_id)` and foreign key cascade rules.
   - Wired model associations (`hasMany` and `belongsTo`) inside `server/src/server.js`.
4. **Validation Layer**:
   - Defined `volunteerSignupSchema` in `server/src/schemas/volunteer.schema.js`.
   - Implemented generic `validate(schema)` middleware in `server/src/middleware/validate.js`.
5. **App & Server Skeleton**:
   - Created `server/src/app.js` with CORS, JSON body parser, and `/api/health`.
   - Created `server/src/server.js` to test DB connection and start listening on port 3000.

#### Current Gaps / Incomplete Items:
- `server/src/controllers/volunteer.controller.js` and `event.controller.js` are empty (`export {};`).
- `server/src/routes/volunteer.routes.js` and `event.routes.js` are empty (`export {};`).
- `server/src/middleware/errorHandler.js` is empty (`export {};`).
- Routes and error handler are not yet imported or mounted in `server/src/app.js`.
- MariaDB tables have not been created/synced yet (`sequelize.sync()` or migration script).
- Frontend (`client/`) has not yet been initialized.

#### Immediate Next Steps:
1. Implement the controller methods:
   - `getEvents` in `event.controller.js` to query available events.
   - `signup` in `volunteer.controller.js` to handle volunteer creation/lookup, capacity checks, and signup record insertion.
2. Implement route endpoints and mount them in `app.js`.
3. Implement `errorHandler.js` to catch any database or server errors cleanly.
4. Test backend endpoints with sample data.
5. Scaffold the React frontend using Vite in `client/`.

---

> **Note for AI Assistants (Copilot / Antigravity / Claude)**:  
> When updating this project, please:
> 1. Add a new `### [Checkpoint N]` entry under the Checkpoint Log with the current timestamp.
> 2. Update the **Component Status Board** table to reflect any files created, updated, or finished.

