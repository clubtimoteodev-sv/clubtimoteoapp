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

// Variables opcionales para notificaciones por Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

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

  if (user.isLocked) {
    return res.status(403).json({ msg: "Usuario bloqueado por seguridad. Contacte a un administrador." });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, isLocked: true }
      });

      await prisma.adminNotification.create({
        data: {
          type: "ACCOUNT_LOCKED",
          title: "Cuenta bloqueada por intentos fallidos",
          message: `El usuario ${user.email} fue bloqueado tras 3 intentos fallidos de login.`,
          metadata: { userId: user.id, email: user.email, name: user.name }
        }
      }).catch(() => {});

      return res.status(403).json({ msg: "Usuario bloqueado por demasiados intentos fallidos. Contacte a un administrador." });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts }
      });
      return res.status(401).json({ msg: `Credenciales inválidas. Te quedan ${3 - attempts} intentos.` });
    }
  }

  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0 }
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      name: user.name,
      role: user.role,
      destacamentoId: user.destacamentoId,
      territorioId: user.territorioId,
      mustChangePassword: user.mustChangePassword   // ← incluido en el token
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
      mustChangePassword: user.mustChangePassword,  // ← incluido en la respuesta
      destacamentoNombre: user.destacamento?.nombre || null,
      destacamentoCiudad: user.destacamento?.ciudad || null,
      destacamentoIglesia: user.destacamento?.iglesia || null,
      encargado: user.destacamento?.encargado || null,
      territorioNombre: user.territorio?.nombre || null,
    }
  });
});

// ── PUT /api/auth/update-password-required ─────────────────────────────────
// Cambio OBLIGATORIO de contraseña (cuando mustChangePassword === true).
// No requiere contraseña actual (ya fue validada en el login con clave temporal).
router.put("/update-password-required", auth, async (req, res) => {
  const schema = z.object({
    newPassword:     z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ msg: parsed.error.errors[0].message });

  const { newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: "Las contraseñas no coinciden." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });

  if (!user.mustChangePassword) {
    return res.status(400).json({ msg: "No hay cambio de contraseña pendiente." });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, mustChangePassword: false, failedLoginAttempts: 0 }
  });

  await prisma.auditLog.create({
    data: {
      userId:   user.id,
      action:   "Contraseña obligatoria cambiada por el usuario",
      endpoint: "/api/auth/update-password-required",
      method:   "PUT",
      payload:  null
    }
  }).catch(() => {});

  // Emitir nuevo token sin mustChangePassword
  const newToken = jwt.sign(
    { sub: user.id, name: user.name, role: user.role, destacamentoId: user.destacamentoId, territorioId: user.territorioId, mustChangePassword: false },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ ok: true, msg: "Contraseña actualizada correctamente.", token: newToken });
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────
// Cambio VOLUNTARIO de contraseña (desde Ajustes). Requiere contraseña actual.
router.put("/change-password", auth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ msg: parsed.error.errors[0].message });

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: "Las contraseñas no coinciden." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(401).json({ msg: "La contraseña actual es incorrecta." });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, failedLoginAttempts: 0 }
  });

  await prisma.auditLog.create({
    data: {
      userId:   user.id,
      action:   "Contraseña cambiada voluntariamente",
      endpoint: "/api/auth/change-password",
      method:   "PUT",
      payload:  null
    }
  }).catch(() => {});

  res.json({ ok: true, msg: "Contraseña actualizada correctamente." });
});

// ── POST /api/auth/request-unlock ─────────────────────────────────────────
// Permite a un usuario bloqueado enviar una solicitud de soporte al admin.
const unlockRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 solicitudes por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Demasiadas solicitudes. Intenta más tarde." }
});

router.post("/request-unlock", unlockRequestLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    phone: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
    message: z.string().max(255).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ msg: parsed.error.errors[0].message });

  const { email, phone, message } = parsed.data;

  // Buscamos al usuario de forma silenciosa
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Si el usuario existe y está bloqueado, creamos la notificación
  if (user && user.isLocked) {
    await prisma.adminNotification.create({
      data: {
        type: "UNLOCK_REQUEST",
        title: "Solicitud de Desbloqueo",
        message: `${user.name} solicita desbloquear su cuenta. Teléfono: ${phone}. ${message ? `Mensaje: ${message}` : ""}`,
        metadata: { userId: user.id, email: user.email, phone, userMessage: message }
      }
    });

    // Enviar alerta en tiempo real a Telegram (si está configurado)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const text = `🚨 *NUEVA SOLICITUD DE DESBLOQUEO* 🚨\n\n` +
                     `👤 *Usuario:* ${user.name}\n` +
                     `📧 *Email:* ${user.email}\n` +
                     `📞 *Teléfono:* ${phone}\n` +
                     (message ? `📝 *Mensaje:* "${message}"\n` : "") +
                     `\n_Por favor, entra al panel de administración para atender esta solicitud._`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔓 Solo Desbloquear", callback_data: `unlock:${user.id}` },
                  { text: "🔑 Resetear Contraseña", callback_data: `reset:${user.id}` }
                ]
              ]
            }
          })
        });
      } catch (err) {
        console.error("Error al enviar notificación a Telegram:", err);
      }
    }
  }

  // Siempre retornamos ok para no revelar si el email existe o no a atacantes
  res.json({ ok: true, msg: "Tu solicitud ha sido enviada al administrador." });
});

export default router;