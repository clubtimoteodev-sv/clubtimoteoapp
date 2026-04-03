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
import territorioRoutes from "./routes/territorio.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000", 
      "https://clubtimoteo.vercel.app",
      "https://www.clubtimoteo.com"
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));

// static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", uploadDir)));

app.get("/", (_req, res) => {
  res.json({ ok: true, msg: "Club API running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/explorers", explorersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/service-groups", serviceGroupsRoutes);
app.use("/api/service-attendance", serviceAttendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/territorio", territorioRoutes);

// PORT for Railway
const PORT = process.env.PORT || 8080;

// IMPORTANT: listen on 0.0.0.0 for Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`);
});
