import { useEffect, useState } from "react";
import { Users, Church, Activity, Map, Loader2 } from "lucide-react";
import { apiFetch } from "../services/api";

type Stats = {
  destacamentosActivos: number;
  totalExploradores: number;
  reunionesMes: number;
  asistenciaPromedio: number;
};

type RecentActivity = {
  id: string;
  action: string;
  destacamento: string;
  date: string;
  color: string;
};

interface DashboardTerritorialProps {
  user: { name: string; email: string; role: string; destacamentoNombre?: string } | null;
}

export default function DashboardTerritorial({ user }: DashboardTerritorialProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, activityData] = await Promise.all([
          apiFetch("/territorio/stats"),
          apiFetch("/territorio/activity")
        ]);
        setStats(statsData);
        setActivities(activityData);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Destacamentos Activos",
      value: stats?.destacamentosActivos ?? 0,
      icon: Church,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Exploradores",
      value: stats?.totalExploradores ?? 0,
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Reuniones del Mes",
      value: stats?.reunionesMes ?? 0,
      icon: Map,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      label: "Asistencia Promedio",
      value: `${stats?.asistenciaPromedio ?? 0}%`,
      icon: Activity,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-3 sm:px-6 shrink-0">
          <div>
            <p className="font-bold text-[1rem] text-slate-800">
              Dashboard Territorial
            </p>
            <p className="text-[0.75rem] text-slate-500 mt-[1px]">
              Bienvenido, {user?.name || "Territorial"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5">
        {/* Stat Cards — misma estructura que Home.tsx */}
        <section className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
                      {card.value}
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-3 ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Actividad Reciente */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Actividad Reciente en la Región
          </h2>

          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
              No hay actividad reciente.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.map((act) => {
                const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
                const daysDiff = Math.round(
                  (new Date(act.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const hoursDiff = Math.round(
                  (new Date(act.date).getTime() - new Date().getTime()) / (1000 * 60 * 60)
                );
                const timeAgo =
                  Math.abs(daysDiff) > 0
                    ? rtf.format(daysDiff, "day")
                    : rtf.format(hoursDiff, "hour");
                const capitalized = timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1);

                return (
                  <li key={act.id} className="flex items-start gap-4 py-3">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-500"
                    >
                      <Activity size={18} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold text-slate-800">{act.action}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {act.destacamento} · {capitalized}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
