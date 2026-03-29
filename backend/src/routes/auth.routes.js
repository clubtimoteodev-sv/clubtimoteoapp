import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { mustEnv } from "../utils/env.js";

const router = Router();
const JWT_SECRET = mustEnv("JWT_SECRET");

router.post("/register", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string().optional(),
    destacamentoId: z.string().min(1) // Obligatorio para vincular al usuario a una iglesia
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { name, email, password, role, destacamentoId } = parsed.data;

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

router.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ msg: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: "Credenciales inválidas" });

  // Inyectamos el destacamentoId en el token
  const token = jwt.sign(
    { 
      sub: user.id, 
      role: user.role,
      destacamentoId: user.destacamentoId 
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
      destacamentoId: user.destacamentoId 
    }
  });
});

export default router;