import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/destacamentos", async (req, res) => {
  try {
    if (req.user.role !== "lider_territorial") {
      return res.status(403).json({ msg: "Acceso denegado: Se requiere rol de líder territorial" });
    }

    if (!req.user.territorioId) {
      return res.status(400).json({ msg: "El usuario no tiene un territorio asignado" });
    }

    const destacamentos = await prisma.destacamento.findMany({
      where: {
        territorioId: req.user.territorioId
      },
      orderBy: {
        codigo: "asc"
      },
      include: {
        _count: {
          select: { explorers: true }
        },
        meetings: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true, type: true }
        }
      }
    });

    res.json(destacamentos);
  } catch (error) {
    console.error("Error getting territorio destacamentos:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    if (req.user.role !== "lider_territorial") {
      return res.status(403).json({ msg: "Acceso denegado: Se requiere rol de líder territorial" });
    }
    const territorioId = req.user.territorioId;
    if (!territorioId) return res.status(400).json({ msg: "El usuario no tiene un territorio asignado" });

    const now = new Date();
    // Reuniones en los ultimos 30 dias
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const destacamentosCount = await prisma.destacamento.count({
      where: { territorioId }
    });

    const explorersCount = await prisma.explorer.count({
      where: { destacamento: { territorioId } }
    });

    const allMeetingsThisMonth = await prisma.meeting.findMany({
      where: {
        destacamento: { territorioId },
        date: { gte: thirtyDaysAgo, lte: now }
      },
      include: { records: true }
    });

    // Solo contar reuniones que ya pasaron Y tienen asistencia registrada
    const meetingsWithAttendance = allMeetingsThisMonth.filter(m => m.records.length > 0);
    const meetingsCount = meetingsWithAttendance.length;
    
    let attendanceAverage = 0;
    if (meetingsCount > 0) {
      let totalPercent = 0;
      for (const m of meetingsWithAttendance) {
        const attended = m.records.filter(r => r.attended).length;
        totalPercent += (attended / m.records.length) * 100;
      }
      attendanceAverage = totalPercent / meetingsCount;
    }

    res.json({
      destacamentosActivos: destacamentosCount,
      totalExploradores: explorersCount,
      reunionesMes: meetingsCount,
      asistenciaPromedio: Math.round(attendanceAverage)
    });

  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
});

router.get("/activity", async (req, res) => {
  try {
    if (req.user.role !== "lider_territorial") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }
    const territorioId = req.user.territorioId;
    if (!territorioId) return res.status(400).json({ msg: "Sin territorio" });

    // 1. Nuevos exploradores
    const explorers = await prisma.explorer.findMany({
      where: { destacamento: { territorioId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { destacamento: { select: { nombre: true } } }
    });

    // 2. Últimas reuniones CON asistencia tomada (date <= now y records > 0)
    const meetings = await prisma.meeting.findMany({
      where: {
        destacamento: { territorioId },
        date: { lte: new Date() },
        records: { some: {} }   // Solo reuniones que tienen al menos 1 registro
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { destacamento: { select: { nombre: true } } }
    });

    // 3. Últimos movimientos financieros
    const finances = await prisma.financeMovement.findMany({
      where: { destacamento: { territorioId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { destacamento: { select: { nombre: true } } }
    });

    // Mapear y combinar
    const activities = [];

    explorers.forEach(e => {
      activities.push({
        id: `exp-${e.id}`,
        action: `Nuevo explorador inscrito: ${e.nombre} ${e.apellidos}`,
        destacamento: e.destacamento.nombre,
        date: e.createdAt,
        color: '#10b981' // emerald
      });
    });

    meetings.forEach(m => {
      activities.push({
        id: `mtg-${m.id}`,
        action: `Asistencia reportada: ${m.type}`,
        destacamento: m.destacamento.nombre,
        date: m.createdAt,
        color: '#3b82f6' // blue
      });
    });

    finances.forEach(f => {
      activities.push({
        id: `fin-${f.id}`,
        action: `Movimiento financiero registrado: ${f.category}`,
        destacamento: f.destacamento.nombre,
        date: f.createdAt,
        color: '#f59e0b' // amber
      });
    });

    // Ordenar y tomar los 10 primeros
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(activities.slice(0, 10));

  } catch (error) {
    console.error("Error getting activity:", error);
    res.status(500).json({ msg: "Error interno" });
  }
});

router.get("/comparativa", async (req, res) => {
  try {
    if (req.user.role !== "lider_territorial") return res.status(403).json({ msg: "Acceso denegado" });
    const territorioId = req.user.territorioId;
    if (!territorioId) return res.status(400).json({ msg: "Sin territorio" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const destacamentos = await prisma.destacamento.findMany({
      where: { territorioId },
      include: {
        _count: {
          select: { explorers: true }
        },
        meetings: {
          orderBy: { date: "desc" },
          include: { records: true }
        },
        financeMovements: {
          where: { date: { gte: thisMonthStart } }
        },
        explorers: {
          where: { createdAt: { gte: thisMonthStart } },
          select: { id: true }
        }
      }
    });

    const results = destacamentos.map(d => {
      // Solo reuniones que: 1) Entraron en el rango y 2) ya tienen asistencia tomada (records > 0)
      const meetingsWithAttendance = d.meetings.filter(
        m => new Date(m.date) >= thirtyDaysAgo
             && new Date(m.date) <= now
             && m.records.length > 0
      );
      let attendanceAvg = 0;
      if (meetingsWithAttendance.length > 0) {
        let totalPercent = 0;
        for (const m of meetingsWithAttendance) {
          const attended = m.records.filter(r => r.attended).length;
          totalPercent += (attended / m.records.length) * 100;
        }
        attendanceAvg = totalPercent / meetingsWithAttendance.length;
      }

      let income = 0;
      let expenses = 0;
      for (const f of d.financeMovements) {
        if (f.type.toLowerCase() === 'ingreso' || f.type.toLowerCase() === 'entrada' || f.type.toLowerCase() === 'income') {
          income += Number(f.amount);
        } else {
          expenses += Number(f.amount);
        }
      }
      const balanceMes = income - expenses;
      const nuevosExploradoresMes = d.explorers.length;

      // Activo = tuvo al menos una reunión CON asistencia tomada en los últimos 10 días
      const recentMeetings = d.meetings.filter(
        m => new Date(m.date) >= tenDaysAgo
             && new Date(m.date) <= now
             && m.records.length > 0
      );
      const isActive = recentMeetings.length > 0;

      return {
        id: d.id,
        nombre: d.nombre,
        totalExploradores: d._count.explorers,
        asistenciaMes: Math.round(attendanceAvg),
        reunionesMes: meetingsWithAttendance.length,
        balanceMes: Number(balanceMes.toFixed(2)),
        nuevosExploradoresMes,
        isActive,
        lastMeetingDate: d.meetings[0]?.date || null
      };
    });

    res.json(results);
  } catch (error) {
    console.error("Error comparativa", error);
    res.status(500).json({ msg: "Error interno" });
  }
});

router.get("/reporte-detallado", async (req, res) => {
  try {
    if (req.user.role !== "lider_territorial") return res.status(403).json({ msg: "Acceso denegado" });
    const territorioId = req.user.territorioId;
    if (!territorioId) return res.status(400).json({ msg: "Sin territorio" });

    // Cargar destacamentos y calcular exploradores
    const destacamentos = await prisma.destacamento.findMany({
      where: { territorioId },
      include: {
        explorers: true
      }
    });

    let demiAmiguitos = 0;
    let demiSeguidores = 0;
    let demiServicio = 0;

    const crecimiento = [];

    const now = new Date();

    const calculateAge = (dob) => {
      const diff_ms = Date.now() - new Date(dob).getTime();
      const age_dt = new Date(diff_ms); 
      return Math.abs(age_dt.getUTCFullYear() - 1970);
    };

    destacamentos.forEach(d => {
      let d_amiguitos = 0;
      let d_seguidores = 0;
      let d_servicio = 0;
      
      d.explorers.forEach(ext => {
        const edad = calculateAge(ext.fechaNacimiento);
        if (edad >= 4 && edad <= 10) {
          demiAmiguitos++;
          d_amiguitos++;
        } else if (edad >= 11 && edad <= 15) {
          demiSeguidores++;
          d_seguidores++;
        } else if (edad >= 16) {
          demiServicio++;
          d_servicio++;
        }
      });

      crecimiento.push({
        name: d.nombre,
        amiguitos: d_amiguitos,
        seguidores: d_seguidores,
        servicio: d_servicio,
        total: d_amiguitos + d_seguidores + d_servicio
      });
    });

    crecimiento.sort((a, b) => b.total - a.total);
    const topCrecimiento = crecimiento.slice(0, 10);

    const demografia = [
      { name: "Amiguitos de Jesús", value: demiAmiguitos, fill: "#00BFFF" },
      { name: "Seguidores del Maestro", value: demiSeguidores, fill: "#228B22" },
      { name: "Servicio Cristiano", value: demiServicio, fill: "#FF0000" }
    ];

    // Asistencia de los ultimos 6 meses para que el grafico se vea con mas historia (aprox) si la hay.
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const meetings = await prisma.meeting.findMany({
      where: {
        destacamento: { territorioId },
        date: { gte: sixMonthsAgo, lte: now }
      },
      include: {
        records: true
      }
    });

    const grouped = {};
    meetings.forEach(m => {
      if (m.records.length === 0) return;
      
      const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = { meetingsCount: 0, totalPercent: 0 };
      }
      
      const attended = m.records.filter(r => r.attended).length;
      const percent = (attended / m.records.length) * 100;
      grouped[key].meetingsCount++;
      grouped[key].totalPercent += percent;
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const asistenciaTrend = Object.keys(grouped).sort().map(key => {
      const parts = key.split('-');
      const year = parts[0];
      const month = Number(parts[1]) - 1;
      return {
        date: `${monthNames[month]} ${year}`,
        asistencia: Math.round(grouped[key].totalPercent / grouped[key].meetingsCount)
      };
    });

    res.json({
      demografia,
      crecimiento: topCrecimiento,
      asistenciaTrend
    });
  } catch (error) {
    console.error("Error reporte detallado", error);
    res.status(500).json({ msg: "Error interno" });
  }
});

export default router;
