import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { buildTerritoryWhere, requireNotTerritorial } from "../utils/territory.js";

const router = Router();
router.use(auth);

const createServiceGroupSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  memberIds: z.array(z.string().min(1)).min(1),
});

router.get("/", async (req, res) => {
  try {
    const groups = await prisma.serviceGroup.findMany({
      where: buildTerritoryWhere(req),
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

    const group = await prisma.serviceGroup.findFirst({
      where: { 
        id,
        ...buildTerritoryWhere(req)
      },
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

    // SEGURIDAD: Verificar que el grupo exista y pertenezca a la iglesia o territorio
    if (!group) {
      return res.status(404).json({ msg: "Grupo no encontrado o no tienes permiso" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error getting service group:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", requireNotTerritorial, async (req, res) => {
  try {
    const parsed = createServiceGroupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { date, day, memberIds } = parsed.data;

    // Verificar que los exploradores existan Y PERTENEZCAN a la misma iglesia
    const explorers = await prisma.explorer.findMany({
      where: {
        id: { in: memberIds },
        destacamentoId: req.user.destacamentoId
      },
      select: { id: true },
    });

    if (explorers.length !== memberIds.length) {
      return res.status(400).json({ msg: "Uno o más exploradores no existen en tu iglesia" });
    }

    const group = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.serviceGroup.create({
        data: {
          date: new Date(date),
          day,
          destacamentoId: req.user.destacamentoId // ASIGNACIÓN: Sella el grupo con la iglesia
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

router.patch("/:id", requireNotTerritorial, async (req, res) => {
  try {
    const id = req.params.id;

    const parsed = createServiceGroupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { date, day, memberIds } = parsed.data;

    // SEGURIDAD: Verificar propiedad antes de actualizar
    const existing = await prisma.serviceGroup.findFirst({
      where: { id, destacamentoId: req.user.destacamentoId },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Grupo no encontrado o sin permiso" });
    }
    
     // Verificar exploradores de nuevo
    const explorers = await prisma.explorer.findMany({
      where: {
        id: { in: memberIds },
        destacamentoId: req.user.destacamentoId
      },
      select: { id: true },
    });

    if (explorers.length !== memberIds.length) {
       return res.status(400).json({ msg: "Uno o más exploradores no existen en tu iglesia" });
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

router.delete("/:id", requireNotTerritorial, async (req, res) => {
  try {
    const id = req.params.id;

    // SEGURIDAD: Verificar propiedad antes de borrar
    const existing = await prisma.serviceGroup.findFirst({
      where: { id, destacamentoId: req.user.destacamentoId },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Grupo no encontrado o sin permiso" });
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