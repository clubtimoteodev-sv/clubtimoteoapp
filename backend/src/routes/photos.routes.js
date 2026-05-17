/**
 * /api/explorers/photo — Rutas de Fotos de Perfil Seguras
 *
 * POST /api/explorers/:id/photo   — Subir/reemplazar foto de perfil
 * GET  /api/explorers/photo/:publicId — Obtener URL firmada temporal (10 min)
 *
 * Permisos:
 *   - superadmin       → acceso total
 *   - lider_destacamento → solo sus propios exploradores (mismo destacamentoId)
 *   - Otros roles → 403
 */
import { Router } from "express";
import multer from "multer";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import {
  uploadExplorerPhoto,
  generateSignedUrl,
  deleteExplorerPhoto,
} from "../utils/cloudinary.js";

const router = Router();
router.use(auth);

// ── Multer en memoria (sin disco) — máx 8 MB, solo imágenes ──────────────────
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Tipo de archivo no permitido. Solo imágenes (jpg, png, webp, heic)."));
  },
});

// ── Guard RBAC: solo superadmin y lider_destacamento ─────────────────────────
function canManagePhotos(req, res, next) {
  const { role } = req.user;
  if (role === "superadmin" || role === "lider_destacamento") return next();
  return res.status(403).json({ msg: "Sin permisos para gestionar fotos de perfil." });
}

// ── Guard: el lider_destacamento solo accede a su propio destacamento ──────────
async function canAccessExplorer(req, res, next) {
  try {
    const { role, destacamentoId } = req.user;
    const explorerId = req.params.id || req.params.explorerId;

    if (role === "superadmin") return next();

    const explorer = await prisma.explorer.findUnique({
      where: { id: explorerId },
      select: { id: true, nombre: true, apellidos: true, destacamentoId: true },
    });

    if (!explorer) return res.status(404).json({ msg: "Explorador no encontrado." });
    if (explorer.destacamentoId !== destacamentoId) {
      return res.status(403).json({ msg: "No puedes gestionar fotos de exploradores de otro destacamento." });
    }

    req.targetExplorer = explorer;
    next();
  } catch (err) {
    console.error("[photos] canAccessExplorer:", err);
    res.status(500).json({ msg: "Error de autorización." });
  }
}

// ── POST /api/explorers/:id/photo — Subir/reemplazar foto ─────────────────────
router.post(
  "/:id/photo",
  canManagePhotos,
  canAccessExplorer,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ msg: "No se recibió ninguna imagen." });

      const explorer = req.targetExplorer || await prisma.explorer.findUnique({
        where: { id: req.params.id },
        select: { id: true, nombre: true, apellidos: true, destacamentoId: true, fotoUrl: true },
      });

      // Obtener el código del destacamento para la ruta de carpeta
      const destacamento = await prisma.destacamento.findUnique({
        where: { id: explorer.destacamentoId },
        select: { codigo: true },
      });

      if (!destacamento) return res.status(404).json({ msg: "Destacamento no encontrado." });

      // Usamos el ID del explorador como public_id base — evita duplicados
      const result = await uploadExplorerPhoto(
        req.file.buffer,
        destacamento.codigo,
        explorer.id
      );

      // Actualizar la URL en la DB (guardamos el public_id de Cloudinary con su versión para cache busting)
      const versionedPublicId = result.version ? `v${result.version}/${result.public_id}` : result.public_id;
      
      const updated = await prisma.explorer.update({
        where: { id: explorer.id },
        data:  { fotoUrl: versionedPublicId },
      });

      // ── Registro de auditoría ────────────────────────────────────────────────
      await prisma.auditLog.create({
        data: {
          userId:   req.user.id,
          action:   `Foto de perfil actualizada: ${explorer.nombre} ${explorer.apellidos}`,
          endpoint: `/api/explorers/${explorer.id}/photo`,
          method:   "POST",
          payload:  JSON.stringify({
            explorerId:      explorer.id,
            publicId:        versionedPublicId,
            destacamentoCod: destacamento.codigo,
          }),
        },
      }).catch(err => console.error("[Audit] photo upload:", err));

      res.json({
        ok:       true,
        publicId: versionedPublicId,
        // URL de vista previa por 10 min
        signedUrl: generateSignedUrl(versionedPublicId),
      });
    } catch (err) {
      console.error("[photos] upload:", err);
      if (err.message?.includes("Tipo de archivo")) {
        return res.status(400).json({ msg: err.message });
      }
      res.status(500).json({ msg: "Error al subir la foto." });
    }
  }
);

// ── GET /api/explorers/photo/:publicId(*) — URL firmada temporal (10 min) ──────
// Nota: publicId puede tener slashes, por eso usamos "*" wildcard
router.get("/photo/:publicId(*)", canManagePhotos, async (req, res) => {
  try {
    const rawPublicId = req.params.publicId;

    let cleanPublicId = rawPublicId;
    if (cleanPublicId.match(/^v\d+\//)) {
      cleanPublicId = cleanPublicId.replace(/^v\d+\//, '');
    }

    // Validar que el publicId sigue el patrón de nuestro sistema
    if (!cleanPublicId.startsWith("club-timoteo/destacamentos/")) {
      return res.status(400).json({ msg: "public_id inválido." });
    }

    // Extraer el código del destacamento del publicId para validar permisos
    // Formato: club-timoteo/destacamentos/{codigo}/perfiles/{explorerId}
    const parts = cleanPublicId.split("/");
    if (parts.length < 5) return res.status(400).json({ msg: "public_id malformado." });

    const codigoDestacamento = parts[2];

    // lider_destacamento: verificar que pertenece a su destacamento
    if (req.user.role === "lider_destacamento") {
      const myDestacamento = await prisma.destacamento.findUnique({
        where: { id: req.user.destacamentoId },
        select: { codigo: true },
      });
      if (!myDestacamento || myDestacamento.codigo !== codigoDestacamento) {
        return res.status(403).json({ msg: "No tienes acceso a fotos de este destacamento." });
      }
    }

    // Obtener el nombre del explorador para el log (best-effort)
    let explorerName = "Explorador desconocido";
    try {
      const explorerId = parts[4];
      const exp = await prisma.explorer.findUnique({
        where: { id: explorerId },
        select: { nombre: true, apellidos: true },
      });
      if (exp) explorerName = `${exp.nombre} ${exp.apellidos}`;
    } catch (_) { /* no-op */ }

    // Generar URL firmada con expiración de 10 minutos
    const signedUrl = generateSignedUrl(rawPublicId);

    // ── Registro de auditoría (acceso a foto privada) - DESHABILITADO PARA NO ENSUCIAR LOS LOGS ──
    /*
    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   `Acceso a foto privada de ${explorerName}`,
        endpoint: `/api/explorers/photo/${rawPublicId}`,
        method:   "GET",
        payload:  JSON.stringify({ publicId: rawPublicId, codigoDestacamento }),
      },
    }).catch(err => console.error("[Audit] photo view:", err));
    */

    res.json({ signedUrl, expiresIn: 600 });
  } catch (err) {
    console.error("[photos] signed-url:", err);
    res.status(500).json({ msg: "Error al generar la URL firmada." });
  }
});

// ── DELETE /api/explorers/:id/photo — Eliminar foto ──────────────────────────
router.delete("/:id/photo", canManagePhotos, canAccessExplorer, async (req, res) => {
  try {
    const explorer = await prisma.explorer.findUnique({
      where: { id: req.params.id },
      select: { id: true, nombre: true, apellidos: true, fotoUrl: true },
    });

    if (!explorer) return res.status(404).json({ msg: "Explorador no encontrado." });
    if (!explorer.fotoUrl) return res.status(400).json({ msg: "El explorador no tiene foto." });

    await deleteExplorerPhoto(explorer.fotoUrl);

    await prisma.explorer.update({
      where: { id: explorer.id },
      data:  { fotoUrl: null },
    });

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   `Foto de perfil eliminada: ${explorer.nombre} ${explorer.apellidos}`,
        endpoint: `/api/explorers/${explorer.id}/photo`,
        method:   "DELETE",
        payload:  JSON.stringify({ explorerId: explorer.id, publicId: explorer.fotoUrl }),
      },
    }).catch(err => console.error("[Audit] photo delete:", err));

    res.json({ ok: true });
  } catch (err) {
    console.error("[photos] delete:", err);
    res.status(500).json({ msg: "Error al eliminar la foto." });
  }
});

// ── Multer error handler ───────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Tipo de archivo")) {
    return res.status(400).json({ msg: err.message });
  }
  // "Request aborted" ocurre cuando el cliente cancela la conexión (ej: error previo
  // en la misma petición). No es un fallo del servidor, se ignora silenciosamente.
  if (err.message === "Request aborted") {
    return res.headersSent ? undefined : res.status(499).end();
  }
  console.error("[photos] unhandled:", err);
  res.status(500).json({ msg: "Error en el módulo de fotos." });
});

export default router;
