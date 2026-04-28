/**
 * Middleware de Auditoría
 * Intercepta todas las peticiones de escritura (POST, PUT, PATCH, DELETE) exitosas
 * y las guarda en la tabla AuditLog de Prisma.
 * 
 * Se monta ANTES de las rutas y captura la respuesta para registrar solo las exitosas.
 */
import { prisma } from "../prisma.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Rutas que NO deben auditarse (login, health, etc.)
const EXCLUDED_PATHS = ["/api/auth/login", "/", "/api/health"];

export function auditMiddleware(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) return next();
  if (EXCLUDED_PATHS.some((p) => req.path === p)) return next();

  // Guardamos el payload antes de que Express lo consuma
  const payload = req.body ? JSON.stringify(req.body) : null;

  // Monkeypatching: interceptamos res.json para saber cuando la respuesta fue exitosa
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Solo auditamos si la respuesta fue exitosa (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
      const action = buildAction(req);
      prisma.auditLog
        .create({
          data: {
            userId: req.user.id,
            action,
            endpoint: req.originalUrl || req.path,
            method: req.method,
            payload
          }
        })
        .catch((err) => console.error("[Audit] Error guardando log:", err));
    }
    return originalJson(body);
  };

  next();
}

function buildAction(req) {
  const { method, path } = req;
  if (path.includes("explorers")) {
    if (method === "POST") return "Nuevo explorador creado";
    if (method === "PUT" || method === "PATCH") return "Explorador actualizado";
    if (method === "DELETE") return "Explorador eliminado";
  }
  if (path.includes("attendance")) {
    if (method === "POST") return "Asistencia registrada";
    if (method === "PATCH") return "Asistencia actualizada";
    if (method === "DELETE") return "Asistencia eliminada";
  }
  if (path.includes("finance")) {
    if (method === "POST") return "Movimiento financiero registrado";
    if (method === "PUT" || method === "PATCH") return "Movimiento financiero actualizado";
    if (method === "DELETE") return "Movimiento financiero eliminado";
  }
  if (path.includes("service-groups")) {
    if (method === "POST") return "Grupo de servicio creado";
    if (method === "DELETE") return "Grupo de servicio eliminado";
  }
  if (path.includes("calendar")) {
    if (method === "POST") return "Reunión creada";
    if (method === "DELETE") return "Reunión eliminada";
  }
  if (path.includes("auth/register")) return "Usuario registrado";
  if (path.includes("admin/users") && path.includes("unlock")) return "Cuenta desbloqueada (admin)";
  return `${method} ${path}`;
}
