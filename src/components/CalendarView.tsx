import { useEffect, useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  CalendarPlus,
  Trash2,
  Users,
  Clock3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ExportManager } from "./ExportManager";

const C = {
  green: { accent: "#4ade80", bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  red: { accent: "#f87171", bg: "#fff1f2", text: "#be123c", border: "#fda4af" },
  blue: { accent: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  amber: { accent: "#fbbf24", bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  slate: { accent: "#94a3b8", bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
  page: "#f1f5f9",   // bg-slate-100
  card: "#ffffff",
  divide: "#f1f5f9",
  border: "#e2e8f0",
  textMain: "#1e293b",
  textSub: "#64748b",
  textMute: "#94a3b8",
};

type Meeting = {
  id: string;
  date: string;
  type: string;
  destacamento?: {
    nombre: string;
  };
  _count?: { records: number };
};

type CalendarViewProps = {
  onTakeAttendance: (meetingId: string) => void;
  onViewAttendance: (meetingId: string) => void;
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

const formatDisplayMonth = (date: Date) => {
  const str = date.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
  });
  return str.replace(/\b[a-zA-Z]/g, (l) => l.toUpperCase());
};

export function CalendarView({ onTakeAttendance, onViewAttendance, onBack }: CalendarViewProps) {
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    type: "",
  });

  // ── Rol del usuario ──────────────────────────────────────────
  const userRole = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (user?.role as string) || "";
    } catch {
      return "";
    }
  })();

  const isTerritorial = userRole === "lider_territorial";
  // Puede programar/eliminar reuniones: lider_destacamento o admin
  const canManage = userRole === "lider_destacamento" || userRole === "admin";

  const territorialOverride = localStorage.getItem("overrideDestacamentoName");
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const globalName = storedUser.territorioNombre ? `Territorio ${storedUser.territorioNombre}` : "Destacamento";

  const outpostInfo = {
    name: territorialOverride || storedUser?.destacamento?.name || storedUser.destacamentoNombre || globalName,
    city: storedUser?.destacamento?.city || "",
    leader: storedUser.name || "Líder",
  };

  // ── Utilitaria: normaliza una fecha a medianoche local (ignora hora) ──
  const normalizeToDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const loadMeetings = async (date: Date) => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `/calendar/upcoming?month=${date.getMonth()}&year=${date.getFullYear()}`
      );
      setMeetings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando reuniones:", error);
      toast.error("No se pudieron cargar las reuniones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings(selectedMonth);
  }, [selectedMonth.getTime()]);

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
      setIsCreating(false);

      const createdDate = new Date(form.date);
      const newMonth = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);
      if (newMonth.getTime() !== selectedMonth.getTime()) {
        setSelectedMonth(newMonth);
      } else {
        await loadMeetings(selectedMonth);
      }
    } catch (error) {
      console.error("Error creando reunión:", error);
      toast.error("No se pudo crear la reunión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("¿Eliminar reunión?")) return;
    try {
      await apiFetch(`/calendar/meetings/${id}`, { method: "DELETE" });
      toast.success("Reunión eliminada");
      await loadMeetings(selectedMonth);
    } catch (error) {
      console.error("Error eliminando reunión:", error);
      toast.error("No se pudo eliminar la reunión");
    }
  };

  const nextMonth = () => {
    const next = new Date(selectedMonth);
    next.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(next);
  };

  const prevMonth = () => {
    const prev = new Date(selectedMonth);
    prev.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(prev);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  };

  // Stats rápidas del mes
  const now = new Date();
  const todayNorm = normalizeToDay(now);

  // Clasificar reuniones usando días normalizados (evita bug UTC vs local)
  const completed = meetings.filter((m) => (m._count?.records ?? 0) > 0).length;
  const pending = meetings.filter((m) => {
    const dNorm = normalizeToDay(new Date(m.date));
    const isTodayM = dNorm === todayNorm;
    const isPastM = dNorm < todayNorm;
    return (isTodayM || isPastM) && (m._count?.records ?? 0) === 0;
  }).length;
  const upcoming = meetings.filter((m) => {
    const dNorm = normalizeToDay(new Date(m.date));
    return dNorm > todayNorm;
  }).length;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: C.textMain,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: "0.5rem"
              }}>
                Calendario
              </p>
              <p style={{
                fontSize: "0.75rem",
                color: C.textMute,
                marginTop: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                Gestión de reuniones del club
              </p>
            </div>
          </div>
            
          <div className="flex items-center gap-2">
              <ExportManager
                data={meetings.map((m) => {
                  const dateObj = new Date(m.date);
                  const dNorm = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
                  const todayN = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
                  const isToday = dNorm === todayN;
                  const isPastDay = dNorm < todayN;
                  const hasAttendance = (m._count?.records ?? 0) > 0;

                  let status = "Próxima";
                  if (hasAttendance) status = "Completada";
                  else if (isToday) status = "Hoy";
                  else if (isPastDay) status = "Atrasada";

                  const longDateString = dateObj.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                  const timeString = dateObj.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });

                  return {
                    ...m,
                    formattedDate: `${longDateString} a las ${timeString}`,
                    status,
                    destacamentoNombre: m.destacamento?.nombre || "N/A"
                  };
                })}
                availableColumns={[
                  { key: "type", label: "Tipo de Reunión" },
                  { key: "formattedDate", label: "Fecha y Hora" },
                  { key: "status", label: "Estado" },
                  ...(isTerritorial ? [{ key: "destacamentoNombre", label: "Destacamento" }] : [])
                ] as any}
                filename={`Reporte_Calendario_${selectedMonth.getMonth() + 1}_${selectedMonth.getFullYear()}`}
                reportTitle={`Calendario de Reuniones - ${formatDisplayMonth(selectedMonth)}`}
                outpostInfo={outpostInfo}
              />

              {/* Solo lider_destacamento y admin pueden programar reuniones */}
              {canManage && !isCreating && (
                <Button
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  className="gap-2 h-9 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-sm shrink-0"
                >
                  <CalendarPlus size={16} className="text-slate-500" />
                  <span className="hidden sm:inline">Programar Reunión</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              )}
              {isCreating && (
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X size={14} />
                  Cancelar
                </button>
              )}
            </div>
        </div>
      </header>

      <main className="w-full space-y-4 px-4 py-5 pb-16 sm:px-6">

        {/* ── Formulario de creación ──────────────────────────── */}
        {isCreating && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="rounded-xl bg-blue-50 p-2">
                <CalendarPlus size={18} className="text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Programar nueva reunión</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="meetingType" className="text-sm font-semibold text-slate-700">
                  Tipo de reunión
                </Label>
                <Input
                  id="meetingType"
                  type="text"
                  placeholder="Ej: Reunión General, Campamento..."
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meetingDate" className="text-sm font-semibold text-slate-700">
                  Fecha y hora
                </Label>
                <Input
                  id="meetingDate"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-11 w-full rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? "Guardando..." : "Guardar reunión"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Navegación de mes ───────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={prevMonth}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="text-center">
              <p className="text-base font-bold text-slate-800 capitalize">
                {formatDisplayMonth(selectedMonth)}
              </p>
              <button
                onClick={goToCurrentMonth}
                className="mt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ir a este mes
              </button>
            </div>

            <button
              onClick={nextMonth}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Mini stats del mes */}
          {!loading && meetings.length > 0 && (
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-green-600">{completed}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Completadas</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-blue-600">{upcoming}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Próximas</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-red-500">{pending}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Pendientes</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Lista de reuniones ──────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400">
            <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <span className="text-sm font-medium">Cargando reuniones...</span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
            <CalendarIcon size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold">No hay reuniones este mes</p>
            <p className="mt-1 text-xs text-slate-400">
              {!isTerritorial ? "Crea una usando el botón de arriba" : "El líder aún no ha programado reuniones"}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: "0.75rem",
              alignItems: "start",
            }}
          >
            {meetings.map((meeting) => {
              const dateObj = new Date(meeting.date);

              const longDateString = dateObj
                .toLocaleDateString("es-SV", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                .toLowerCase();

              const timeString = dateObj.toLocaleTimeString("es-SV", {
                hour: "2-digit",
                minute: "2-digit",
              });

              const dateNorm = normalizeToDay(dateObj);
              const isToday = dateNorm === todayNorm;
              const isPastDay = dateNorm < todayNorm;

              const canAct = isToday || isPastDay;
              const hasAttendance = (meeting._count?.records ?? 0) > 0;

              // ── Colores de acento según estado (paleta desaturada) ──
              const accentHex = hasAttendance
                ? "#4ade80"   // green-400  – completada
                : isToday
                  ? "#60a5fa"   // blue-400   – hoy
                  : isPastDay
                    ? "#f87171"   // red-400    – atrasada
                    : "#94a3b8";  // slate-400  – próxima

              // ── Badge: texto+fondo pastel, usando inline style ──
              type BadgeStyle = { label: string; bg: string; color: string };
              let badge: BadgeStyle;
              if (hasAttendance) {
                badge = { label: "Completada", bg: "#dcfce7", color: "#15803d" };
              } else if (isToday) {
                badge = { label: "Hoy", bg: "#dbeafe", color: "#1d4ed8" };
              } else if (isPastDay) {
                badge = { label: "Atrasada", bg: "#fee2e2", color: "#991b1b" };
              } else {
                badge = { label: "Próxima", bg: "#f1f5f9", color: "#475569" };
              }

              const isDelayed = isPastDay && !hasAttendance;

              return (
                <div
                  key={meeting.id}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all"
                  style={{
                    boxShadow: "0 1px 4px 0 rgba(0,0,0,.07)",
                    borderLeft: `5px solid ${accentHex}`,
                  }}
                >
                  {/* ── Cabecera: nombre + badge + eliminar ── */}
                  <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-800" style={{ fontSize: "0.9375rem" }}>
                        {meeting.type}
                      </h3>
                      {canManage && (
                        <button
                          onClick={(e) => handleDelete(meeting.id, e)}
                          className="shrink-0 transition-colors"
                          style={{ color: "#cbd5e1" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
                          title="Eliminar reunión"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {/* Badge pastel con inline style */}
                    <span
                      className="shrink-0 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* ── Detalles ── */}
                  <div className="space-y-1 px-4 pb-3" style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      <span className="capitalize">{longDateString}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      <span>{timeString}</span>
                    </div>
                    {meeting.destacamento?.nombre && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                        <span>Destacamento {meeting.destacamento.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Footer de acción ── */}
                  <div style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "10px 16px" }}>
                    {(() => {
                      /* — Asistencia ya registrada — */
                      if (hasAttendance) {
                        return (
                          <button
                            onClick={() => onViewAttendance(meeting.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl transition-colors"
                            style={{
                              padding: "9px 0",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              backgroundColor: "#f0fdf4",
                              color: "#15803d",
                              border: "1px solid #86efac",
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Ver asistencia registrada
                          </button>
                        );
                      }

                      /* — Reunión futura — */
                      if (!canAct) {
                        return (
                          <div
                            className="flex w-full items-center justify-center gap-2 rounded-xl"
                            style={{
                              padding: "9px 0",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              backgroundColor: "#f1f5f9",
                              color: "#94a3b8",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <Clock3 size={15} />
                            Pendiente de realizar
                          </div>
                        );
                      }

                      /* — Lider territorial sin acceso para registrar — */
                      if (isTerritorial) {
                        return (
                          <div
                            className="flex w-full items-center justify-center gap-2 rounded-xl"
                            style={{
                              padding: "9px 0",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              backgroundColor: "#fff1f2",
                              color: "#be123c",
                              border: "1px solid #fda4af",
                            }}
                          >
                            <AlertCircle size={15} />
                            Sin asistencia registrada
                          </div>
                        );
                      }

                      /* — Lider con acción: tomar o registrar atrasada — */
                      const btnBg = isDelayed ? "#dc2626" : "#2563eb";
                      const btnHover = isDelayed ? "#b91c1c" : "#1d4ed8";

                      return (
                        <button
                          onClick={() => onTakeAttendance(meeting.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl transition-all active:scale-95"
                          style={{
                            padding: "10px 0",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            backgroundColor: btnBg,
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 2px 6px rgba(0,0,0,.15)",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = btnHover)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = btnBg)}
                        >
                          {isDelayed ? <AlertCircle size={16} /> : <Users size={16} />}
                          {isDelayed ? "Registrar Asistencia Atrasada" : "Tomar Asistencia"}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
