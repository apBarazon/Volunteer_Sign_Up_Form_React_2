# Beginner's Guide: What Every File Does in This Project

> **Why this file exists**: It explains every single folder and file in plain English, with real-world analogies, so you can actually understand and explain your project to your teacher or team.

---

## The 10,000-Foot View (How It All Connects)

Think of your web application like a **restaurant**:

```
┌─────────────────────────┐        HTTP Request        ┌────────────────────────┐
│  React Frontend         │  ───────────────────────>  │  Express Backend       │
│  (The Dining Room / UI) │  <───────────────────────  │  (The Waiter & Kitchen)│
└─────────────────────────┘        JSON Response       └───────────┬────────────┘
                                                                   │
                                                            Sequelize (ORM)
                                                                   │
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │  MariaDB (via XAMPP)   │
                                                       │  (The Storage Pantry)  │
                                                       └────────────────────────┘
```

1. **The Frontend (`client/`)**: The menu and the customer table. This is what users see in their web browser (buttons, text inputs, error messages).
2. **The Backend (`server/`)**: The waiter and kitchen staff. It listens for requests from the browser, validates the data, processes it, and talks to the database.
3. **The Database (MariaDB in XAMPP)**: The pantry / file cabinet. This is where your data permanently lives (even if you turn off the computer).

### Current User Flow

The home page is public, so visitors can browse and search opportunities without an account. Clicking **Apply Now** checks an authenticated user's existing applications for that opportunity before opening `/signup`. A duplicate shows a message and a My Applications link instead of opening the form. Full opportunities disable the button. The route guard sends logged-out visitors to `/login`, preserving `/signup` as the return path. After registration or login, the user returns to the application form.

Submitting an application requires a valid JWT. The backend stores that account's ID on the application row, checks the account/opportunity pair for duplicates, and reserves capacity with an atomic `spots_left > 0` update inside a transaction, so simultaneous requests cannot claim the last spot twice. Successful submission shows a distinct confirmation screen before the user chooses My Applications or more opportunities. The protected `/api/applications` query filters by that account ID, so **My Applications** shows only the current user's submissions and displays Pending, Confirmed, or Cancelled status tags.

### How Opportunity Photos Work

Each opportunity (a row in the `volunteers` table) has an optional `image_url` text column. Photos are **linked, not uploaded**: an admin pastes a web address such as `https://example.com/photo.jpg` into the **Image URL** field of the Admin Panel, and the browser loads the picture directly from that site. Our server never stores or serves the image file itself.

1. The admin saves the form. The server's Zod schema (`admin.schema.js`) accepts a blank value (stored as `NULL`) or a URL starting with `http://` or `https://`, up to 255 characters.
2. `GET /api/opportunities` returns the row with `imageUrl`.
3. `client/src/utils/opportunityImage.ts` decides what to show: the saved URL, or a built-in "No image yet" placeholder when it is empty.
4. If a saved link is broken or the other site is down, the `<img onError>` handler swaps in the same placeholder so the layout never shows a broken-image icon.

The photo appears in four places: the full-bleed Home page cards, the sidebar summary on the application form, the admin form preview, and the thumbnail on each admin row. Because images are hotlinked, they can disappear if the other website removes them.

---

## The Complete Folder Walkthrough

---

### 1. Root Files (Top-Level)

* **[`volunteer-app-architecture.md`](./volunteer-app-architecture.md)**
  * **What it is**: The master blueprint that Claude generated.
  * **What it does**: Outlines the tech choices (React, Express, Sequelize, MariaDB), the database tables, and the planned API endpoints.
* **[`CHANGELOG.md`](./CHANGELOG.md)**
  * **What it is**: The team's checkpoint log.
  * **What it does**: Tracks what has been done step-by-step with timestamps so you and your group members always know what's finished and what's next.
* **[`CODEBASE_EXPLAINER.md`](./CODEBASE_EXPLAINER.md)** (This file!)
  * **What it is**: The friendly dictionary explaining every file in the codebase.
* **[`package.json`](./package.json)**
  * **What it is**: The root command center for the automated browser test.
  * **What it does**: Provides `npm run test:e2e` for the short smoke test, `npm run test:e2e:full` for comprehensive headless coverage, `npm run test:e2e:headed` for a visible slowed-down run, database export/import commands, and the one-time Playwright browser installation command.
* **[`E2E_TESTING.md`](./E2E_TESTING.md)**
  * **What it is**: The instructions for running the repeatable end-to-end smoke test.
  * **What it does**: Explains setup, database requirements, and what the automated workflow verifies.
* **[`scripts/e2e-smoke.mjs`](./scripts/e2e-smoke.mjs)**
  * **What it is**: A Playwright browser test that behaves like a real user.
  * **What it does**: Starts missing development servers, clears browser state, tests validation, creates an account, submits an application, reloads the page, verifies that MariaDB-backed data appears in My Applications, then removes the temporary account and restores opportunity capacity. This is the "smoke test": a quick check that the main path still works. It needs the `volunteers.image_url` column to exist in the database (see the note in `server.js` below).
* **[`scripts/e2e-comprehensive.mjs`](./scripts/e2e-comprehensive.mjs)**
  * **What it is**: The complete Playwright browser workflow.
  * **What it does**: Covers public browsing, authentication and guards, password visibility, logout token removal, expired-JWT recovery, duplicate prevention, wizard validation/navigation, loading and error states, persistence, concurrent capacity enforcement, admin CRUD and every admin authorization method, status actions, deletion protection, CORS, Helmet, and cleanup.
* **[`scripts/e2e-headed.mjs`](./scripts/e2e-headed.mjs)**
  * **What it is**: The watchable E2E command wrapper.
  * **What it does**: Runs the comprehensive suite in visible Chromium with slow actions and waits for Enter before closing.
* **[`.gitignore`](./.gitignore)**
  * **What it is**: The list of things Git must never track.
  * **What it does**: Keeps `node_modules/`, `.env` files, build output (`dist/`), logs, and editor files out of the repository.
* **[`database/volunteer_app.sql`](./database/volunteer_app.sql)**
  * **What it is**: The exported copy of the local MariaDB data (created by `npm run db:export`).
  * **What it does**: Lets a teammate restore the same tables and rows with `npm run db:import`. It includes the `volunteers.image_url` column and photo URLs for the three starter opportunities. Because it can contain account and applicant data, only keep it in a private repository.
* **[`scripts/db-sync.mjs`](./scripts/db-sync.mjs)**
  * **What it is**: A local MariaDB export and import utility.
  * **What it does**: Reads the database settings from `server/.env`, uses the XAMPP MariaDB tools, exports data to `database/volunteer_app.sql`, and imports that file on another laptop.

To enable administration, set `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`, then restart the backend. The startup process creates the account if it is missing or promotes the matching account to the `admin` role. Set `FRONTEND_ORIGINS` to the comma-separated frontend origins that may call the API.

The Admin Panel uses one tabbed dashboard: Opportunities contains CRUD controls, while Applications provides Pending/Confirmed/Cancelled filters, applicant search, 15-item pagination, expandable details, Approve/Reject/Delete actions, inline status updates, and deletion. The Opportunities tab form also has an **Image URL** field with a live preview, and every opportunity row shows a thumbnail.

---

### 2. Backend Files (`server/`) — "The Engine & Kitchen"

This is a **Node.js + Express** server. It runs on `http://localhost:3000`.

#### Setup & Configuration
* **[`server/package.json`](./server/package.json)**
  * **The manifest**: Lists all libraries the backend needs:
    * `express`: The web server framework.
    * `mysql2`: The low-level driver that allows Node.js to speak to MariaDB/MySQL.
    * `sequelize`: An "ORM" (Object Relational Mapper) that lets you talk to your database using JavaScript objects instead of raw SQL queries.
    * `zod`: The validation library that makes sure emails look like emails and names aren't empty.
    * `cors`: Allows only the configured frontend origins to talk to the backend.
    * `helmet`: Adds Express security headers such as `X-Content-Type-Options`.
    * `dotenv`: Loads secret settings from your `.env` file into code.
    * `bcryptjs`: Hashes passwords before they are stored.
    * `jsonwebtoken`: Creates and verifies login sessions represented by JWTs.
* **[`server/.env`](./server/.env)**
  * **The secret credentials**: Holds database passwords, usernames, and port numbers.
  * *Why keep it separate?* You never want to hardcode database passwords in your code files.
* **[`server/src/config/db.js`](./server/src/config/db.js)**
  * **The database connector**: Initializes Sequelize with your credentials from `.env`. Before connecting, it creates the configured local database if it does not already exist.
* **[`server/src/server.js`](./server/src/server.js)**
  * **The ignition key**: The actual starting point of the backend. It checks the JWT configuration, tests MariaDB, links the account/application/opportunity models, creates missing tables (`sequelize.sync()`, which does **not** alter existing tables), runs small idempotent upgrades that add the `status`, `username`, `role`, and `account_id` columns when they are missing, creates or promotes the admin account from `.env`, seeds starter events and opportunities, and starts port 3000 on all local interfaces. **Heads-up**: there is not yet an upgrade step for `volunteers.image_url`, so a database created before the photo feature needs `npm run db:import` or `ALTER TABLE volunteers ADD COLUMN image_url VARCHAR(255) NULL;` once. Newly seeded opportunities also start without photos.
* **[`server/src/app.js`](./server/src/app.js)**
  * **The Express setup**: Restricts CORS to `FRONTEND_ORIGINS`, adds Helmet security headers and `express.json()`, mounts public opportunity routes (`/api/opportunities` and the alias `/api/volunteers`), authentication routes, admin routes (`/api/admin`), protected application routes, the legacy events route, and installs the global error handler.

#### The Data Models (`server/src/models/`)
*These define what your MariaDB tables look like, translated into JavaScript:*
* **[`server/src/models/volunteer.model.js`](./server/src/models/volunteer.model.js)**
  * Defines the **`volunteers`** table: stores `id`, `full_name`, `email` (must be unique), and `phone`.
* **[`server/src/models/event.model.js`](./server/src/models/event.model.js)**
  * Defines the **`events`** table: stores `id`, `title`, `description`, `event_date`, `location`, and `capacity`.
* **[`server/src/models/signup.model.js`](./server/src/models/signup.model.js)**
  * Defines the **`signups`** table: This is the **bridge / join table**. It connects a `volunteer_id` to an `event_id` with a status (`pending`, `confirmed`, `cancelled`). It prevents the same person from signing up for the exact same event twice.
* **[`server/src/models/volunteerOpportunity.model.js`](./server/src/models/volunteerOpportunity.model.js)**
  * Defines the opportunity cards shown on the Home page, stored in the **`volunteers`** table: `id`, `name`, `type` (Education, Environment, or Outreach), `description`, `spots_left`, and the optional **`image_url`** photo link. This is the model the current frontend uses. (The older `volunteer.model.js` above also points at a table called `volunteers`; the live table follows the opportunity model, and the frontend does not use the legacy sign-up endpoint.)
* **[`server/src/models/account.model.js`](./server/src/models/account.model.js)**
  * Defines the separate **`accounts`** table used for authentication. It stores a unique email, an optional unique username, a role (`user` or `admin`), and a bcrypt password hash, never the plain-text password.
* **[`server/src/models/userApplication.model.js`](./server/src/models/userApplication.model.js)**
  * Defines the existing **`users`** table that stores submitted applications. It also stores each application's `status` (`pending`, `approved`, or `rejected`, shown to users as Pending, Confirmed, or Cancelled). Its nullable `account_id` column links new applications to the login account that submitted them. It remains separate from `accounts` because one account can submit multiple applications.

#### Validation & Security (`server/src/schemas/` & `server/src/middleware/`)
* **[`server/src/schemas/volunteer.schema.js`](./server/src/schemas/volunteer.schema.js)**
  * **The bouncer's checklist**: Uses Zod to define what valid sign-up data looks like:
    * `fullName`: At least 2 characters.
    * `email`: Must be a valid email format.
    * `phone`: Valid phone format or blank.
    * `eventId`: Must be a positive number.
* **[`server/src/middleware/validate.js`](./server/src/middleware/validate.js)**
  * **The bouncer**: An Express middleware function. Before a request touches your database, this checks the incoming data against the Zod schema. If the user sent a broken email, it immediately sends back a `400 Bad Request` with error messages.
* **[`server/src/middleware/errorHandler.js`](./server/src/middleware/errorHandler.js)**
  * **The safety net**: If anything crashes unexpectedly (e.g. database down, server glitch), this catches the error and sends a clean JSON error response instead of crashing the whole server.
* **[`server/src/middleware/requireAuth.js`](./server/src/middleware/requireAuth.js)**
  * **The security checkpoint**: Reads `Authorization: Bearer <token>`, verifies the JWT with `JWT_SECRET`, loads the account, and places it on `req.account`. Requests without a valid token receive `401 Unauthorized`; `requireAdmin` additionally requires `req.account.role === "admin"`.
* **[`server/src/schemas/auth.schema.js`](./server/src/schemas/auth.schema.js)**
  * Validates authentication credentials: a properly formatted email and a password between 8 and 128 characters.
* **[`server/src/schemas/application.schema.js`](./server/src/schemas/application.schema.js)**
  * Validates every field in the four-step application before the controller can write to MariaDB.
* **[`server/src/schemas/admin.schema.js`](./server/src/schemas/admin.schema.js)**
  * Validates admin input: opportunity `name`, `type`, `description`, and `spotsLeft`, the application status value, and the optional `imageUrl` (blank becomes `NULL`, otherwise it must start with `http://` or `https://` and be at most 255 characters).

#### Routes & Controllers (`server/src/routes/` & `server/src/controllers/`)
* **[`server/src/routes/volunteer.routes.js`](./server/src/routes/volunteer.routes.js)** & **[`server/src/routes/event.routes.js`](./server/src/routes/event.routes.js)**
  * **The road signs (URLs)**: Defines the web addresses, like:
    * `GET /api/events` (Show me the list of events)
    * `POST /api/volunteers/signup` (Legacy event-based sign-up endpoint)
    * The current four-step portal submits through `POST /api/applications`.
* **[`server/src/controllers/volunteer.controller.js`](./server/src/controllers/volunteer.controller.js)** & **[`server/src/controllers/event.controller.js`](./server/src/controllers/event.controller.js)**
  * **The business logic (The brain)**: The actual code that runs when someone visits those URLs.
    * When someone calls `/api/events`, the controller asks Sequelize: "Hey, fetch all rows from the `events` table and return them as JSON."
    * When someone calls `/api/volunteers/signup`, the controller checks if the event has room, creates the volunteer record, and saves the signup.
* **[`server/src/controllers/auth.controller.js`](./server/src/controllers/auth.controller.js)**
  * Handles account creation, password comparison during login, JWT creation, and the current-account response.
* **[`server/src/controllers/application.controller.js`](./server/src/controllers/application.controller.js)**
  * Lists only applications where `account_id` matches `req.account.id`, and saves that ID when a new application is submitted.
* **[`server/src/controllers/opportunity.controller.js`](./server/src/controllers/opportunity.controller.js)** & **[`server/src/routes/opportunity.routes.js`](./server/src/routes/opportunity.routes.js)**
  * Serve the public opportunity list and single-opportunity lookups (`GET /api/opportunities`, `GET /api/opportunities/:id`, also reachable under `/api/volunteers`). The returned JSON includes `imageUrl`.
* **[`server/src/controllers/admin.controller.js`](./server/src/controllers/admin.controller.js)**
  * Admin-only actions: list, create, update, and delete opportunities (deleting is blocked while applications exist), list applications with the applicant's account email, change an application's status, and delete an application while giving its spot back.
* **[`server/src/routes/auth.routes.js`](./server/src/routes/auth.routes.js)**
  * Defines `POST /api/auth/register`, `POST /api/auth/login`, protected `GET /api/auth/me`, and protected `DELETE /api/auth/me` (deletes the account and its applications; the E2E tests use it for cleanup).
* **[`server/src/routes/application.routes.js`](./server/src/routes/application.routes.js)**
  * Requires authentication for both reading and submitting applications, then applies Zod validation to submissions.
* **[`server/src/routes/admin.routes.js`](./server/src/routes/admin.routes.js)**
  * Applies `requireAuth` and `requireAdmin` to every admin opportunity and application endpoint, including status changes and deletes.

---

### 3. Frontend Files (`client/`) — "The Dining Room & User Interface"

This is a **React + TypeScript + Vite** app. It runs on `http://localhost:5173`.

* **[`client/index.html`](./client/index.html)**
  * The single HTML page loaded by the browser. It has a single container: `<div id="root"></div>`. React takes over this `div` and paints the entire UI inside it.
* **[`client/vite.config.ts`](./client/vite.config.ts)**
  * Configures **Vite**, the high-speed development server and bundler. It proxies `/api` requests to the backend and accepts connections from other devices on the local network.
* **[`client/package.json`](./client/package.json)**
  * Lists frontend packages: `react`, `react-dom`, `react-router-dom`, `zod`, TypeScript, and Vite.
* **[`client/tsconfig.json`](./client/tsconfig.json)**
  * TypeScript settings. `npm run build` runs `tsc -b` first, so type errors stop the build.
* **[`client/public/`](./client/public/)**
  * Static files served as-is: `favicon.svg` and `images/volunteerbg.png` (a background image that no code currently references).
* **[`client/src/main.tsx`](./client/src/main.tsx)**
  * The entry door for React: Takes the `App` component and injects it into `<div id="root"></div>`.
* **[`client/src/App.tsx`](./client/src/App.tsx)**
  * The main React component: Creates the SPA routes, places the auth provider around the app, and guards signup and My Applications.
* **[`client/src/context/AuthContext.tsx`](./client/src/context/AuthContext.tsx)**
  * Stores the JWT in local storage, restores the account with `/api/auth/me`, and exposes login, registration, and logout actions.
* **[`client/src/components/RequireAuth.tsx`](./client/src/components/RequireAuth.tsx)**
  * A React Router guard that redirects guests to login and preserves the page they were trying to reach.
* **[`client/src/components/RequireAdmin.tsx`](./client/src/components/RequireAdmin.tsx)**
  * A second route guard that only lets accounts with the `admin` role open `/admin`.
* **[`client/src/components/Navbar.tsx`](./client/src/components/Navbar.tsx)**
  * The "Signify" top bar. Uses `NavLink` so the current page is highlighted. Shows login/register for guests, or My Applications/logout (plus Admin Panel for admins) when signed in, and holds the light/dark theme toggle.
* **[`client/src/context/AppContext.tsx`](./client/src/context/AppContext.tsx)**
  * Shares the selected opportunity between the Home page and the application form.
* **[`client/src/pages/HomePage.tsx`](./client/src/pages/HomePage.tsx)**
  * The public landing page: hero, search box, category chips, and the photo cards. Each card shows the opportunity image, type badge, spots left, and an Apply Now button (disabled when full or already applied).
* **[`client/src/pages/AdminPage.tsx`](./client/src/pages/AdminPage.tsx)**
  * The admin dashboard with Opportunities and Applications tabs, including the Image URL field with live preview and row thumbnails.
* **[`client/src/utils/opportunityImage.ts`](./client/src/utils/opportunityImage.ts)**
  * Small helpers for photos: `getOpportunityImageUrl()` returns the saved URL or a built-in "No image yet" placeholder, and `useFallbackImage` (used as `onError`) swaps in the placeholder when a link is broken.
* **[`client/src/types/`](./client/src/types/)** and **[`client/src/schemas/`](./client/src/schemas/)**
  * TypeScript types (`VolunteerOpportunity` now includes `imageUrl`, `ApplicationFormData`) and the client-side Zod schemas that mirror the server's rules.
* **[`client/src/pages/LoginPage.tsx`](./client/src/pages/LoginPage.tsx)** and **[`client/src/pages/RegisterPage.tsx`](./client/src/pages/RegisterPage.tsx)**
  * Render the credential forms and use the client Zod schema before calling the auth API.
* **[`client/src/pages/SignUpPage.tsx`](./client/src/pages/SignUpPage.tsx)**
  * The four-step application form with validation, visible submission errors, disabled `Submitting...` state, and a distinct success confirmation after the API accepts the application. A sidebar summary next to the form shows the chosen opportunity's photo, name, and description.
* **[`client/src/pages/MyApplicationsPage.tsx`](./client/src/pages/MyApplicationsPage.tsx)**
  * Fetches the authenticated user's applications using the bearer token, displays loading/error states, and renders Pending, Confirmed, or Cancelled status tags.
* **[`client/src/components/PasswordInput.tsx`](./client/src/components/PasswordInput.tsx)**
  * Reusable login/registration password field with an accessible eye icon that toggles masked and visible text.
* **[`client/src/api/api.ts`](./client/src/api/api.ts)**
  * Centralizes fetch calls and attaches `Authorization: Bearer <jwt>` to auth-protected requests. Authenticated `401` responses clear the token and redirect to login with a session-expired message.
* **[`client/src/index.css`](./client/src/index.css)**
  * The shared design system after the redesign: teal/sage/amber light and dark color tokens, Fraunces + Public Sans + IBM Plex Mono fonts (loaded from Google Fonts), a fixed circle-pattern background, full-bleed photo cards, responsive layouts, auth forms, admin surfaces, and buttons. The block titled "FLAT STYLE OVERRIDES" at the very bottom removes shadows, gradients, and hover lift; it must stay last so it overrides earlier rules.

---

## A Complete Data Walkthrough (Example)

When an authenticated volunteer submits the application form:

1. **User Action**: The user selects an opportunity, completes the four-step form, and clicks **Confirm & Submit**.
2. **Frontend Validation**: The client Zod schema checks names, email, phone, age, availability, experience, skills, and terms.
3. **Authenticated Request**: `client/src/api/api.ts` sends the application and `Authorization: Bearer <jwt>` to `POST /api/applications`.
4. **Backend Security**: `requireAuth` verifies the JWT and loads `req.account`; `validate(applicationSchema)` checks the request body.
5. **Duplicate and Capacity Checks**: The controller rejects an existing `{ account_id, volunteer_id }` pair and atomically reserves a row where `spots_left > 0`.
6. **Ownership and Capacity**: The controller writes `account_id = req.account.id` in the same transaction as the conditional decrement; a losing concurrent request is rolled back.
7. **Confirmation**: The frontend shows a success screen with the submitted role before offering My Applications or more opportunities.
8. **My Applications**: Later, `GET /api/applications` filters by that same account ID, so another account cannot see the record; each record includes its current status tag.

## Synchronizing Local Database Data

Each laptop has its own MariaDB data, so Git does not synchronize accounts or applications. To move the latest local data between laptops:

1. Run `npm run db:export` from the project root on the laptop with the newest data.
2. Move `database/volunteer_app.sql` to the other laptop's project root.
3. Run `npm run db:import` from the project root on the other laptop.

The commands use the settings in `server/.env` and look for XAMPP at `C:\xampp\mysql\bin`. Set `MYSQL_BIN_DIR` when XAMPP is installed elsewhere. The SQL export is tracked by Git for laptop-to-laptop synchronization, so the repository should be private because the file can contain account and applicant data.

---

## Summary Cheat-Sheet for Presenting to Classmates

| Question | Simple Answer |
|---|---|
| **What is our frontend?** | React + TypeScript (created with Vite), styled with CSS, running on port 5173. |
| **What is our backend?** | Node.js with Express, running on port 3000. |
| **What is our database?** | MariaDB, running locally via XAMPP on default port 3306. |
| **What is Sequelize?** | An ORM that turns JavaScript code into SQL queries for MariaDB. |
| **What is Zod?** | A data validator that ensures form inputs (like emails) are valid. |
| **How does login work?** | Passwords are hashed with bcryptjs; a JWT identifies the account on later requests. |
| **Why are accounts separate from applications?** | One account can submit multiple applications, so login identities and application records need separate tables. |
| **How is My Applications private?** | The backend filters application rows by the authenticated account ID, not by a client-supplied email. |
| **How do the opportunity photos work?** | Admins paste an image link; only the URL text is stored in `volunteers.image_url` and the browser loads the picture from that site, with a placeholder if it fails. |
| **Why did the app break after pulling the photo update?** | The new `image_url` column is not added automatically to an existing database. Run `npm run db:import` or add the column once. |
| **What is the smoke test?** | `npm run test:e2e`: a short automated browser run that registers, applies, reloads, and cleans up, to confirm the main path still works. |
| **Why is there client and server?** | To keep the user interface separated from database operations and server logic. |