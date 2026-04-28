import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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
import adminRoutes from "./routes/admin.routes.js";
import { auditMiddleware } from "./middleware/audit.js";

dotenv.config();

const app = express();

// Confiar en el proxy de Railway/Vercel para leer la IP real del usuario
app.set('trust proxy', 1);

// Seguridad: headers HTTP seguros
app.use(helmet());

// Rate limit global — 300 requests por IP cada 15 minutos (Solo API)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos." }
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://clubtimoteo.vercel.app",
  "https://app.clubtimoteo.com",
  "https://www.app.clubtimoteo.com",
  ...(process.env.EXTRA_CORS_ORIGINS
    ? process.env.EXTRA_CORS_ORIGINS.split(",").map(o => o.trim())
    : [])
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, apps nativas, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));

// static uploads fotos
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

app.use("/api", apiLimiter);

// Audit middleware — intercepta escrituras exitosas en rutas /api/*
app.use("/api", auditMiddleware);

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
app.use("/api/admin", adminRoutes);

// ✅ CLEAN CODE P2: Global error handler — captura errores no manejados en rutas
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";
  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : "");
  res.status(status).json({
    msg: status < 500 ? err.message : "Error interno del servidor",
    ...(isDev && { stack: err.stack })
  });
});

// PORT for Railway
const PORT = process.env.PORT || 8080;

// IMPORTANT: listen on 0.0.0.0 for Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`);
});
