import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import eventRoutes from "./routes/event.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Volunteer Sign-Up API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Original API Routes (events table + volunteers/signups tables)
app.use("/api/events", eventRoutes);

// /api/volunteers handles both:
//   POST /api/volunteers/signup  ← original sign-up (event-based)
//   GET  /api/volunteers         ← opportunity cards (classmate's volunteers table)
//   GET  /api/volunteers/:id     ← single opportunity card
// Express matches routes in registration order, no conflict since
// volunteerRoutes only has POST /signup and opportunityRoutes only has GET / and GET /:id.
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/volunteers", opportunityRoutes);

// Also expose opportunities explicitly
app.use("/api/opportunities", opportunityRoutes);

// Applications (classmate's users table)
app.use("/api/applications", applicationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;