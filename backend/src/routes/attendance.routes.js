import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { buildTerritoryWhere, requireNotTerritorial } from "../utils/territory.js";

const router = Router();
router.use(auth);

const saveAttendanceSchema = z.object({
  meetingId: z.string().optional(),
  date: z.string().optional(),
  meetingType: z.string().optional(),
  records: z.array(
    z.object({
      explorerId: z.string().min(1),
      attended: z.boolean(),
      justification: z.string().optional().nullable()
    })
  ).min(1)
});

router.get("/meetings", async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: buildTerritoryWhere(req), 
      include: {
        destacamento: true,
        records: {
          include: {
            explorer: true
          }
        }
      },
      orderBy: { date: "desc" }
    });

    res.json(meetings);
  } catch (error) {
    console.error("Error getting meetings:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/meetings/:id", async (req, res) => {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: { 
        id: req.params.id,
        ...buildTerritoryWhere(req) // SEGURIDAD Y TERRITORIO
      },
      include: {
        destacamento: true,
        records: {
          include: {
            explorer: true
          }
        }
      }
    });

    if (!meeting) {
      return res.status(404).json({ msg: "Reunión no encontrada" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error getting meeting:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", requireNotTerritorial, async (req, res) => {
  try {
    const parsed = saveAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;
    let meetingId = data.meetingId;

    if (!meetingId) {
      if (!data.date || !data.meetingType) {
        return res.status(400).json({
          msg: "Si no envías meetingId, debes enviar date y meetingType"
        });
      }

      const meeting = await prisma.meeting.create({
        data: {
          date: new Date(data.date),
          type: data.meetingType,
          destacamentoId: req.user.destacamentoId // ASIGNACIÓN: Sella la reunión con la iglesia
        }
      });

      meetingId = meeting.id;
    } else {
      // Si actualiza, verificamos que la reunión sea de su iglesia
      const existing = await prisma.meeting.findFirst({
        where: { id: meetingId, destacamentoId: req.user.destacamentoId }
      });
      if (!existing) return res.status(403).json({ msg: "Acceso denegado a esta reunión" });
    }

    await prisma.attendanceRecord.deleteMany({
      where: { meetingId }
    });

    await prisma.attendanceRecord.createMany({
      data: data.records.map((record) => ({
        meetingId,
        explorerId: record.explorerId,
        attended: record.attended,
        justification: record.justification || null
      }))
    });

    const savedMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        records: {
          include: {
            explorer: true
          }
        }
      }
    });

    res.status(201).json(savedMeeting);
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/meetings/:id", requireNotTerritorial, async (req, res) => {
  try {
    const parsed = saveAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const meetingId = req.params.id;
    const data = parsed.data;

    // SEGURIDAD: Verificar propiedad
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, destacamentoId: req.user.destacamentoId }
    });
    if (!meeting) return res.status(404).json({ msg: "Reunión no encontrada" });

    await prisma.attendanceRecord.deleteMany({
      where: { meetingId }
    });

    await prisma.attendanceRecord.createMany({
      data: data.records.map((record) => ({
        meetingId,
        explorerId: record.explorerId,
        attended: record.attended,
        justification: record.justification || null
      }))
    });

    const updated = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        records: {
          include: {
            explorer: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/explorer/:explorerId", async (req, res) => {
  try {
    // SEGURIDAD: Verifica que el niño pertenezca a la iglesia o territorio
    const explorer = await prisma.explorer.findFirst({
      where: { id: req.params.explorerId, ...buildTerritoryWhere(req) }
    });
    
    if (!explorer) return res.status(404).json({ msg: "Explorador no encontrado en tu destacamento" });

    const records = await prisma.attendanceRecord.findMany({
      where: {
        explorerId: req.params.explorerId
      },
      include: {
        meeting: true,
        explorer: true
      },
      orderBy: {
        meeting: {
          date: "desc"
        }
      }
    });

    res.json(records);
  } catch (error) {
    console.error("Error getting explorer attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/meetings/:id", requireNotTerritorial, async (req, res) => {
  try {
    const meetingId = req.params.id;
    const justification = (req.body?.justification || "").trim();

    if (!justification) {
      return res.status(400).json({ msg: "La justificación es requerida para eliminar una reunión" });
    }

    // SEGURIDAD: Verificar que la reunión sea del destacamento del usuario
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, destacamentoId: req.user.destacamentoId },
      include: { destacamento: { include: { territorio: true } } }
    });
    if (!meeting) return res.status(404).json({ msg: "Reunión no encontrada o sin permiso" });

    // Obtener nombre real del usuario (fallback a BD si el JWT es antiguo)
    let deletedByName = req.user.name;
    if (!deletedByName || deletedByName === "Usuario") {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
      deletedByName = dbUser?.name || "Líder";
    }

    // 1️⃣  Guardar log ANTES de borrar (datos denormalizados)
    await prisma.meetingDeletionLog.create({
      data: {
        meetingId:        meeting.id,
        meetingType:      meeting.type,
        meetingDate:      meeting.date,
        destacamentoId:   meeting.destacamentoId,
        destacamentoName: meeting.destacamento.nombre,
        territorioId:     meeting.destacamento.territorioId || null,
        deletedById:      req.user.id,
        deletedByName,
        justification,
      }
    });

    // 2️⃣  Borrar registros y reunión
    await prisma.attendanceRecord.deleteMany({ where: { meetingId } });
    await prisma.meeting.delete({ where: { id: meetingId } });

    res.json({ msg: "Reunión eliminada correctamente" });

  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

// ── Historial de eliminaciones (accesible también al lider_territorial) ──────
router.get("/deletion-log", async (req, res) => {
  try {
    const { role, destacamentoId, territorioId } = req.user;

    let where = {};

    if (role === "admin") {
      where = {}; // ve todo
    } else if (role === "lider_territorial") {
      where = { territorioId: territorioId || undefined };
    } else {
      // lider_destacamento: solo su destacamento
      where = { destacamentoId: destacamentoId || undefined };
    }

    const logs = await prisma.meetingDeletionLog.findMany({
      where,
      orderBy: { deletedAt: "desc" },
      take: 100,
    });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching deletion log:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;