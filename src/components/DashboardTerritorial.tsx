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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 className="animate-spin text-slate-400 h-10 w-10" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827" }}>
          Visión Territorial
        </h1>
        <p style={{ color: "#4b5563", marginTop: "0.5rem" }}>
          Bienvenido, supervisor <strong>{user?.name || "Territorial"}</strong>. Resumen de la Zona Occidente.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", color: "#3b82f6" }}>
            <Church size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Destacamentos Activos</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats?.destacamentosActivos || 0}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "#ecfdf5", padding: "1rem", borderRadius: "0.5rem", color: "#10b981" }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Total Exploradores</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats?.totalExploradores || 0}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "#fef3c7", padding: "1rem", borderRadius: "0.5rem", color: "#f59e0b" }}>
            <Map size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Reuniones del Mes</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats?.reunionesMes || 0}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "#fee2e2", padding: "1rem", borderRadius: "0.5rem", color: "#ef4444" }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Asistencia Promedio</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats?.asistenciaPromedio || 0}%</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginBottom: "1rem" }}>Actividad Reciente en la Región</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activities.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No hay actividad reciente.</p>
          ) : (
            activities.map((act) => {
              const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
              const daysDifference = Math.round((new Date(act.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const hoursDifference = Math.round((new Date(act.date).getTime() - new Date().getTime()) / (1000 * 60 * 60));

              let timeAgo = "";
              if (Math.abs(daysDifference) > 0) {
                timeAgo = rtf.format(daysDifference, 'day');
              } else {
                timeAgo = rtf.format(hoursDifference, 'hour');
              }

              return (
                <li key={act.id} style={{ display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: act.color }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#111827", fontWeight: "500" }}>{act.action}</p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Destacamento {act.destacamento} - {timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
