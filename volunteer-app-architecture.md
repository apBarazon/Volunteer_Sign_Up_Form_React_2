# Volunteer Sign-Up App — Architecture Plan

A high-level blueprint you can hand to GitHub Copilot (or any AI pair-programmer) in VS Code. Copilot works best when it can see this whole file, so keep it in your repo root as `ARCHITECTURE.md`.

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) | Fast dev server, simple setup |
| Backend | Node.js + Express | Pairs naturally with React, huge ecosystem, easy for Copilot to scaffold |
| Database | MariaDB (local) | You already chose this |
| ORM | Sequelize | Mature MariaDB/MySQL support, migrations, model validation |
| Validation | Zod | Used on both the API (server-side) and forms (client-side) |
| API style | REST (JSON) | Simplest to reason about for a small form app |

You didn't mention a backend framework, so Express is the default assumption here — it's the most common companion to a React + MariaDB stack and Copilot has the most training data on it. Say the word if you'd rather use Fastify or NestJS instead.

## 2. Project Folder Structure

Monorepo with two top-level folders — keeps frontend and backend independent but easy to manage together.

```
volunteer-app/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VolunteerForm.jsx
│   │   │   └── ConfirmationModal.jsx
│   │   ├── pages/
│   │   │   └── SignUpPage.jsx
│   │   ├── schemas/
│   │   │   └── volunteer.schema.js   # Zod schema, shared shape with server
│   │   ├── api/
│   │   │   └── volunteerApi.js       # fetch/axios calls to backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Sequelize connection setup
│   │   ├── models/
│   │   │   ├── volunteer.model.js
│   │   │   ├── event.model.js
│   │   │   └── signup.model.js
│   │   ├── schemas/
│   │   │   └── volunteer.schema.js   # Zod validation, mirrors client schema
│   │   ├── routes/
│   │   │   ├── volunteer.routes.js
│   │   │   └── event.routes.js
│   │   ├── controllers/
│   │   │   ├── volunteer.controller.js
│   │   │   └── event.controller.js
│   │   ├── middleware/
│   │   │   ├── validate.js           # generic Zod-validation middleware
│   │   │   └── errorHandler.js
│   │   ├── app.js                    # Express app setup
│   │   └── server.js                 # entry point (listens on port)
│   ├── migrations/                   # Sequelize migrations
│   ├── .env                          # DB credentials, port, etc.
│   └── package.json
│
└── README.md
```

**Why split `client/` and `server/`:** it's the clearest mental model for a beginner, each half has its own `package.json` and dependencies, and you can deploy or run them independently later.

## 3. Database Schema (MariaDB)

Three tables covers a typical volunteer sign-up flow: the volunteer's info, the events/shifts they can sign up for, and a join table linking the two (so one volunteer can sign up for multiple events).

```sql
CREATE TABLE volunteers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  phone       VARCHAR(20),
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150)  NOT NULL,
  description TEXT,
  event_date  DATE          NOT NULL,
  location    VARCHAR(150),
  capacity    INT           DEFAULT NULL,   -- NULL = unlimited
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signups (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  volunteer_id  INT NOT NULL,
  event_id      INT NOT NULL,
  status        ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
  signed_up_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_signup (volunteer_id, event_id)
);
```

If your app is really just "one form, one event" (no multiple events to choose from), you can drop the `events` table entirely and put `event_name` / `event_date` directly on `signups`. Say so and I'll simplify this.

## 4. API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/events` | List all upcoming events |
| GET | `/api/events/:id` | Get one event's details |
| POST | `/api/events` | (admin) create an event |
| POST | `/api/volunteers/signup` | Submit the sign-up form (creates volunteer if new, links to event) |
| GET | `/api/signups` | (admin) list all signups |
| GET | `/api/signups/:id` | Get one signup's details |
| DELETE | `/api/signups/:id` | Cancel a signup |

For the simplest version of the app, you may only need `GET /api/events` and `POST /api/volunteers/signup` — the rest can come later.

## 5. Zod Validation Schemas

Keep the shape identical on client and server so form errors match API errors exactly.

**`schemas/volunteer.schema.js`** (used in both `client/` and `server/`):

```javascript
import { z } from "zod";

export const volunteerSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z
    .string()
    .email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  eventId: z
    .number({ invalid_type_error: "Please select an event" })
    .int()
    .positive(),
});

export type VolunteerSignupInput = z.infer<typeof volunteerSignupSchema>;
```

(Drop the `export type` line if you're using plain JavaScript, not TypeScript — it's TS-only syntax.)

**Server-side validation middleware** (`middleware/validate.js`):

```javascript
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
  }
  req.validatedBody = result.data;
  next();
};
```

Used in a route like:

```javascript
router.post("/signup", validate(volunteerSignupSchema), volunteerController.signup);
```

## 6. Suggested Build Order

1. Scaffold `server/` — Express app, Sequelize connection to MariaDB, run migrations for the 3 tables.
2. Build `GET /api/events` and `POST /api/volunteers/signup` end-to-end (route → controller → model), test with Postman/curl.
3. Scaffold `client/` — Vite React app, build the form UI with the shared Zod schema for client-side validation.
4. Wire the form to the API.
5. Add the remaining routes (admin listing/cancel) once the core flow works.

## 7. What to Tell Copilot

Paste this whole file into your repo as `ARCHITECTURE.md`, then when prompting Copilot Chat in VS Code, reference it directly, e.g.:

> "Following ARCHITECTURE.md, scaffold the Express server with the folder structure and the volunteers/events/signups models using Sequelize."

Copilot will follow the structure much more reliably when it can see the whole plan at once rather than piecemeal.
