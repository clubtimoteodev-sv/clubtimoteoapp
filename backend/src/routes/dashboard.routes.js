import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { buildTerritoryWhere } from "../utils/territory.js";

const router = Router();

router.use(auth);

router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const whereClause = buildTerritoryWhere(req);

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
      // 1. Conteo de exploradores de la iglesia
      prisma.explorer.count({
        where: whereClause
      }),

      // 2. Reuniones del mes de la iglesia
      prisma.meeting.findMany({
        where: {
          ...whereClause,
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

      // 3. ✅ FIX P1: Movimientos financieros filtrados por mes actual (ya no se suman todos los históricos)
      prisma.financeMovement.findMany({
        where: {
          ...whereClause,
          date: { gte: monthStart, lt: nextMonthStart }
        }
      }),

      // 4. Asistencia a grupos de servicio de la iglesia
      prisma.serviceAttendance.count({
        where: {
          group: {
             ...whereClause // Filtramos por la relación del grupo
          },
          takenAt: {
            gte: monthStart,
            lt: nextMonthStart
          }
        }
      }),

      // 5. Próximas reuniones de la iglesia
      prisma.meeting.findMany({
        where: {
          ...whereClause,
          date: {
            gte: now
          }
        },
        orderBy: {
          date: "asc"
        },
        take: 3,
        select: {
          id: true,
          date: true,
          type: true
        }
      }),

      // 6. Exploradores recientes de la iglesia
      prisma.explorer.findMany({
        where: whereClause,
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

      // 7. Última reunión de la iglesia
      prisma.meeting.findFirst({
        where: whereClause,
        orderBy: {
          date: "desc"
        },
        include: {
          records: true
        }
      }),

      // 8. Movimientos financieros recientes de la iglesia
      prisma.financeMovement.findMany({
        where: whereClause,
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