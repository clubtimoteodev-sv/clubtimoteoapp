import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { buildTerritoryWhere, requireNotTerritorial } from "../utils/territory.js";

const router = Router();
router.use(auth);

const createMeetingSchema = z.object({
  date: z.string().min(1),
  type: z.string().min(1)
});

router.get("/upcoming", async (req, res) => {
  try {
    const now = new Date();
    
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);

    const meetings = await prisma.meeting.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lt: endOfMonth
        },
        ...buildTerritoryWhere(req) // FILTRO TERRITORIO
      },
      include: {
        destacamento: true,
        _count: { select: { records: true } }
      },
      orderBy: {
        date: "asc"
      }
    });

    res.json(meetings);
  } catch (error) {
    console.error("Error getting upcoming meetings:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/meetings", requireNotTerritorial, async (req, res) => {
  try {
    const parsed = createMeetingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;

    const meeting = await prisma.meeting.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        destacamentoId: req.user.destacamentoId // ASIGNACIÓN: Etiqueta la reunión con tu iglesia
      }
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/meetings/:id", requireNotTerritorial, async (req, res) => {
  try {
    const id = req.params.id;

    // SEGURIDAD: Validar que exista y que pertenezca a la iglesia del usuario que quiere borrarla
    const existing = await prisma.meeting.findFirst({
      where: { 
        id,
        destacamentoId: req.user.destacamentoId 
      }
    });

    if (!existing) {
      return res.status(404).json({ msg: "Reunión no encontrada o no tienes permiso para borrarla" });
    }

    await prisma.meeting.delete({
      where: { id }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;