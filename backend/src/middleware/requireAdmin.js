/**
 * Middleware: requireAdmin
 * Permite el acceso únicamente a usuarios con rol "superadmin".
 * Debe usarse después del middleware `auth`.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ msg: "Acceso denegado: se requiere rol de Administrador." });
  }
  next();
}
