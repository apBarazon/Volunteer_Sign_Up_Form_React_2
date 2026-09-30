# Volunteer Sign-Up App — Architecture

This document describes the application **as it is built today** (last synchronized in [Checkpoint 14](./CHANGELOG.md)). It began as the original planning blueprint (events, volunteers, and signups tables); the notes at the end explain which parts of that plan are still present as legacy code.

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript (Vite), React Router 6 | SPA on port 5173; Vite proxies `/api` to the backend |
| Backend | Node.js + Express (ES Modules) | REST/JSON API on port 3000, also listening on the LAN |
| Database | MariaDB (local, via XAMPP) | Database `volunteer_app`, created automatically if missing |
| ORM | Sequelize | `sequelize.sync()` creates missing tables; small startup helpers add newer columns |
| Validation | Zod | Client schemas in `client/src/schemas/`, server schemas in `server/src/schemas/` |
| Auth | bcryptjs + JSON Web Tokens | 7-day bearer tokens; roles `user` and `admin` |
| Security | Helmet + restricted CORS | Allowed origins come from `FRONTEND_ORIGINS` |
| Testing | Playwright (root `scripts/`) | Smoke test, comprehensive suite, and headed runner |

## 2. Project Folder Structure

```
Volunteer_Sign_Up_Form_React/
├── client/                            # React + TypeScript frontend
│   ├── public/
│   │   ├── favicon.svg
│   │   └── images/volunteerbg.png     # currently unreferenced
│   ├── src/
│   │   ├── api/api.ts                 # all fetch calls, attaches the bearer token
│   │   ├── components/                # Navbar, PasswordInput, RequireAuth, RequireAdmin
│   │   ├── context/                   # AuthContext (JWT + account), AppContext (selected opportunity)
│   │   ├── pages/                     # Home, Login, Register, SignUp, MyApplications, Admin
│   │   ├── schemas/                   # application.schema.ts, auth.schema.ts (Zod)
│   │   ├── types/                     # VolunteerOpportunity, ApplicationFormData
│   │   ├── utils/opportunityImage.ts  # photo URL + placeholder/fallback helpers
│   │   ├── App.tsx, main.tsx, index.css
│   ├── index.html, package.json, tsconfig.json, vite.config.ts
│
├── server/                            # Express backend
│   ├── src/
│   │   ├── config/db.js               # Sequelize connection + ensureDatabase()
│   │   ├── models/                    # account, userApplication, volunteerOpportunity (+ legacy volunteer, event, signup)
│   │   ├── schemas/                   # application, auth, admin (+ legacy volunteer)
│   │   ├── routes/                    # auth, admin, application, opportunity (+ legacy volunteer, event)
│   │   ├── controllers/               # auth, admin, application, opportunity (+ legacy volunteer, event)
│   │   ├── middleware/                # requireAuth (+ requireAdmin), validate, errorHandler
│   │   ├── app.js                     # Express setup and route mounting
│   │   └── server.js                  # startup: sync, column upgrades, admin bootstrap, seeding, listen
│   ├── migrations/                    # empty (.gitkeep); upgrades are done in server.js
│   ├── .env / .env.example            # DB settings, JWT_SECRET, FRONTEND_ORIGINS, ADMIN_* settings
│   └── package.json
│
├── database/volunteer_app.sql         # exported data (npm run db:export / db:import)
├── scripts/                           # e2e-smoke, e2e-comprehensive, e2e-headed, db-sync
├── CHANGELOG.md, CODEBASE_EXPLAINER.md, E2E_TESTING.md, volunteer-app-architecture.md
└── package.json                       # root scripts for tests and database sync
```

**Why split `client/` and `server/`:** each half has its own `package.json` and dependencies, so the interface and the server logic stay independent.

## 3. Database Schema (MariaDB)

The live application uses three tables. Names are historical: the `volunteers` table holds **opportunities** and the `users` table holds **applications**.

```sql
CREATE TABLE accounts (              -- login identities
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',      -- 'user' | 'admin'
  created_at    DATETIME
);

CREATE TABLE volunteers (            -- volunteer opportunities (Home page cards)
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  type        VARCHAR(50)  NOT NULL,                       -- Education | Environment | Outreach
  description TEXT,
  spots_left  INT NOT NULL DEFAULT 0,
  image_url   VARCHAR(255) NULL,                           -- photo link, added in Checkpoint 14
  created_at  DATETIME NOT NULL
);

CREATE TABLE users (                 -- submitted applications (4-step form)
  id            INT AUTO_INCREMENT PRIMARY KEY,
  volunteer_id  INT NULL,                                  -- the opportunity applied to
  account_id    INT NULL,                                  -- FK to accounts (ON DELETE SET NULL)
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  phone         VARCHAR(30)  NOT NULL,
  age           INT NULL,
  city          VARCHAR(100) NULL,
  availability  TEXT NOT NULL,                             -- JSON array, e.g. ["Mon-Morning"]
  experience    TEXT NULL,
  skills        TEXT NULL,                                 -- JSON array
  heard_about   VARCHAR(100) NULL,
  agree_terms   TINYINT(1) NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',    -- pending | approved | rejected
  submitted_at  DATETIME
);
```

Relationships: one account has many applications; one opportunity has many applications. Rules enforced in code: one application per account per opportunity, capacity reserved by an atomic `spots_left > 0` decrement inside a transaction, and deleting an application (or an account) gives its spot back.

**Photos:** `image_url` stores only a link. Images are hotlinked from other websites; the server does not accept uploads or store image files.

**Upgrading existing databases:** `sequelize.sync()` only creates missing tables. `server.js` adds `status`, `username`, `role`, and `account_id` when absent, but has no helper for `image_url` yet. Existing databases need `npm run db:import` or `ALTER TABLE volunteers ADD COLUMN image_url VARCHAR(255) NULL;` once.

## 4. API Routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check used by the tests |
| GET | `/api/opportunities`, `/api/volunteers` | Public | List opportunities (includes `imageUrl`) |
| GET | `/api/opportunities/:id`, `/api/volunteers/:id` | Public | One opportunity |
| POST | `/api/auth/register` | Public | Create an account and return a JWT |
| POST | `/api/auth/login` | Public | Log in and return a JWT |
| GET | `/api/auth/me` | User | Current account (used to restore the session) |
| DELETE | `/api/auth/me` | User | Delete own account and applications, restoring spots (test cleanup) |
| GET | `/api/applications` | User | Only the caller's own applications |
| POST | `/api/applications` | User | Submit an application (validated, duplicate- and capacity-checked) |
| GET | `/api/admin/opportunities` | Admin | List opportunities |
| POST | `/api/admin/opportunities` | Admin | Create an opportunity (optional `imageUrl`) |
| PATCH | `/api/admin/opportunities/:id` | Admin | Update an opportunity, including its photo link |
| DELETE | `/api/admin/opportunities/:id` | Admin | Delete (blocked with `409` while applications exist) |
| GET | `/api/admin/applications` | Admin | All applications with the applicant's account email |
| PATCH | `/api/admin/applications/:id/status` | Admin | Set `pending`, `approved`, or `rejected` |
| DELETE | `/api/admin/applications/:id` | Admin | Delete an application and restore the spot |
| GET | `/api/events` | Public | Legacy events list |
| POST | `/api/volunteers/signup` | Public | Legacy event sign-up (not used by the frontend) |

Errors are returned as JSON (`{ "message": ... }`). Missing or invalid tokens get `401`; a regular user calling an admin route gets `403`.

## 5. Validation

Every write is validated with Zod in the `validate(schema)` middleware, which puts the parsed result on `req.validatedBody`, and the same rules are mirrored in the browser for immediate feedback.

* **Applications** (`application.schema.js`): names and city letters only, 11-digit phone, age 0–120 or blank, at least one `Day-Block` availability slot, skills from a fixed list, `heardAbout` from a fixed list, and terms must be accepted.
* **Auth** (`auth.schema.js`): valid email, password 8–128 characters.
* **Admin** (`admin.schema.js`): opportunity `name`, `type`, `description`, and non-negative `spotsLeft`; application status; and optional `imageUrl` (blank becomes `NULL`, otherwise `http://` or `https://`, 255 characters max).

## 6. Authentication and Authorization

1. Registration and login hash and compare passwords with bcryptjs and return a 7-day JWT.
2. The client stores the token in local storage under `volunteer_portal_token` and restores the session through `GET /api/auth/me`.
3. `requireAuth` verifies `Authorization: Bearer <token>` and loads the account; `requireAdmin` additionally requires `role === "admin"`.
4. On the client, `RequireAuth` guards `/signup` and `/my-applications`, and `RequireAdmin` guards `/admin`. An expired or invalid token clears the session and redirects to login with a session-expired message.
5. The definitive admin account is created (or promoted) at server startup from `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`.

## 7. Frontend Structure

| Route | Page | Access |
|---|---|---|
| `/` | `HomePage`: hero, search, category chips, full-bleed photo cards | Public |
| `/login`, `/register` | Credential forms with show/hide password | Public |
| `/signup` | `SignUpPage`: four-step form with a photo summary sidebar and success screen | Logged in |
| `/my-applications` | `MyApplicationsPage`: the caller's applications with status tags | Logged in |
| `/admin` | `AdminPage`: Opportunities (CRUD + Image URL) and Applications tabs | Admin |

**Design system** (`client/src/index.css`, branded "Signify"): teal/sage/amber tokens with a dark-mode variant, Fraunces / Public Sans / IBM Plex Mono fonts, a fixed circle-pattern background, and photo cards with a dark gradient for legibility. A "flat style overrides" block at the bottom of the file removes shadows and gradients and must stay last.

**Photo handling:** `getOpportunityImageUrl()` returns the saved link or a built-in "No image yet" SVG placeholder, and `useFallbackImage` swaps in the placeholder if a link fails to load. Photos appear on Home cards, the application form sidebar, the admin form preview, and admin row thumbnails.

## 8. Testing and Data Sync

* `npm run test:e2e` — smoke test: registers, applies, reloads, verifies persistence, and cleans up.
* `npm run test:e2e:full` — comprehensive suite: public browsing, auth and guards, wizard validation, concurrency on the last spot, admin CRUD and authorization, CORS, Helmet, and cleanup.
* `npm run test:e2e:headed` — the comprehensive suite in a visible, slowed-down browser.
* `npm run db:export` / `npm run db:import` — move MariaDB data between laptops via `database/volunteer_app.sql`.

See [`E2E_TESTING.md`](./E2E_TESTING.md) for setup and requirements.

## 9. Legacy Code from the Original Plan

The first version of the project planned a different data model: a `volunteers` table of people (`full_name`, `email`, `phone`), an `events` table, and a `signups` join table, served by `POST /api/volunteers/signup` and `GET /api/events`. That code is still in the repository (`volunteer.model.js`, `event.model.js`, `signup.model.js`, the matching controllers, routes, and schema) and the server still seeds three starter events, but the current frontend does not use any of it.

Be aware that the legacy `Volunteer` model and the current `VolunteerOpportunity` model both map to a table named `volunteers`. The live table (see the SQL export) has the opportunity columns, so the legacy sign-up endpoint is effectively unused. Removing the legacy models, routes, and the `events` / `signups` tables would remove that ambiguity, but that cleanup has not been done yet.