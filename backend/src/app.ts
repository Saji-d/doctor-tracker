import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import doctorsRoutes from "./routes/doctors.routes";
import patientsRoutes from "./routes/patients.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { notFoundHandler, errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Render (like most PaaS) puts this app behind a reverse proxy. Without this,
// Express falls back to the proxy's own address for req.ip on every request,
// so express-rate-limit's per-IP login limiter becomes one shared global
// bucket instead of one bucket per real client — a few real users can lock
// out the entire site. Trusting the first hop lets Express read the real
// client IP from X-Forwarded-For.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ name: "Doctor Tracker API", status: "ok" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
