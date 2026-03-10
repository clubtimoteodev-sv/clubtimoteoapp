import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const createServiceGroupSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  memberIds: z.array(z.string().min(1)).min(1),
});

router.get("/", async (_req, res) => {
  try {
    const groups = await prisma.serviceGroup.findMany({
      orderBy: { date: "desc" },
      include: {
        members: {
          include: {
            explorer: true,
          },
        },
      },
    });

    res.json(groups);
  } catch (error) {
    console.error("Error getting service groups:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const group = await prisma.serviceGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            explorer: true,
          },
        },
        attendances: {
          include: {
            members: {
              include: {
                explorer: true,
              },
            },
          },
          orderBy: { takenAt: "desc" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error getting service group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = createServiceGroupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { date, day, memberIds } = parsed.data;

    const explorers = await prisma.explorer.findMany({
      where: {
        id: { in: memberIds },
      },
      select: { id: true },
    });

    if (explorers.length !== memberIds.length) {
      return res.status(400).json({ msg: "Uno o más exploradores no existen" });
    }

    const group = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.serviceGroup.create({
        data: {
          date: new Date(date),
          day,
        },
      });

      await tx.serviceGroupMember.createMany({
        data: memberIds.map((explorerId) => ({
          groupId: createdGroup.id,
          explorerId,
        })),
        skipDuplicates: true,
      });

      return tx.serviceGroup.findUnique({
        where: { id: createdGroup.id },
        include: {
          members: {
            include: {
              explorer: true,
            },
          },
        },
      });
    });

    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating service group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const parsed = createServiceGroupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { date, day, memberIds } = parsed.data;

    const existing = await prisma.serviceGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.serviceGroup.update({
        where: { id },
        data: {
          date: new Date(date),
          day,
        },
      });

      await tx.serviceGroupMember.deleteMany({
        where: { groupId: id },
      });

      await tx.serviceGroupMember.createMany({
        data: memberIds.map((explorerId) => ({
          groupId: id,
          explorerId,
        })),
        skipDuplicates: true,
      });

      return tx.serviceGroup.findUnique({
        where: { id },
        include: {
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
    console.error("Error updating service group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.serviceGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    await prisma.serviceGroup.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting service group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;