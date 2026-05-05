import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { exec, execSync } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const execAsync = promisify(exec);

let PG_DUMP_BIN = "pg_dump";
try {
  PG_DUMP_BIN = execSync("which pg_dump").toString().trim();
} catch {
  console.warn("[admin] pg_dump no encontrado en PATH");
}

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(auth, requireAdmin);

// ── GET /users ────────────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        isLocked: true, failedLoginAttempts: true, createdAt: true,
        destacamento: { select: { id: true, nombre: true, ciudad: true } },
        territorio: { select: { id: true, nombre: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (err) {
    console.error("admin/users:", err);
    res.status(500).json({ msg: "Error al obtener usuarios" });
  }
});

// ── POST /users — Crear usuario con cualquier rol ─────────────────────────────
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, destacamentoId, territorioId } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ msg: "name, email, password y role son requeridos" });

    const VALID_ROLES = ["admin", "lider_territorial", "superadmin", "lider_destacamento"];
    if (!VALID_ROLES.includes(role))
      return res.status(400).json({ msg: `Rol inválido. Válidos: ${VALID_ROLES.join(", ")}` });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ msg: "El email ya está en uso" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hash, role,
        destacamentoId: destacamentoId || null,
        territorioId: territorioId || null },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || req.userId || "UNKNOWN",
          action: `Usuario creado: ${email} (${role})`,
          endpoint: "/api/admin/users", method: "POST",
          payload: JSON.stringify({ name, email, role })
        }
      });
    } catch (auditErr) { console.error("[AuditLog]", auditErr); }
    res.status(201).json(user);
  } catch (err) {
    console.error("admin/create-user:", err);
    res.status(500).json({ msg: "Error al crear usuario" });
  }
});

// ── POST /users/:id/unlock ────────────────────────────────────────────────────
router.post("/users/:id/unlock", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id }, data: { isLocked: false, failedLoginAttempts: 0 }
    });
    await prisma.auditLog.create({ data: {
      userId: req.user.id, action: `Cuenta desbloqueada: ${user.email}`,
      endpoint: `/api/admin/users/${id}/unlock`, method: "POST",
      payload: JSON.stringify({ targetUserId: id })
    }});
    await prisma.adminNotification.updateMany({
      where: { metadata: { path: ["userId"], equals: id }, read: false },
      data: { read: true }
    });
    res.json({ ok: true, msg: "Usuario desbloqueado correctamente" });
  } catch (err) {
    console.error("admin/unlock:", err);
    res.status(500).json({ msg: "Error al desbloquear usuario" });
  }
});

// ── POST /users/:id/reset-password ───────────────────────────────────────────
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
    if (!target) return res.status(404).json({ msg: "Usuario no encontrado." });

    // Contraseña temporal segura y memorable
    const tempPassword = `Timoteo${new Date().getFullYear()}!`;

    const hash = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({
      where: { id },
      data: {
        password: hash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        isLocked: false          // Desbloquear si estaba bloqueado
      }
    });

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   `Contraseña reseteada por administrador para usuario ${target.email}`,
        endpoint: `/api/admin/users/${id}/reset-password`,
        method:   "POST",
        payload:  JSON.stringify({ targetUserId: id, targetEmail: target.email })
      }
    });

    res.json({
      ok: true,
      msg: `Contraseña reseteada. El usuario deberá cambiarla en su próximo inicio de sesión.`,
      tempPassword,              // Texto plano para que el admin se la entregue
      userName: target.name,
      userEmail: target.email,
    });
  } catch (err) {
    console.error("admin/reset-password:", err);
    res.status(500).json({ msg: "Error al resetear la contraseña." });
  }
});

// ── POST /users/:id/deactivate ────────────────────────────────────────────────
router.post("/users/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id)
      return res.status(400).json({ msg: "No puedes desactivar tu propia cuenta" });
    const user = await prisma.user.update({ where: { id }, data: { isLocked: true } });
    await prisma.auditLog.create({ data: {
      userId: req.user.id, action: `Cuenta desactivada por admin: ${user.email}`,
      endpoint: `/api/admin/users/${id}/deactivate`, method: "POST",
      payload: JSON.stringify({ targetUserId: id })
    }});
    res.json({ ok: true, msg: "Usuario desactivado" });
  } catch (err) {
    console.error("admin/deactivate:", err);
    res.status(500).json({ msg: "Error al desactivar usuario" });
  }
});

// ── POST /users/:id/activate ──────────────────────────────────────────────────
router.post("/users/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id }, data: { isLocked: false, failedLoginAttempts: 0 }
    });
    await prisma.auditLog.create({ data: {
      userId: req.user.id, action: `Cuenta activada por admin: ${user.email}`,
      endpoint: `/api/admin/users/${id}/activate`, method: "POST",
      payload: JSON.stringify({ targetUserId: id })
    }});
    res.json({ ok: true, msg: "Usuario activado" });
  } catch (err) {
    console.error("admin/activate:", err);
    res.status(500).json({ msg: "Error al activar usuario" });
  }
});

// ── POST /users/:id/change-password ──────────────────────────────────────────
router.post("/users/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ msg: "La contraseña debe tener al menos 6 caracteres" });

    const hash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id }, data: { password: hash, failedLoginAttempts: 0, isLocked: false }
    });
    await prisma.auditLog.create({ data: {
      userId: req.user.id, action: `Contraseña cambiada para: ${user.email}`,
      endpoint: `/api/admin/users/${id}/change-password`, method: "POST",
      payload: JSON.stringify({ targetUserId: id })
    }});
    res.json({ ok: true, msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("admin/change-password:", err);
    res.status(500).json({ msg: "Error al cambiar contraseña" });
  }
});

// ── PUT /users/:id — Editar detalles de usuario ───────────────────────────────
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, destacamentoId, territorioId } = req.body;

    if (!name || !email || !role)
      return res.status(400).json({ msg: "name, email y role son requeridos" });

    const VALID_ROLES = ["lider_territorial", "lider_destacamento"];
    if (!VALID_ROLES.includes(role))
      return res.status(400).json({ msg: `Rol inválido. Solo se permite Lider Territorial o Lider Destacamento.` });

    // Validar email único si lo está cambiando
    const existingEmail = await prisma.user.findFirst({
      where: { email, id: { not: id } }
    });
    if (existingEmail) return res.status(409).json({ msg: "El email ya está en uso por otro usuario" });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name, email, role,
        destacamentoId: destacamentoId || null,
        territorioId: territorioId || null
      }
    });

    try {
      await prisma.auditLog.create({ data: {
        userId: req.user?.id || req.userId || "UNKNOWN", action: `Usuario editado: ${email}`,
        endpoint: `/api/admin/users/${id}`, method: "PUT",
        payload: JSON.stringify({ name, email, role, destacamentoId, territorioId })
      }});
    } catch (auditErr) { console.error("[AuditLog]", auditErr); }

    res.json(updatedUser);
  } catch (err) {
    console.error("admin/edit-user:", err);
    res.status(500).json({ msg: "Error al editar usuario" });
  }
});

// ── GET /catalog/territories ──────────────────────────────────────────────────
router.get("/catalog/territories", async (req, res) => {
  try {
    const territories = await prisma.territorio.findMany({
      select: { id: true, nombre: true }, orderBy: { nombre: "asc" }
    });
    res.json(territories);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener territorios" });
  }
});

// ── POST /catalog/territories ─────────────────────────────────────────────────
router.post("/catalog/territories", async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });

    const exists = await prisma.territorio.findUnique({ where: { nombre } });
    if (exists) return res.status(409).json({ msg: "El territorio ya existe" });

    const newTerritorio = await prisma.territorio.create({ data: { nombre } });

    try {
      await prisma.auditLog.create({ data: {
        userId: req.user?.id || req.userId || "UNKNOWN", action: `Territorio creado: ${nombre}`,
        endpoint: "/api/admin/catalog/territories", method: "POST",
        payload: JSON.stringify({ nombre })
      }});
    } catch (auditErr) {
      console.error("[AuditLog Error]", auditErr);
    }

    res.status(201).json(newTerritorio);
  } catch (err) {
    console.error("Error en POST /catalog/territories:", err);
    res.status(500).json({ msg: "Error al crear territorio" });
  }
});

// ── GET /catalog/destacamentos ────────────────────────────────────────────────
router.get("/catalog/destacamentos", async (req, res) => {
  try {
    const destacamentos = await prisma.destacamento.findMany({
      select: { id: true, codigo: true, nombre: true, ciudad: true, territorioId: true },
      orderBy: { nombre: "asc" }
    });
    res.json(destacamentos);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener destacamentos" });
  }
});

// ── POST /catalog/destacamentos ───────────────────────────────────────────────
router.post("/catalog/destacamentos", async (req, res) => {
  try {
    const { codigo, nombre, ciudad, territorioId } = req.body;
    if (!codigo || !nombre || !territorioId) return res.status(400).json({ msg: "Código, nombre y territorio son requeridos" });

    const exists = await prisma.destacamento.findUnique({ where: { codigo } });
    if (exists) return res.status(409).json({ msg: "El código de destacamento ya existe" });

    const newDestacamento = await prisma.destacamento.create({
      data: { codigo, nombre, ciudad, territorioId }
    });

    try {
      await prisma.auditLog.create({ data: {
        userId: req.user?.id || req.userId || "UNKNOWN", action: `Destacamento creado: ${nombre}`,
        endpoint: "/api/admin/catalog/destacamentos", method: "POST",
        payload: JSON.stringify({ codigo, nombre, territorioId })
      }});
    } catch (auditErr) {
      console.error("[AuditLog Error]", auditErr);
    }

    res.status(201).json(newDestacamento);
  } catch (err) {
    console.error("Error en POST /catalog/destacamentos:", err);
    res.status(500).json({ msg: "Error al crear destacamento" });
  }
});

// ── PUT /catalog/destacamentos/:id ─────────────────────────────────────────────
router.put("/catalog/destacamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, ciudad, territorioId } = req.body;
    if (!codigo || !nombre || !territorioId) return res.status(400).json({ msg: "Código, nombre y territorio son requeridos" });

    const exists = await prisma.destacamento.findFirst({ where: { codigo, id: { not: id } } });
    if (exists) return res.status(409).json({ msg: "El código de destacamento ya está en uso" });

    const updated = await prisma.destacamento.update({
      where: { id },
      data: { codigo, nombre, ciudad, territorioId }
    });

    try {
      await prisma.auditLog.create({ data: {
        userId: req.user?.id || req.userId || "UNKNOWN", action: `Destacamento editado: ${nombre}`,
        endpoint: `/api/admin/catalog/destacamentos/${id}`, method: "PUT",
        payload: JSON.stringify({ codigo, nombre, territorioId })
      }});
    } catch (auditErr) { console.error("[AuditLog]", auditErr); }

    res.json(updated);
  } catch (err) {
    console.error("Error PUT /catalog/destacamentos:", err);
    res.status(500).json({ msg: "Error al editar destacamento" });
  }
});

// ── GET /audit ────────────────────────────────────────────────────────────────
router.get("/audit", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.method) where.method = req.query.method.toUpperCase();

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit,
        include: { user: { select: { name: true, email: true, role: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);
    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("admin/audit:", err);
    res.status(500).json({ msg: "Error al obtener auditoría" });
  }
});

// ── GET /notifications ────────────────────────────────────────────────────────
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" }, take: 30
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener notificaciones" });
  }
});

// ── POST /notifications/:id/read ──────────────────────────────────────────────
router.post("/notifications/:id/read", async (req, res) => {
  try {
    await prisma.adminNotification.update({
      where: { id: req.params.id }, data: { read: true }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al marcar notificación" });
  }
});

// ── GET /backup/export ────────────────────────────────────────────────────────
router.get("/backup/export", async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup_clubtimoteo_${timestamp}.json`;
  const tmpDir = path.join(os.tmpdir(), "clubtimoteo_backups");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, filename);

  try {
    const backupData = {};
    const modelNames = Object.keys(prisma).filter(
      key => !key.startsWith('_') && !key.startsWith('$') && typeof prisma[key].findMany === 'function'
    );

    for (const modelName of modelNames) {
      backupData[modelName] = await prisma[modelName].findMany();
    }

    const jsonString = JSON.stringify(backupData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    fs.writeFileSync(filePath, jsonString, 'utf-8');

    try {
      await prisma.auditLog.create({ data: {
        userId: req.user?.id || req.userId || "UNKNOWN", action: `Backup JSON generado: ${filename}`,
        endpoint: "/api/admin/backup/export", method: "GET",
        payload: JSON.stringify({ filename })
      }});
    } catch (auditErr) { console.error("[AuditLog Error]", auditErr); }

    await prisma.backupLog.create({ data: { filename, generatedById: req.user?.id || req.userId || "UNKNOWN" } });
    
    res.download(filePath, filename, (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (err) console.error("Error descargando backup:", err);
    });
  } catch (err) {
    console.error("backup/export:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ msg: "Error al generar el backup en formato JSON." });
  }
});

// ── GET /backup/history ───────────────────────────────────────────────────────
router.get("/backup/history", async (req, res) => {
  try {
    const history = await prisma.backupLog.findMany({
      orderBy: { createdAt: "desc" }, take: 50,
      include: { generatedBy: { select: { name: true, email: true } } }
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener historial de backups" });
  }
});

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [blockedCount, totalUsers, unreadNotifications, recentLogs, lastBackup] = await Promise.all([
      prisma.user.count({ where: { isLocked: true } }),
      prisma.user.count(),
      prisma.adminNotification.count({ where: { read: false } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.backupLog.findFirst({
        orderBy: { createdAt: "desc" },
        include: { generatedBy: { select: { name: true } } }
      })
    ]);
    res.json({ blockedCount, totalUsers, unreadNotifications, recentLogs, lastBackup });
  } catch (err) {
    console.error("admin/stats:", err);
    res.status(500).json({ msg: "Error al obtener estadísticas" });
  }
});

export default router;
