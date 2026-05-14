import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { buildTerritoryWhere, requireNotTerritorial } from "../utils/territory.js";
import { generateSignedUrlThumb } from "../utils/cloudinary.js";

const router = Router();
router.use(auth);

const createSchema = z.object({
  codigoInterno: z.string().min(1),
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  fechaNacimiento: z.string(),
  direccion: z.string().min(1),
  telefono: z.string().min(1),

  alergias: z.string().optional().nullable(),
  medicinaControlada: z.string().optional().nullable(),
  estudia: z.boolean(),
  nivelEducativo: z.string().optional().nullable(),

  nombreResponsable: z.string().optional().nullable(),
  telefonoResponsable: z.string().optional().nullable(),

  aceptoCristo: z.boolean(),
  bautizado: z.boolean(),
  asisteCelula: z.boolean(),
  nombreLiderCelula: z.string().optional().nullable(),

  fotoUrl: z.string().optional().nullable(),
  recetaUrl: z.string().optional().nullable(),
  permisoUrl: z.string().optional().nullable()
});

router.get("/", async (req, res) => {
  try {
    const whereClause = buildTerritoryWhere(req);
    
    const list = await prisma.explorer.findMany({
      where: whereClause,
      include: { destacamento: true },
      orderBy: { createdAt: "desc" }
    });


    const listWithThumbs = list.map(exp => ({
      ...exp,
      fotoUrlThumb: exp.fotoUrl ? generateSignedUrlThumb(exp.fotoUrl) : null
    }));

    res.json(listWithThumbs);
  } catch (error) {
    console.error("Error getting explorers:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const whereClause = buildTerritoryWhere(req);

    const explorer = await prisma.explorer.findFirst({
      where: { 
        id,
        ...whereClause
      },
      include: { destacamento: true }
    });

    if (!explorer) {
      return res.status(404).json({ msg: "Explorador no encontrado" });
    }

    res.json(explorer);
  } catch (error) {
    console.error("Error getting explorer:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", requireNotTerritorial, async (req, res) => {
  try {
    const destacamentoId = req.user.destacamentoId;
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;

    const explorer = await prisma.explorer.create({
      data: {
        ...data,
        fechaNacimiento: new Date(data.fechaNacimiento),
        destacamentoId // Se asigna automáticamente la iglesia del usuario
      }
    });

    res.status(201).json(explorer);
  } catch (error) {
    console.error("Error creating explorer:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ msg: "El código interno ya existe en este destacamento" });
    }
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/:id", requireNotTerritorial, async (req, res) => {
  try {
    const id = req.params.id;
    const destacamentoId = req.user.destacamentoId;

    const parsed = createSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const patch = { ...parsed.data };

    if (patch.fechaNacimiento) {
      patch.fechaNacimiento = new Date(patch.fechaNacimiento);
    }

    const existing = await prisma.explorer.findUnique({
      where: { 
        id,
        destacamentoId 
      }
    });

    if (!existing) {
      return res.status(404).json({ msg: "No encontrado o no pertenece a este destacamento" });
    }

    const updated = await prisma.explorer.update({
      where: { id },
      data: patch
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating explorer:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ msg: "El código interno ya existe" });
    }
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/:id", requireNotTerritorial, async (req, res) => {
  try {
    const id = req.params.id;
    const destacamentoId = req.user.destacamentoId;

    const existing = await prisma.explorer.findUnique({
      where: { 
        id,
        destacamentoId
      }
    });

    if (!existing) {
      return res.status(404).json({ msg: "No encontrado o no pertenece a este destacamento" });
    }

    await prisma.explorer.delete({
      where: { id }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting explorer:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;