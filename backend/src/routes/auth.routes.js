import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { mustEnv } from "../utils/env.js";
import { auth } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = mustEnv("JWT_SECRET");

// ✅ SEGURIDAD P1: Rate limit en login — máx 10 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." }
});

// ✅ SEGURIDAD: /register protegido — solo admins autenticados pueden crear usuarios
router.post("/register", auth, async (req, res) => {
  // Solo superadmin puede crear usuarios con roles elevados
  if (req.userRole !== "admin" && req.userRole !== "superadmin") {
    return res.status(403).json({ msg: "Sin permisos para registrar usuarios" });
  }

  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    // ✅ SEGURIDAD: role removido del request — solo superadmin puede promover roles
    destacamentoId: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { name, email, password, destacamentoId } = parsed.data;
  // Rol siempre es 'admin' por defecto — no puede ser escalado desde el cliente
  const role = "admin";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ msg: "Email ya existe" });

  // Verificamos que el destacamento exista en la base de datos
  const destacamentoExists = await prisma.destacamento.findUnique({ 
    where: { id: destacamentoId } 
  });
  if (!destacamentoExists) return res.status(404).json({ msg: "El destacamento no existe" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hash, 
      role: role ?? "admin",
      destacamentoId 
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      destacamentoId: true, 
      createdAt: true 
    }
  });

  res.json(user);
});

router.post("/login", loginLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      destacamento: {
        select: { id: true, nombre: true, ciudad: true, iglesia: true, encargado: true }
      },
      territorio: true
    }
  });
  if (!user) return res.status(401).json({ msg: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: "Credenciales inválidas" });

  // Inyectamos el destacamentoId en el token
  const token = jwt.sign(
    { 
      sub: user.id, 
      role: user.role,
      destacamentoId: user.destacamentoId,
      territorioId: user.territorioId
    }, 
    JWT_SECRET, 
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      destacamentoId: user.destacamentoId,
      territorioId: user.territorioId,
      destacamentoNombre: user.destacamento?.nombre || null,
      destacamentoCiudad: user.destacamento?.ciudad || null,
      destacamentoIglesia: user.destacamento?.iglesia || null,
      encargado: user.destacamento?.encargado || null,
    }
  });
});

export default router;