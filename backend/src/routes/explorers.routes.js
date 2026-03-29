import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

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

  nombreResponsable: z.string().min(1),
  telefonoResponsable: z.string().min(1),

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
    console.log("1. Usuario leyendo token:", req.user); // Veremos si el token trae el destacamentoId
    
    const destacamentoId = req.user.destacamentoId;
    
    const list = await prisma.explorer.findMany({
      where: { destacamentoId },
      orderBy: { createdAt: "desc" }
    });

    console.log(`2. Se encontraron ${list.length} exploradores para la iglesia ${destacamentoId}`); // Veremos cuántos niños encontró Prisma
    
    res.json(list);
  } catch (error) {
    console.error("Error getting explorers:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const destacamentoId = req.user.destacamentoId;

    const explorer = await prisma.explorer.findUnique({
      where: { 
        id,
        destacamentoId 
      }
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

router.post("/", async (req, res) => {
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

router.patch("/:id", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
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