import jwt from "jsonwebtoken";
import { mustEnv } from "../utils/env.js";

const JWT_SECRET = mustEnv("JWT_SECRET");

export function auth(req, res, next) {
  // AGREGA ESTA LÍNEA:
  console.log("--> Petición interceptada en middleware hacia:", req.originalUrl);

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    console.log("--> Error: No hay token"); // Y ESTA
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Mantenemos esto por compatibilidad con tus rutas anteriores
    req.userId = payload.sub || payload.id;
    req.userRole = payload.role;

    // AGREGADO: Construimos req.user para el sistema multi-iglesia
    req.user = {
      id: payload.sub || payload.id,
      role: payload.role,
      destacamentoId: payload.destacamentoId // Esto es lo que usa el controlador de exploradores
    };

    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido" });
  }
}