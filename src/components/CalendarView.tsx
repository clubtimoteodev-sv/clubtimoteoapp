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
import { toast } from "sonner@2.0.3";

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

  const isTerritorial = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.role === "lider_territorial";
    } catch {
      return false;
    }
  })();

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

  // Clasificar reuniones: "canAct" = hoy o pasada (puede tomar/ver asistencia)
  const completed = meetings.filter((m) => (m._count?.records ?? 0) > 0).length;
  const pending = meetings.filter((m) => {
    const d = new Date(m.date);
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    const isPast = now.getTime() > d.getTime() && !isToday;
    return (isToday || isPast) && (m._count?.records ?? 0) === 0;
  }).length;
  const upcoming = meetings.filter((m) => {
    const d = new Date(m.date);
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    return !isToday && new Date(m.date).getTime() > now.getTime();
  }).length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-2 -ml-2 shrink-0 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-base font-bold text-transparent truncate pr-2">
                Calendario
              </p>
              <p className="text-xs text-slate-500 truncate">Gestión de reuniones del club</p>
            </div>
          </div>

          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700 hover:shadow-md transition-all active:scale-95"
            >
              <CalendarPlus size={18} />
              <span className="hidden sm:inline">Programar Reunión</span>
              <span className="sm:hidden">Nueva</span>
            </button>
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
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-5 pb-16">

        {/* ── Formulario de creación ──────────────────────────── */}
        {isCreating && (
          <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
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
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-green-600">{completed}</p>
                <p className="text-xs text-slate-500 mt-0.5">Completadas</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-blue-600">{upcoming}</p>
                <p className="text-xs text-slate-500 mt-0.5">Próximas</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-red-500">{pending}</p>
                <p className="text-xs text-slate-500 mt-0.5">Sin asistencia</p>
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
          <div className="space-y-3">
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

              const isToday =
                dateObj.getDate() === now.getDate() &&
                dateObj.getMonth() === now.getMonth() &&
                dateObj.getFullYear() === now.getFullYear();

              // isPastDay: la fecha del CALENDARIO ya pasó (distinto día)
              const isPastDay =
                new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime() <
                new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

              // canAct: hoy O cualquier día pasado → se puede tomar/ver asistencia
              const canAct = isToday || isPastDay;
              const hasAttendance = (meeting._count?.records ?? 0) > 0;
              const isFuture = !isToday && !isPastDay;

              // Badge config
              type BadgeVariant = {
                label: string;
                className: string;
              };
              let badge: BadgeVariant;
              if (hasAttendance) {
                badge = { label: "Completada", className: "bg-green-50 text-green-700 border border-green-200" };
              } else if (isToday) {
                badge = { label: "Hoy", className: "bg-blue-50 text-blue-700 border border-blue-200" };
              } else if (isPastDay) {
                badge = { label: "Atrasada", className: "bg-red-50 text-red-600 border border-red-200 font-bold" };
              } else {
                badge = { label: "Próxima", className: "bg-slate-100 text-slate-600 border border-slate-200" };
              }

              const cardBorder = hasAttendance
                ? "border-green-100"
                : isToday
                ? "border-blue-200 ring-1 ring-blue-100"
                : isPastDay
                ? "border-red-200 ring-1 ring-red-50 shadow-sm"
                : "border-gray-200";

              const isDelayed = isPastDay && !hasAttendance;
              const cardBg = isDelayed ? "bg-red-50/30" : "bg-white";

              return (
                <div
                  key={meeting.id}
                  className={`rounded-2xl border ${cardBg} shadow-sm transition-all hover:shadow-md ${cardBorder}`}
                >
                  {/* Card top: tipo + badge + delete */}
                  <div className="flex items-start justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Ícono lateral con color contextual */}
                      <div
                        className={`shrink-0 rounded-xl p-2 ${
                          hasAttendance
                            ? "bg-green-50"
                            : isToday
                            ? "bg-blue-50"
                            : isPastDay
                            ? "bg-red-50"
                            : "bg-slate-100"
                        }`}
                      >
                        <CalendarIcon
                          size={16}
                          className={
                            hasAttendance
                              ? "text-green-600"
                              : isToday
                              ? "text-blue-600"
                              : isPastDay
                              ? "text-red-500"
                              : "text-slate-500"
                          }
                        />
                      </div>
                      <h3 className="truncate font-bold text-slate-800">{meeting.type}</h3>
                      {!isTerritorial && (
                        <button
                          onClick={(e) => handleDelete(meeting.id, e)}
                          className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                          title="Eliminar reunión"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <span
                      className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-1.5 px-5 pb-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="shrink-0 text-slate-400" />
                      <span className="capitalize">{longDateString}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} className="shrink-0 text-slate-400" />
                      <span>{timeString}</span>
                    </div>
                    {meeting.destacamento?.nombre && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="shrink-0 text-slate-400" />
                        <span>Destacamento {meeting.destacamento.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer / acción */}
                  <div className="border-t border-slate-100 px-5 py-3">
                    {(() => {
                      if (hasAttendance) {
                        return (
                          <button
                            onClick={() => onViewAttendance(meeting.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-bold text-green-700 hover:bg-green-100 border border-green-200 transition-colors shadow-sm"
                          >
                            <CheckCircle2 size={18} />
                            Ver asistencia registrada
                          </button>
                        );
                      }

                      if (!canAct) {
                        return (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-400 border border-slate-100 shadow-inner">
                            Esta reunión aún no se ha realizado
                          </div>
                        );
                      }

                      // If we are here, hasAttendance is false AND canAct is true.
                      if (isTerritorial) {
                        return (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 border border-red-100">
                            <AlertCircle size={16} />
                            El líder aún no registra asistencia
                          </div>
                        );
                      }

                      // It is 'Atrasada' if isPastDay is true but hasAttendance is false.
                      const isDelayed = isPastDay && !hasAttendance;

                      return (
                        <button
                          onClick={() => onTakeAttendance(meeting.id)}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow hover:shadow-md transition-all active:scale-95 ${
                            isDelayed 
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-300 ring-2 ring-transparent" 
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 ring-2 ring-transparent"
                          }`}
                        >
                          {isDelayed ? <AlertCircle size={18} /> : <Users size={18} />}
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
