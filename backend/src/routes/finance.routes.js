import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const movementSchema = z.object({
  type: z.enum(["entrada", "salida"]),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  recipient: z.string().min(1),
  receiptUrl: z.string().optional().nullable(),
});

router.get("/", async (req, res) => {
  try {
    const { type, category, startDate, endDate, q } = req.query;

    const where = {};

    if (type && type !== "all") {
      where.type = type;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [
        { description: { contains: term, mode: "insensitive" } },
        { recipient: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
      ];
    }

    const movements = await prisma.financeMovement.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    res.json(movements);
  } catch (error) {
    console.error("Error getting finance movements:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movement = await prisma.financeMovement.findUnique({
      where: { id: req.params.id },
    });

    if (!movement) {
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    res.json(movement);
  } catch (error) {
    console.error("Error getting finance movement:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = movementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;

    const movement = await prisma.financeMovement.create({
      data: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        recipient: data.recipient,
        receiptUrl: data.receiptUrl || null,
      },
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error("Error creating finance movement:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = movementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const existing = await prisma.financeMovement.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    const data = parsed.data;

    const updated = await prisma.financeMovement.update({
      where: { id: req.params.id },
      data: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        recipient: data.recipient,
        receiptUrl: data.receiptUrl || null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating finance movement:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.financeMovement.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    await prisma.financeMovement.delete({
      where: { id: req.params.id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting finance movement:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

export default router;