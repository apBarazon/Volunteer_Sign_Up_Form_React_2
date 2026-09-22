# 📖 Beginner's Guide: What Every File Does in This Project

> **Why this file exists**: If you're feeling overwhelmed because you had AI generate files and now you're not sure what they do, **this guide is for you and your classmates**. It explains every single folder and file in plain English, with real-world analogies, so you can actually understand and explain your project to your teacher or team.

---

## 🗺️ The 10,000-Foot View (How It All Connects)

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

---

## 📂 The Complete Folder Walkthrough

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
* **[`server/.env`](./server/.env)**
  * **The secret credentials**: Holds database passwords, usernames, and port numbers.
  * *Why keep it separate?* You never want to hardcode database passwords in your code files.
* **[`server/src/config/db.js`](./server/src/config/db.js)**
  * **The database connector**: Initializes Sequelize with your credentials from `.env`. When the server starts, it uses this file to connect to MariaDB in XAMPP.
* **[`server/src/server.js`](./server/src/server.js)**
  * **The ignition key**: The actual starting point of the backend. It tests the MariaDB connection (`sequelize.authenticate()`), links all models together, and tells Express to start listening on port 3000.
* **[`server/src/app.js`](./server/src/app.js)**
  * **The Express setup**: Configures middleware like CORS and `express.json()` (so Express can understand incoming JSON data), and where all routes are plugged in.

#### The Data Models (`server/src/models/`)
*These define what your MariaDB tables look like, translated into JavaScript:*
* **[`server/src/models/volunteer.model.js`](./server/src/models/volunteer.model.js)**
  * Defines the **`volunteers`** table: stores `id`, `full_name`, `email` (must be unique), and `phone`.
* **[`server/src/models/event.model.js`](./server/src/models/event.model.js)**
  * Defines the **`events`** table: stores `id`, `title`, `description`, `event_date`, `location`, and `capacity`.
* **[`server/src/models/signup.model.js`](./server/src/models/signup.model.js)**
  * Defines the **`signups`** table: This is the **bridge / join table**. It connects a `volunteer_id` to an `event_id` with a status (`pending`, `confirmed`, `cancelled`). It prevents the same person from signing up for the exact same event twice.

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

#### Routes & Controllers (`server/src/routes/` & `server/src/controllers/`)
* **[`server/src/routes/volunteer.routes.js`](./server/src/routes/volunteer.routes.js)** & **[`server/src/routes/event.routes.js`](./server/src/routes/event.routes.js)**
  * **The road signs (URLs)**: Defines the web addresses, like:
    * `GET /api/events` (Show me the list of events)
    * `POST /api/volunteers/signup` (Submit my sign-up form)
* **[`server/src/controllers/volunteer.controller.js`](./server/src/controllers/volunteer.controller.js)** & **[`server/src/controllers/event.controller.js`](./server/src/controllers/event.controller.js)**
  * **The business logic (The brain)**: The actual code that runs when someone visits those URLs.
    * When someone calls `/api/events`, the controller asks Sequelize: "Hey, fetch all rows from the `events` table and return them as JSON."
    * When someone calls `/api/volunteers/signup`, the controller checks if the event has room, creates the volunteer record, and saves the signup.

---

### 3. Frontend Files (`client/`) — "The Dining Room & User Interface"

This is a **React + Vite** app. It runs on `http://localhost:5173`.

* **[`client/index.html`](./client/index.html)**
  * The single HTML page loaded by the browser. It has a single container: `<div id="root"></div>`. React takes over this `div` and paints the entire UI inside it.
* **[`client/vite.config.js`](./client/vite.config.js)**
  * Configures **Vite**, the high-speed development server and bundler.
* **[`client/package.json`](./client/package.json)**
  * Lists frontend packages: `react`, `react-dom`, and Vite dev tools.
* **[`client/eslint.config.js`](./client/eslint.config.js)**
  * Linter configuration: Checks for syntax mistakes or unused variables in your code.
* **[`client/src/main.jsx`](./client/src/main.jsx)**
  * The entry door for React: Takes the `App` component and injects it into `<div id="root"></div>`.
* **[`client/src/App.jsx`](./client/src/App.jsx)**
  * The main React component: Where the header, sign-up form, and modal will be assembled.
* **[`client/src/index.css`](./client/src/index.css)** & **[`client/src/App.css`](./client/src/App.css)**
  * The CSS style sheets controlling colors, fonts, margins, and buttons.

---

## 🔄 A Complete Data Walkthrough (Example)

When a volunteer submits the sign-up form:

1. **User Action**: The volunteer types their name, email, and picks "Beach Cleanup" from the dropdown, then clicks **"Sign Up"**.
2. **Frontend Validation (Browser)**: React checks with Zod to make sure the email is valid before even sending it over the network.
3. **HTTP Request**: React sends a `POST` request containing `{ fullName: "Alex", email: "alex@example.com", eventId: 1 }` to `http://localhost:3000/api/volunteers/signup`.
4. **Backend Security**: `server/src/middleware/validate.js` intercepts the request and verifies the data.
5. **Controller Logic**: `volunteer.controller.js` runs:
   - Finds or creates the volunteer in MariaDB.
   - Checks if "Beach Cleanup" is full.
   - Inserts a new row into the `signups` table.
6. **HTTP Response**: The server sends `{ success: true, message: "Signed up successfully!" }` back to the browser.
7. **UI Update**: React receives the success response and pops up `ConfirmationModal.jsx` displaying: *"You're in! See you at Beach Cleanup!"*

---

## 💡 Summary Cheat-Sheet for Presenting to Classmates

| Question | Simple Answer |
|---|---|
| **What is our frontend?** | React (created with Vite), styled with CSS, running on port 5173. |
| **What is our backend?** | Node.js with Express, running on port 3000. |
| **What is our database?** | MariaDB, running locally via XAMPP on default port 3306. |
| **What is Sequelize?** | An ORM that turns JavaScript code into SQL queries for MariaDB. |
| **What is Zod?** | A data validator that ensures form inputs (like emails) are valid. |
| **Why is there client and server?** | To keep the user interface separated from database operations and server logic. |

