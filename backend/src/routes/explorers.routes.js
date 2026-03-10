import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const createSchema = z.object({
  codigoExplorador: z.string().min(1),
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

router.get("/", async (_req, res) => {
  try {
    const list = await prisma.explorer.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json(list);
  } catch (error) {
    console.error("Error getting explorers:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const explorer = await prisma.explorer.findUnique({
      where: { id }
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
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;

    const explorer = await prisma.explorer.create({
      data: {
        ...data,
        fechaNacimiento: new Date(data.fechaNacimiento)
      }
    });

    res.status(201).json(explorer);
  } catch (error) {
    console.error("Error creating explorer:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const parsed = createSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const patch = { ...parsed.data };

    if (patch.fechaNacimiento) {
      patch.fechaNacimiento = new Date(patch.fechaNacimiento);
    }

    const existing = await prisma.explorer.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ msg: "No encontrado" });
    }

    const updated = await prisma.explorer.update({
      where: { id },
      data: patch
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating explorer:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.explorer.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ msg: "No encontrado" });
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