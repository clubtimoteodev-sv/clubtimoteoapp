import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import explorersRoutes from "./routes/explorers.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import serviceGroupsRoutes from "./routes/service-groups.routes.js";
import serviceAttendanceRoutes from "./routes/service-attendance.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  ],
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));

// static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", uploadDir)));

app.get("/", (_req, res) => res.json({ ok: true, msg: "Club API running" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/explorers", explorersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/service-groups", serviceGroupsRoutes);
app.use("/api/service-attendance", serviceAttendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));