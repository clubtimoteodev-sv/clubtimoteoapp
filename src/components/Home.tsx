import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";
import {
  Users,
  CheckCircle2,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  UserPlus,
  Clock3,
  ReceiptText,
} from "lucide-react";

type DashboardSummary = {
  explorersCount: number;
  monthlyAttendanceAverage: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  upcomingMeetings: any[];
  recentExplorers: any[];
  lastMeetingSummary: any;
  recentFinanceMovements: any[];
};

function formatMoney(value: number) {
  return value.toLocaleString("es-SV", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(nombre: string, apellidos: string) {
  return `${nombre?.charAt(0) || ""}${apellidos?.charAt(0) || ""}`.toUpperCase();
}

function getMovementTone(type: string) {
  const normalized = String(type || "").toLowerCase();

  if (
    normalized === "entrada" ||
    normalized === "income" ||
    normalized === "ingreso"
  ) {
    return {
      valueClass: "text-green-600",
      iconClass: "text-green-500",
      badgeClass: "text-green-600 bg-green-50",
      label: "Entrada",
    };
  }

  return {
    valueClass: "text-red-600",
    iconClass: "text-red-500",
    badgeClass: "text-red-600 bg-red-50",
    label: "Salida",
  };
}

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<DashboardSummary>({
    explorersCount: 0,
    monthlyAttendanceAverage: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    upcomingMeetings: [],
    recentExplorers: [],
    lastMeetingSummary: null,
    recentFinanceMovements: [],
  });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const data = await apiFetch("/dashboard/summary");

      setSummary({
        explorersCount: Number(data.explorersCount ?? 0),
        monthlyAttendanceAverage: Number(data.monthlyAttendanceAverage ?? 0),
        totalIncome: Number(data.totalIncome ?? 0),
        totalExpense: Number(data.totalExpense ?? 0),
        balance: Number(data.balance ?? 0),
        upcomingMeetings: Array.isArray(data.upcomingMeetings)
          ? data.upcomingMeetings
          : [],
        recentExplorers: Array.isArray(data.recentExplorers)
          ? data.recentExplorers
          : [],
        lastMeetingSummary: data.lastMeetingSummary ?? null,
        recentFinanceMovements: Array.isArray(data.recentFinanceMovements)
          ? data.recentFinanceMovements
          : [],
      });
    } catch (error) {
      console.error("dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Resumen general del club
        </p>
      </div>

      {/* STATS */}

      <section>
        <div className="flex gap-6 overflow-x-auto pb-2">

          <div className="min-w-[250px] flex-1 rounded-2xl border p-6 shadow-sm bg-white">
            <p className="text-sm text-gray-500">Exploradores</p>
            <p className="text-3xl font-semibold">
              {loading ? "..." : summary.explorersCount}
            </p>
          </div>

          <div className="min-w-[250px] flex-1 rounded-2xl border p-6 shadow-sm bg-white">
            <p className="text-sm text-gray-500">Asistencia promedio</p>

            <p
              className={`text-3xl font-semibold ${
                summary.monthlyAttendanceAverage >= 80
                  ? "text-green-600"
                  : summary.monthlyAttendanceAverage >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {loading ? "..." : `${summary.monthlyAttendanceAverage}%`}
            </p>
          </div>

          <div className="min-w-[250px] flex-1 rounded-2xl border p-6 shadow-sm bg-white">
            <p className="text-sm text-gray-500">Balance</p>

            <p
              className={`text-3xl font-semibold ${
                summary.balance > 0
                  ? "text-green-600"
                  : summary.balance < 0
                  ? "text-red-600"
                  : "text-gray-700"
              }`}
            >
              {loading ? "..." : formatMoney(summary.balance)}
            </p>
          </div>

        </div>
      </section>

      {/* PROXIMAS REUNIONES */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="rounded-2xl border p-6 bg-white shadow-sm">

          <h2 className="font-semibold mb-4 flex gap-2 items-center">
            <CalendarDays size={18}/> Próximas reuniones
          </h2>

          {summary.upcomingMeetings.map((m) => (

            <div key={m.id} className="border rounded-xl p-3 mb-2">

              <p className="font-medium">{m.type}</p>

              <p className="text-sm text-gray-500">
                {formatDate(m.date)}
              </p>

            </div>

          ))}

        </div>

        {/* FINANZAS */}

        <div className="rounded-2xl border p-6 bg-white shadow-sm">

          <h2 className="font-semibold mb-4 flex gap-2 items-center">
            <ReceiptText size={18}/> Transacciones recientes
          </h2>

          {summary.recentFinanceMovements.map((movement) => {

            const tone = getMovementTone(movement.type);

            return (

              <div key={movement.id} className="border rounded-xl p-3 mb-2">

                <div className="flex justify-between">

                  <div>

                    <p className="font-medium">
                      {movement.category}
                    </p>

                    <p className="text-sm text-gray-500">
                      {movement.description}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className={`font-semibold ${tone.valueClass}`}>
                      {formatMoney(movement.amount)}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(movement.date)}
                    </p>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </section>

    </div>
  );
}
