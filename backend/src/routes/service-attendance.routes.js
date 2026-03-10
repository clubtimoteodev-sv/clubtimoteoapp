import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const saveAttendanceSchema = z.object({
  groupId: z.string().min(1),
  serviceNotes: z.string().optional().nullable(),
  members: z.array(
    z.object({
      explorerId: z.string().min(1),
      present: z.boolean(),
      note: z.string().optional().nullable(),
    })
  ).min(1),
});

router.get("/group/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const records = await prisma.serviceAttendance.findMany({
      where: { groupId },
      orderBy: { takenAt: "desc" },
      include: {
        members: {
          include: {
            explorer: true,
          },
        },
        group: true,
      },
    });

    res.json(records);
  } catch (error) {
    console.error("Error getting service attendance by group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const record = await prisma.serviceAttendance.findUnique({
      where: { id: req.params.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                explorer: true,
              },
            },
          },
        },
        members: {
          include: {
            explorer: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error getting service attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = saveAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { groupId, serviceNotes, members } = parsed.data;

    const group = await prisma.serviceGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    const groupMemberIds = new Set(group.members.map((m) => m.explorerId));
    const invalidMember = members.find((m) => !groupMemberIds.has(m.explorerId));

    if (invalidMember) {
      return res.status(400).json({ msg: "Hay miembros que no pertenecen al grupo" });
    }

    const created = await prisma.$transaction(async (tx) => {
      const attendance = await tx.serviceAttendance.create({
        data: {
          groupId,
          serviceNotes: serviceNotes || null,
        },
      });

      await tx.serviceAttendanceMember.createMany({
        data: members.map((member) => ({
          attendanceId: attendance.id,
          explorerId: member.explorerId,
          present: member.present,
          note: member.note || null,
        })),
        skipDuplicates: true,
      });

      return tx.serviceAttendance.findUnique({
        where: { id: attendance.id },
        include: {
          group: true,
          members: {
            include: {
              explorer: true,
            },
          },
        },
      });
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating service attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const attendanceId = req.params.id;

    const parsed = saveAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { groupId, serviceNotes, members } = parsed.data;

    const existing = await prisma.serviceAttendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.serviceAttendance.update({
        where: { id: attendanceId },
        data: {
          groupId,
          serviceNotes: serviceNotes || null,
        },
      });

      await tx.serviceAttendanceMember.deleteMany({
        where: { attendanceId },
      });

      await tx.serviceAttendanceMember.createMany({
        data: members.map((member) => ({
          attendanceId,
          explorerId: member.explorerId,
          present: member.present,
          note: member.note || null,
        })),
        skipDuplicates: true,
      });

      return tx.serviceAttendance.findUnique({
        where: { id: attendanceId },
        include: {
          group: true,
          members: {
            include: {
              explorer: true,
            },
          },
        },
      });
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating service attendance:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;