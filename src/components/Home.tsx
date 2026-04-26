import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import {
  Users,
  CheckCircle2,
  Wallet,
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
  upcomingMeetings: Array<{
    id: string;
    date: string;
    type: string;
  }>;
  recentExplorers: Array<{
    id: string;
    nombre: string;
    apellidos: string;
    createdAt: string;
  }>;
  lastMeetingSummary: null | {
    id: string;
    date: string;
    type: string;
    total: number;
    attended: number;
    absent: number;
    percent: number;
  };
  recentFinanceMovements: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
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

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-SV", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
      badgeClass: "text-green-600 bg-green-50",
      label: "Entrada",
    };
  }

  return {
    valueClass: "text-red-600",
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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
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
    };

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="sticky top-0 z-10 border-b bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-3 sm:px-6 shrink-0">
          <div>
            <p className="font-bold text-[1rem] text-slate-800">
              Dashboard
            </p>

            <p className="text-[0.75rem] text-slate-500 mt-[1px]">
              Resumen general del club y actividad reciente
            </p>
          </div>
        </div>
      </header>

      <main className="w-full overflow-x-hidden space-y-5 px-3 py-4 pb-safe sm:px-4 sm:py-5">
      {/* Cambiamos a grid-cols-3 desde el breakpoint 'sm' (640px) o 'md' (768px) */}
<section className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
  
  {/* Card 1: Exploradores */}
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Exploradores</p>
        <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
          {loading ? "..." : summary.explorersCount}
        </p>
      </div>
      <div className="shrink-0 rounded-xl bg-blue-50 p-3">
        <Users className="h-5 w-5 text-blue-600" />
      </div>
    </div>
  </div>

  {/* Card 2: Asistencia */}
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</p>
        <p className={`mt-1 text-xl font-bold sm:text-2xl ${
          summary.monthlyAttendanceAverage >= 80 ? "text-green-600" : summary.monthlyAttendanceAverage >= 50 ? "text-yellow-600" : "text-red-600"
        }`}>
          {loading ? "..." : `${summary.monthlyAttendanceAverage}%`}
        </p>
      </div>
      <div className="shrink-0 rounded-xl bg-gray-50 p-3">
        <CheckCircle2 className="h-5 w-5 text-gray-500" />
      </div>
    </div>
  </div>

  {/* Card 3: Balance - Eliminamos el col-span-2 para que se alinee */}
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</p>
        <p className={`mt-1 text-xl font-bold sm:text-2xl ${
          summary.balance > 0 ? "text-green-600" : summary.balance < 0 ? "text-red-600" : "text-gray-700"
        }`}>
          {loading ? "..." : formatMoney(summary.balance)}
        </p>
      </div>
      <div className="shrink-0 rounded-xl bg-green-50 p-3">
        <Wallet className="h-5 w-5 text-green-600" />
      </div>
    </div>
  </div>
</section>

        <section className="grid w-full min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Próximas reuniones</h2>
            </div>

            <div className="flex-1">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : summary.upcomingMeetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                  No hay reuniones próximas registradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {summary.upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="h-full min-w-0 rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex h-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{meeting.type}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDateTime(meeting.date)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                          Próxima
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Exploradores recientes</h2>
            </div>

            <div className="flex-1">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : summary.recentExplorers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                  No hay exploradores recientes.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {summary.recentExplorers.map((explorer) => (
                    <div
                      key={explorer.id}
                      className="flex h-full min-w-0 items-center gap-3 rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                        {getInitials(explorer.nombre, explorer.apellidos)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {explorer.nombre} {explorer.apellidos}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Agregado: {formatDate(explorer.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid w-full min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Última asistencia registrada
              </h2>
            </div>

            <div className="flex-1">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : !summary.lastMeetingSummary ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                  No hay reuniones registradas.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {summary.lastMeetingSummary.type}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(summary.lastMeetingSummary.date)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 px-4 py-4">
                      <p className="text-sm text-gray-500">Presentes</p>
                      <p className="mt-1 text-2xl font-semibold text-green-600">
                        {summary.lastMeetingSummary.attended}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 px-4 py-4">
                      <p className="text-sm text-gray-500">Ausentes</p>
                      <p className="mt-1 text-2xl font-semibold text-red-600">
                        {summary.lastMeetingSummary.absent}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 px-4 py-4">
                      <p className="text-sm text-gray-500">Porcentaje</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${
                          summary.lastMeetingSummary.percent >= 80
                            ? "text-green-600"
                            : summary.lastMeetingSummary.percent >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {summary.lastMeetingSummary.percent}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Transacciones recientes</h2>
            </div>

            <div className="flex-1">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : summary.recentFinanceMovements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                  No hay transacciones recientes.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {summary.recentFinanceMovements.map((movement) => {
                    const tone = getMovementTone(movement.type);

                    return (
                      <div
                        key={movement.id}
                        className="h-full min-w-0 rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone.badgeClass}`}
                              >
                                {tone.label}
                              </span>
                            </div>

                            <p className="truncate font-medium text-gray-900">
                              {movement.category}
                            </p>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {movement.description || movement.type}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className={`font-semibold ${tone.valueClass}`}>
                              {formatMoney(movement.amount)}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(movement.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}