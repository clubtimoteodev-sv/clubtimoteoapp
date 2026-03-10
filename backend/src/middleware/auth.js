import jwt from "jsonwebtoken";
import { mustEnv } from "../utils/env.js";

const JWT_SECRET = mustEnv("JWT_SECRET");

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido" });
  }
}