import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import eventRoutes from "./routes/event.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Volunteer Sign-Up API is running" });
});

// API Routes
app.use("/api/events", eventRoutes);
app.use("/api/volunteers", volunteerRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;