# Beginner's Guide: What Every File Does in This Project

> **Why this file exists**: If you're feeling overwhelmed because you had AI generate files and now you're not sure what they do, **this guide is for you and your classmates**. It explains every single folder and file in plain English, with real-world analogies, so you can actually understand and explain your project to your teacher or team.

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

The home page is public, so visitors can browse and search opportunities without an account. Clicking **Apply Now** stores the selected opportunity in React context and opens `/signup`. The route guard sends logged-out visitors to `/login`, preserving `/signup` as the return path. After registration or login, the user returns to the application form.

Submitting an application requires a valid JWT. The backend stores that account's ID on the application row. The protected `/api/applications` query filters by that account ID, so **My Applications** shows only the current user's submissions.

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
  * **What it does**: Provides `npm run test:e2e`, `npm run db:export`, `npm run db:import`, and the one-time Playwright browser installation command.
* **[`E2E_TESTING.md`](./E2E_TESTING.md)**
  * **What it is**: The instructions for running the repeatable end-to-end smoke test.
  * **What it does**: Explains setup, database requirements, and what the automated workflow verifies.
* **[`scripts/e2e-smoke.mjs`](./scripts/e2e-smoke.mjs)**
  * **What it is**: A Playwright browser test that behaves like a real user.
  * **What it does**: Starts missing development servers, clears browser state, tests validation, creates an account, submits an application, reloads the page, and verifies that MariaDB-backed data appears in My Applications.
* **[`scripts/db-sync.mjs`](./scripts/db-sync.mjs)**
  * **What it is**: A local MariaDB export and import utility.
  * **What it does**: Reads the database settings from `server/.env`, uses the XAMPP MariaDB tools, exports data to `database/volunteer_app.sql`, and imports that file on another laptop.

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
    * `cors`: Allows your frontend (`localhost:5173`) to talk to your backend (`localhost:3000`) without the browser blocking it for security reasons.
    * `dotenv`: Loads secret settings from your `.env` file into code.
    * `bcryptjs`: Hashes passwords before they are stored.
    * `jsonwebtoken`: Creates and verifies login sessions represented by JWTs.
* **[`server/.env`](./server/.env)**
  * **The secret credentials**: Holds database passwords, usernames, and port numbers.
  * *Why keep it separate?* You never want to hardcode database passwords in your code files.
* **[`server/src/config/db.js`](./server/src/config/db.js)**
  * **The database connector**: Initializes Sequelize with your credentials from `.env`. Before connecting, it creates the configured local database if it does not already exist.
* **[`server/src/server.js`](./server/src/server.js)**
  * **The ignition key**: The actual starting point of the backend. It checks the JWT configuration, tests MariaDB, links the account/application/opportunity models, creates missing tables, adds the `account_id` column to an existing applications table when needed, seeds starter data, and starts port 3000 on all local interfaces.
* **[`server/src/app.js`](./server/src/app.js)**
  * **The Express setup**: Configures CORS and `express.json()`, mounts public opportunity routes, mounts authentication routes, protects application routes, and installs the global error handler.

#### The Data Models (`server/src/models/`)
*These define what your MariaDB tables look like, translated into JavaScript:*
* **[`server/src/models/volunteer.model.js`](./server/src/models/volunteer.model.js)**
  * Defines the **`volunteers`** table: stores `id`, `full_name`, `email` (must be unique), and `phone`.
* **[`server/src/models/event.model.js`](./server/src/models/event.model.js)**
  * Defines the **`events`** table: stores `id`, `title`, `description`, `event_date`, `location`, and `capacity`.
* **[`server/src/models/signup.model.js`](./server/src/models/signup.model.js)**
  * Defines the **`signups`** table: This is the **bridge / join table**. It connects a `volunteer_id` to an `event_id` with a status (`pending`, `confirmed`, `cancelled`). It prevents the same person from signing up for the exact same event twice.
* **[`server/src/models/account.model.js`](./server/src/models/account.model.js)**
  * Defines the separate **`accounts`** table used for authentication. It stores a unique email and a bcrypt password hash, never the plain-text password.
* **[`server/src/models/userApplication.model.js`](./server/src/models/userApplication.model.js)**
  * Defines the existing **`users`** table that stores submitted applications. Its nullable `account_id` column links new applications to the login account that submitted them. It remains separate from `accounts` because one account can submit multiple applications.

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
  * **The security checkpoint**: Reads `Authorization: Bearer <token>`, verifies the JWT with `JWT_SECRET`, loads the account, and places it on `req.account`. Requests without a valid token receive `401 Unauthorized`.
* **[`server/src/schemas/auth.schema.js`](./server/src/schemas/auth.schema.js)**
  * Validates authentication credentials: a properly formatted email and a password between 8 and 128 characters.
* **[`server/src/schemas/application.schema.js`](./server/src/schemas/application.schema.js)**
  * Validates every field in the four-step application before the controller can write to MariaDB.

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
* **[`server/src/routes/auth.routes.js`](./server/src/routes/auth.routes.js)**
  * Defines `POST /api/auth/register`, `POST /api/auth/login`, and protected `GET /api/auth/me`.
* **[`server/src/routes/application.routes.js`](./server/src/routes/application.routes.js)**
  * Requires authentication for both reading and submitting applications, then applies Zod validation to submissions.

---

### 3. Frontend Files (`client/`) — "The Dining Room & User Interface"

This is a **React + TypeScript + Vite** app. It runs on `http://localhost:5173`.

* **[`client/index.html`](./client/index.html)**
  * The single HTML page loaded by the browser. It has a single container: `<div id="root"></div>`. React takes over this `div` and paints the entire UI inside it.
* **[`client/vite.config.ts`](./client/vite.config.ts)**
  * Configures **Vite**, the high-speed development server and bundler. It proxies `/api` requests to the backend and accepts connections from other devices on the local network.
* **[`client/package.json`](./client/package.json)**
  * Lists frontend packages: `react`, `react-dom`, and Vite dev tools.
* **[`client/eslint.config.js`](./client/eslint.config.js)**
  * Linter configuration: Checks for syntax mistakes or unused variables in your code.
* **[`client/src/main.tsx`](./client/src/main.tsx)**
  * The entry door for React: Takes the `App` component and injects it into `<div id="root"></div>`.
* **[`client/src/App.tsx`](./client/src/App.tsx)**
  * The main React component: Creates the SPA routes, places the auth provider around the app, and guards signup and My Applications.
* **[`client/src/context/AuthContext.tsx`](./client/src/context/AuthContext.tsx)**
  * Stores the JWT in local storage, restores the account with `/api/auth/me`, and exposes login, registration, and logout actions.
* **[`client/src/components/RequireAuth.tsx`](./client/src/components/RequireAuth.tsx)**
  * A React Router guard that redirects guests to login and preserves the page they were trying to reach.
* **[`client/src/components/Navbar.tsx`](./client/src/components/Navbar.tsx)**
  * Displays public navigation plus login/register links for guests, or My Applications/logout for authenticated users.
* **[`client/src/pages/LoginPage.tsx`](./client/src/pages/LoginPage.tsx)** and **[`client/src/pages/RegisterPage.tsx`](./client/src/pages/RegisterPage.tsx)**
  * Render the credential forms and use the client Zod schema before calling the auth API.
* **[`client/src/pages/SignUpPage.tsx`](./client/src/pages/SignUpPage.tsx)**
  * The four-step application form. It remains an SPA view: moving between steps changes React state without a full page reload.
* **[`client/src/pages/MyApplicationsPage.tsx`](./client/src/pages/MyApplicationsPage.tsx)**
  * Fetches the authenticated user's applications using the bearer token and displays the returned records.
* **[`client/src/api/api.ts`](./client/src/api/api.ts)**
  * Centralizes fetch calls and attaches `Authorization: Bearer <jwt>` to auth-protected requests.
* **[`client/src/index.css`](./client/src/index.css)**
  * The CSS stylesheet controlling colors, fonts, margins, auth forms, and buttons.

---

## A Complete Data Walkthrough (Example)

When an authenticated volunteer submits the application form:

1. **User Action**: The user selects an opportunity, completes the four-step form, and clicks **Confirm & Submit**.
2. **Frontend Validation**: The client Zod schema checks names, email, phone, age, availability, experience, skills, and terms.
3. **Authenticated Request**: `client/src/api/api.ts` sends the application and `Authorization: Bearer <jwt>` to `POST /api/applications`.
4. **Backend Security**: `requireAuth` verifies the JWT and loads `req.account`; `validate(applicationSchema)` checks the request body.
5. **Ownership**: The controller writes `account_id = req.account.id` with the application and decrements the opportunity's remaining spots in a transaction.
6. **My Applications**: Later, `GET /api/applications` filters by that same account ID, so another account cannot see the record.

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
| **Why is there client and server?** | To keep the user interface separated from database operations and server logic. |

