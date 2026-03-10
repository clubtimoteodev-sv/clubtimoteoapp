import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

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

router.get("/meetings", async (_req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
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
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
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

router.post("/", async (req, res) => {
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
          type: data.meetingType
        }
      });

      meetingId = meeting.id;
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

router.patch("/meetings/:id", async (req, res) => {
  try {
    const parsed = saveAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const meetingId = req.params.id;
    const data = parsed.data;

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

export default router;