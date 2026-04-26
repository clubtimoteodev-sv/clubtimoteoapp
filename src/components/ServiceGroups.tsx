import { useEffect, useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Users, ClipboardCheck, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

interface Explorer {
  id: string;
  nombre: string;
  apellidos: string;
}

interface ServiceGroupMemberApi {
  id: string;
  explorerId: string;
  explorer: Explorer;
}

interface ServiceGroupApi {
  id: string;
  date: string;
  day: string;
  createdAt: string;
  members: ServiceGroupMemberApi[];
}

interface ServiceGroupsProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onTakeAttendance: (groupId: string) => void;
  onViewReport: (groupId: string) => void;
}

export function ServiceGroups({
  onBack,
  onNavigate,
  onTakeAttendance,
  onViewReport,
}: ServiceGroupsProps) {
  const isDesktop = useIsDesktop();
  const [groups, setGroups] = useState<ServiceGroupApi[]>([]);
  const [loading, setLoading] = useState(true);

  const isReadOnly = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role === "lider_territorial"; }
    catch { return false; }
  })();

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await apiFetch("/service-groups");
      setGroups(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los grupos");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-SV", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-sky-50">
      {isDesktop && (
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Volver
          </button>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Grupos de Servicio</p>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" }}>Selecciona o crea un grupo</p>
          </div>
        </div>
      </header>
      )}

      {!isDesktop && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", background: "white" }}>
          <button
            type="button"
            onClick={onBack}
            style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#374151" }}
          >
            <ArrowLeft style={{ width: "0.9rem", height: "0.9rem" }} />
            Volver
          </button>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
            {groups.length} grupos
          </span>
        </div>
      )}

      <main className="px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Grupos de Servicio
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecciona un grupo para asistencia o reporte
            </p>
          </div>

          {!isReadOnly && (
            <Button
              onClick={() => onNavigate("service-schedule-creation")}
              className="!text-white !bg-gradient-to-r !from-cyan-600 !to-sky-600 hover:!from-cyan-700 hover:!to-sky-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Grupo
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Cargando grupos...
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No hay grupos creados
              </p>

              {!isReadOnly && (
                <Button
                  onClick={() => onNavigate("service-schedule-creation")}
                  className="!text-white !bg-gradient-to-r !from-cyan-600 !to-sky-600 hover:!from-cyan-700 hover:!to-sky-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer grupo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-cyan-100 text-cyan-800 border-0">
                        {group.day}
                      </Badge>

                      <Badge variant="outline">
                        {formatDate(group.date)}
                      </Badge>

                      <Badge variant="outline">
                        {group.members.length} miembros
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        {group.members
                          .map(
                            (m) =>
                              `${m.explorer.nombre} ${m.explorer.apellidos}`
                          )
                          .join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="!text-purple-700"
                      onClick={() => onTakeAttendance(group.id)}
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Asistencia
                    </Button>

                    <Button
                      variant="outline"
                      className="!text-orange-700"
                      onClick={() => onViewReport(group.id)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reporte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}