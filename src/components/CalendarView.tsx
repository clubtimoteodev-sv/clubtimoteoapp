import { useEffect, useRef, useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  CalendarPlus,
  Trash2,
  ClipboardCheck,
  Clock3,
  Church,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

type Meeting = {
  id: string;
  date: string;
  type: string;
  _count?: { records: number };
};

type CalendarViewProps = {
  onTakeAttendance: (meetingId: string) => void;
  onBack: () => void;
};

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-SV", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CalendarView({ onTakeAttendance, onBack }: CalendarViewProps) {
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [form, setForm] = useState({
    date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    type: "",
  });

  const isTerritorial = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.role === "lider territorial";
    } catch { return false; }
  })();

  const formRef = useRef<HTMLDivElement | null>(null);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/calendar/upcoming?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`);
      setMeetings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando reuniones:", error);
      toast.error("No se pudieron cargar las reuniones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [currentDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.type.trim() || !form.date) {
      toast.error("Completa el tipo y la fecha de la reunión");
      return;
    }

    try {
      setSaving(true);

      await apiFetch("/calendar/meetings", {
        method: "POST",
        body: JSON.stringify(form),
      });

      toast.success("Reunión creada exitosamente");

      setForm({
        date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        type: "",
      });

      await loadMeetings();
    } catch (error) {
      console.error("Error creando reunión:", error);
      toast.error("No se pudo crear la reunión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar reunión?")) return;

    try {
      await apiFetch(`/calendar/meetings/${id}`, {
        method: "DELETE",
      });

      toast.success("Reunión eliminada");
      await loadMeetings();
    } catch (error) {
      console.error("Error eliminando reunión:", error);
      toast.error("No se pudo eliminar la reunión");
    }
  };

  const goToCreate = () => {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {isDesktop && (
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
              <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
              Volver
            </button>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>{isTerritorial ? "Agenda Regional" : "Calendario"}</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" }}>{isTerritorial ? "Próximas actividades de los destacamentos" : "Crear y administrar reuniones"}</p>
            </div>
          </div>
          {!isTerritorial && (
            <Button type="button" onClick={goToCreate}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Crear reunión
            </Button>
          )}
        </div>
      </header>
      )}

      {!isDesktop && (
        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", background: "white" }}>
          <button
            type="button"
            onClick={onBack}
            style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#374151" }}
          >
            <ArrowLeft style={{ width: "0.9rem", height: "0.9rem" }} />
            Volver
          </button>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
            {isTerritorial ? "Agenda Regional" : "Calendario"}
          </span>
          {!isTerritorial && (
            <button
              type="button"
              onClick={goToCreate}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "0.5rem", border: "none", background: "#111827", color: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
            >
              <CalendarPlus style={{ width: "0.9rem", height: "0.9rem" }} />
              Crear
            </button>
          )}
        </div>
      )}

      <main className="px-4 py-5 pb-safe">
        <div className="space-y-4">
          

          {!isTerritorial && (
            <Card ref={formRef} className="border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Nueva reunión
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingType">Tipo de reunión *</Label>
                    <Input
                      id="meetingType"
                      type="text"
                      placeholder="Ej: Reunión General, Campamento, Actividad..."
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingDate">Fecha y hora *</Label>
                    <Input
                      id="meetingDate"
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Guardando..." : "Guardar reunión"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="max-w-4xl mx-auto pt-2">
            <div className="mb-6 sm:mb-8 border-b border-slate-200 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  {isTerritorial ? "Agenda Regional" : "Próximas Reuniones"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isTerritorial ? "Eventos programados por los destacamentos locales." : "Gestiona las actividades del destacamento."}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold text-slate-700 min-w-[120px] text-center capitalize">
                  {currentDate.toLocaleDateString("es-SV", { month: "long", year: "numeric" })}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-white p-12 text-center text-sm font-medium text-slate-500 border border-slate-100 shadow-sm">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
                  Cargando calendario...
                </div>
              </div>
            ) : meetings.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center text-slate-500 border border-dashed border-slate-300 shadow-sm">
                <CalendarIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="font-medium text-lg text-slate-700">No hay actividades próximas</p>
                <p className="text-sm mt-1">Aún no se han programado reuniones.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-10 w-full">
                {meetings.map((meeting) => {
                  const dateObj = new Date(meeting.date);
                  
                  const longDate = dateObj.toLocaleDateString("es-SV", { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  const time = dateObj.toLocaleTimeString("es-SV", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  });

                  const now = new Date();
                  const isTimeReached = now.getTime() >= dateObj.getTime();
                  
                  const isToday = 
                    dateObj.getDate() === now.getDate() && 
                    dateObj.getMonth() === now.getMonth() && 
                    dateObj.getFullYear() === now.getFullYear();
                  
                  const isPast = now.getTime() > dateObj.getTime() && !isToday;
                  const hasAttendance = (meeting._count?.records ?? 0) > 0;
                  const missedAttendance = isPast && !hasAttendance;

                  let badgeLabel = "Próximo";
                  let badgeClass = "bg-blue-50 text-blue-600 font-medium";

                  if (isToday) {
                    badgeLabel = "Hoy";
                    badgeClass = "bg-emerald-50 text-emerald-600 font-medium";
                  } else if (missedAttendance) {
                    badgeLabel = "Sin asistencia";
                    badgeClass = "bg-red-50 text-red-600 font-medium border border-red-200";
                  } else if (isPast && hasAttendance) {
                    badgeLabel = "Completada";
                    badgeClass = "bg-slate-100 text-slate-600 font-medium";
                  }

                  return (
                    <div 
                      key={meeting.id} 
                      className={`group relative flex flex-col rounded-xl border p-5 sm:p-6 hover:border-indigo-300 transition-colors w-full ${
                        missedAttendance
                          ? "bg-red-50/40 border-red-200"
                          : isTimeReached && !isToday
                          ? "opacity-60 bg-slate-50 border-slate-200 grayscale-[0.2]"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-5">
                        <h3 className="text-[1.1rem] sm:text-[1.15rem] font-bold text-slate-800">
                          {meeting.type}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[0.7rem] whitespace-nowrap shrink-0 ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3.5 text-[0.9rem] sm:text-[0.95rem] text-slate-500 mb-6 sm:mb-8">
                        <div className="flex flex-wrap items-center gap-6">
                          <span className="flex items-center gap-2.5">
                            <CalendarIcon className="h-[18px] w-[18px] text-indigo-400 stroke-[1.5]" />
                            {longDate}
                          </span>
                          <span className="flex items-center gap-2.5">
                            <Clock3 className="h-[18px] w-[18px] text-indigo-400 stroke-[1.5]" />
                            {time}
                          </span>
                        </div>
                        
                        {(meeting as any).destacamento?.nombre && (
                          <span className="flex items-center gap-2.5 text-slate-500 mt-1">
                            <MapPin className="h-[18px] w-[18px] text-slate-400 stroke-[1.5]" />
                            Destacamento {(meeting as any).destacamento.nombre}
                          </span>
                        )}
                      </div>

                      {/* Bloque de alerta: asistencia pendiente */}
                      {missedAttendance && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                          Reunión pasada — Asistencia no registrada
                        </div>
                      )}

                      <div className="flex justify-end border-t border-slate-100 pt-4 sm:pt-5 mt-auto">
                        <div className="flex w-full sm:w-auto gap-2 justify-end text-right">
                          {isTerritorial ? (
                            isTimeReached ? (
                              <button className="text-[0.9rem] font-medium text-indigo-500 hover:text-indigo-700 transition-colors w-full sm:w-auto sm:px-2">
                                Ver Detalles
                              </button>
                            ) : (
                              <span className="text-[0.8rem] text-slate-400 italic font-medium py-1 sm:px-2 flex items-center justify-end w-full">
                                <Clock3 className="mr-1.5 h-3.5 w-3.5" /> Aún no disponible
                              </span>
                            )
                          ) : (
                            <div className="flex w-full sm:w-auto gap-3">
                              <Button
                                type="button"
                                variant={isTimeReached ? "outline" : "secondary"}
                                size="sm"
                                disabled={!isTimeReached}
                                onClick={() => onTakeAttendance(meeting.id)}
                                className={`h-10 flex-1 sm:flex-none text-xs sm:text-[0.85rem] rounded-md ${
                                  missedAttendance
                                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                    : !isTimeReached
                                    ? 'opacity-60 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                {isTimeReached ? <ClipboardCheck className="mr-1.5 h-4 w-4" /> : <Clock3 className="mr-1.5 h-4 w-4 text-slate-400" />}
                                {missedAttendance ? "Registrar ahora" : isTimeReached ? "Asistencia" : "Esperando hora"}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(meeting.id)}
                                className="h-10 flex-1 sm:flex-none text-xs sm:text-[0.85rem] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-4 rounded-md"
                              >
                                <Trash2 className="sm:mr-1.5 h-4 w-4" />
                                <span className="sm:hidden">Eliminar</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
