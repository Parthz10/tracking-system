import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { allowedOrigins } from "./config/env.js";
import { HttpError } from "./lib/http-error.js";
import { officerRateLimit } from "./middleware/rate-limit.middleware.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";
import { auditRoutes } from "./routes/audit.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { mediaRoutes } from "./routes/media.routes.js";
import { missingPersonRoutes } from "./routes/missing-person.routes.js";
import { reportRoutes } from "./routes/report.routes.js";
import { tokenRoutes } from "./routes/token.routes.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "safetyapp-api" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "safetyapp-api" });
});

app.use("/api/tokens", tokenRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/missing-persons", missingPersonRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/auth", officerRateLimit, authRoutes);
app.use("/api/analytics", officerRateLimit, analyticsRoutes);
app.use("/api/audit-logs", officerRateLimit, auditRoutes);

app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});
