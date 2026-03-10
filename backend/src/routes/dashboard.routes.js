import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/summary", async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      explorersCount,
      meetingsThisMonth,
      allFinanceMovements,
      serviceAttendancesThisMonth,
      upcomingMeetings,
      recentExplorers,
      lastMeeting,
      recentFinanceMovements
    ] = await Promise.all([
      prisma.explorer.count(),

      prisma.meeting.findMany({
        where: {
          date: {
            gte: monthStart,
            lt: nextMonthStart
          }
        },
        include: {
          records: true
        },
        orderBy: {
          date: "desc"
        }
      }),

      prisma.financeMovement.findMany(),

      prisma.serviceAttendance.count({
        where: {
          takenAt: {
            gte: monthStart,
            lt: nextMonthStart
          }
        }
      }),

      prisma.meeting.findMany({
        where: {
          date: {
            gte: now
          }
        },
        orderBy: {
          date: "asc"
        },
        take: 5,
        select: {
          id: true,
          date: true,
          type: true
        }
      }),

      prisma.explorer.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 5,
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          createdAt: true
        }
      }),

      prisma.meeting.findFirst({
        orderBy: {
          date: "desc"
        },
        include: {
          records: true
        }
      }),

      prisma.financeMovement.findMany({
        orderBy: {
          date: "desc"
        },
        take: 5,
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          description: true,
          date: true
        }
      })
    ]);

    let attendanceAverage = 0;

    if (meetingsThisMonth.length > 0) {
      const percents = meetingsThisMonth.map((meeting) => {
        const total = meeting.records.length;
        if (!total) return 0;

        const attended = meeting.records.filter((r) => r.attended).length;
        return (attended / total) * 100;
      });

      attendanceAverage =
        percents.reduce((sum, value) => sum + value, 0) / percents.length;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (const movement of allFinanceMovements) {
      const amount = Number(movement.amount || 0);
      const type = String(movement.type || "").toLowerCase();

      if (type === "entrada" || type === "income" || type === "ingreso") {
        totalIncome += amount;
      }

      if (type === "salida" || type === "expense" || type === "gasto") {
        totalExpense += amount;
      }
    }

    const balance = totalIncome - totalExpense;

    let lastMeetingSummary = null;

    if (lastMeeting) {
      const total = lastMeeting.records.length;
      const attended = lastMeeting.records.filter((r) => r.attended).length;
      const absent = total - attended;
      const percent = total > 0 ? (attended / total) * 100 : 0;

      lastMeetingSummary = {
        id: lastMeeting.id,
        date: lastMeeting.date,
        type: lastMeeting.type,
        total,
        attended,
        absent,
        percent: Number(percent.toFixed(1))
      };
    }

    res.json({
      explorersCount,
      monthlyAttendanceAverage: Number(attendanceAverage.toFixed(1)),
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      balance: Number(balance.toFixed(2)),
      serviceAttendancesThisMonth,

      upcomingMeetings,
      recentExplorers,
      lastMeetingSummary,
      recentFinanceMovements: recentFinanceMovements.map((m) => ({
        ...m,
        amount: Number(m.amount)
      }))
    });
  } catch (error) {
    console.error("dashboard summary error:", error);
    res.status(500).json({
      message: "Error obteniendo resumen del dashboard"
    });
  }
});

export default router;