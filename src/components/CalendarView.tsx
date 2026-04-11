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
  AlertCircle
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
    month: 'long', 
    year: 'numeric' 
  });
  return str.replace(/\b[a-zA-Z]/g, (l) => l.toUpperCase());
};

export function CalendarView({ onTakeAttendance, onBack }: CalendarViewProps) {
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [isCreating, setIsCreating] = useState(false);

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

  const loadMeetings = async (date: Date) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/calendar/upcoming?month=${date.getMonth()}&year=${date.getFullYear()}`);
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
      setForm({ date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)), type: "" });
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
    if (e) {
      e.stopPropagation();
    }
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

  return (
    <div className="min-h-screen bg-slate-50 lg:bg-white text-slate-800 font-sans">
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 pt-4 pb-2 flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors flex items-center text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </button>
        {!isTerritorial && !isCreating && (
          <button onClick={() => setIsCreating(true)} className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center text-sm font-medium">
            <CalendarPlus className="h-4 w-4 mr-1.5" /> Crear reunión
          </button>
        )}
        {isCreating && (
          <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
            Cancelar creación
          </button>
        )}
      </div>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-4 pb-16">
        
        {isCreating ? (
          <div className="border border-slate-200 rounded-2xl p-6 sm:p-8 bg-white shadow-sm mt-4">
            <div className="flex items-center text-[1.1rem] font-bold text-slate-800 mb-6">
              <CalendarPlus className="h-5 w-5 mr-2.5 text-indigo-500" />
              Programar nueva reunión
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="meetingType" className="text-slate-700 font-medium text-sm">Tipo de reunión</Label>
                <Input
                  id="meetingType"
                  type="text"
                  placeholder="Ej: Reunión General, Campamento..."
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meetingDate" className="text-slate-700 font-medium text-sm">Fecha y hora</Label>
                <Input
                  id="meetingDate"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="rounded-lg h-11 w-full flex"
                />
              </div>
              <div className="flex justify-end pt-3">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 px-8 font-medium">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar reunión"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="flex items-center text-xl font-medium text-slate-800">
                <CalendarIcon className="mr-2.5 h-[1.35rem] w-[1.35rem] stroke-[2]" /> Calendario de Reuniones
              </h1>
              <p className="text-[0.85rem] text-slate-500 mt-1">
                Gestiona y visualiza tus reuniones programadas
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white mb-6 relative flex flex-col items-center justify-center">
              <button onClick={prevMonth} className="absolute left-3 p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg group transition-colors">
                <ChevronLeft className="h-4 w-4 stroke-[2.5] group-hover:text-slate-900" />
              </button>
              
              <div className="flex flex-col items-center">
                 <span className="text-[0.95rem] font-medium text-slate-800 capitalize">
                   {formatDisplayMonth(selectedMonth)}
                 </span>
                 <button onClick={goToCurrentMonth} className="text-[0.75rem] text-slate-500 hover:text-slate-800 mt-1 font-medium transition-colors">
                   Ir a este mes
                 </button>
              </div>

              <button onClick={nextMonth} className="absolute right-3 p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg group transition-colors">
                <ChevronRight className="h-4 w-4 stroke-[2.5] group-hover:text-slate-900" />
              </button>
            </div>

            {loading ? (
              <div className="border border-slate-200 rounded-xl p-12 bg-white flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full mb-3" />
                <span className="text-sm font-medium">Cargando...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-12 bg-white flex flex-col items-center justify-center text-slate-400 text-sm font-medium">
                <CalendarIcon className="h-8 w-8 mb-3 opacity-50" />
                No hay reuniones este mes
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const dateObj = new Date(meeting.date);
                  
                  const longDateString = dateObj.toLocaleDateString("es-SV", { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  }).toLowerCase();
                  
                  const timeString = dateObj.toLocaleTimeString("es-SV", { 
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

                  let badgeLabel = "";
                  let badgeClass = "";
                  
                  if (missedAttendance) {
                    badgeLabel = "Sin Asistencia";
                    badgeClass = "bg-red-100 text-red-600 font-bold border border-red-200/50";
                  } else if (isToday) {
                    badgeLabel = "Hoy";
                    badgeClass = "bg-[#dbeafe] text-[#2563eb] border border-blue-200/50";
                  } else if (isPast && hasAttendance) {
                    badgeLabel = "Completada";
                    badgeClass = "bg-[#dcfce7] text-[#16a34a] border border-emerald-200/50";
                  } else {
                    badgeLabel = "Próxima";
                    badgeClass = "bg-slate-100 text-slate-600 border border-slate-200/50";
                  }

                  return (
                    <div key={meeting.id} className={`border rounded-xl p-5 sm:p-6 bg-white sm:shadow-sm transition-all ${missedAttendance ? 'border-red-100 shadow-red-50' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[1.05rem] text-slate-800">{meeting.type}</h3>
                          {!isTerritorial && (
                            <button onClick={(e) => handleDelete(meeting.id, e)} className="text-slate-300 hover:text-red-500 transition-colors" title="Eliminar">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <span className={`px-2.5 py-[3px] rounded-full text-[0.7rem] font-semibold tracking-wide uppercase ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 text-[0.85rem] text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 stroke-[1.5]" /> 
                          {longDateString}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 stroke-[1.5]" /> 
                          {timeString}
                        </div>
                        {meeting.destacamento?.nombre && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 stroke-[1.5]" /> 
                            Destacamento {meeting.destacamento.nombre}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-1">
                        {missedAttendance && (
                          <div className="bg-red-50/50 text-red-500 border border-red-100 rounded-lg p-3 text-[0.8rem] font-medium flex justify-center items-center gap-2">
                            <AlertCircle className="h-4 w-4 fill-red-100/50" /> 
                            La asistencia no se tomó para esta reunión
                          </div>
                        )}

                        {!missedAttendance && isToday && !isTerritorial && (
                          <button onClick={() => onTakeAttendance(meeting.id)} className="w-full bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg py-2.5 text-[0.9rem] font-medium flex justify-center items-center gap-2 transition-colors">
                            <Users className="h-4 w-4" /> Tomar Asistencia
                          </button>
                        )}
                        
                        {!missedAttendance && isToday && isTerritorial && (
                           <button className="w-full border border-[#2563eb] text-[#2563eb] hover:bg-blue-50 rounded-lg py-2 text-[0.9rem] font-medium flex justify-center items-center transition-colors">
                             Ver Detalles
                           </button>
                        )}

                        {!missedAttendance && !isToday && !isPast && (
                          <div className="bg-slate-100/70 text-slate-400 rounded-lg p-3 text-[0.8rem] font-medium flex justify-center items-center text-center">
                            Esta reunión aún no se ha realizado
                          </div>
                        )}

                        {!missedAttendance && isPast && hasAttendance && (
                          <div className="bg-slate-100/70 text-slate-500 rounded-lg p-3 text-[0.8rem] font-medium flex justify-center items-center text-center">
                            La asistencia para esta reunión fue registrada correctamente.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
