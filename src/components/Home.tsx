import { useEffect, useState } from "react";
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
  XCircle,
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
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Resumen general del club y actividad reciente
        </p>
      </div>

      <section>
        <div className="flex gap-6 overflow-x-auto pb-2">
          <div className="min-w-[250px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Exploradores registrados</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {loading ? "..." : summary.explorersCount}
                </p>
              </div>

              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </div>

          <div className="min-w-[250px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Asistencia promedio mensual</p>

                <p
                  className={`mt-2 text-3xl font-semibold ${
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

              <CheckCircle2 className="h-6 w-6 text-gray-400" />
            </div>
          </div>

          <div className="min-w-[250px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Balance financiero</p>

                <p
                  className={`mt-2 text-3xl font-semibold ${
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

              <Wallet className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Resumen financiero
          </h2>

          <div className="ml-4 h-px flex-1 bg-gray-200"></div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-2">
          <div className="min-w-[260px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Entradas</p>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-green-600">
              {loading ? "..." : formatMoney(summary.totalIncome)}
            </p>
          </div>

          <div className="min-w-[260px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Salidas</p>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-red-600">
              {loading ? "..." : formatMoney(summary.totalExpense)}
            </p>
          </div>

          <div className="min-w-[260px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Balance actual</p>
              <Wallet className="h-5 w-5 text-gray-500" />
            </div>

            <p
              className={`mt-3 text-2xl font-semibold ${
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Próximas reuniones</h2>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : summary.upcomingMeetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                No hay reuniones próximas registradas.
              </div>
            ) : (
              summary.upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{meeting.type}</p>
                      <p className="mt-1 text-sm text-gray-500">{formatDate(meeting.date)}</p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      Próxima
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Exploradores recientes</h2>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : summary.recentExplorers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                No hay exploradores recientes.
              </div>
            ) : (
              summary.recentExplorers.map((explorer) => (
                <div
                  key={explorer.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
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
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Última asistencia registrada
            </h2>
          </div>

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
                  {formatDate(summary.lastMeetingSummary.date)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
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

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Transacciones recientes</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : summary.recentFinanceMovements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                No hay transacciones recientes.
              </div>
            ) : (
              summary.recentFinanceMovements.map((movement) => {
                const tone = getMovementTone(movement.type);

                return (
                  <div
                    key={movement.id}
                    className="rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-gray-50"
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
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
