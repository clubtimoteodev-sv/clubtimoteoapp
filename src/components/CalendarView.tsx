import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner@2.0.3";

type Meeting = {
  id: string;
  date: string;
  type: string;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [form, setForm] = useState({
    date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    type: "",
  });

  const formRef = useRef<HTMLDivElement | null>(null);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/calendar/upcoming");
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
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div>
                <p className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-base text-transparent">
                  Calendario
                </p>

                <p className="text-xs text-muted-foreground">
                  Crear y administrar reuniones
                </p>
              </div>
            </div>

            <Button type="button" onClick={goToCreate} className="hidden sm:inline-flex">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Crear próxima reunión
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-safe">
        <div className="space-y-4">
          

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

          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Próximas reuniones
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Cargando reuniones...
                </div>
              ) : meetings.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No hay reuniones registradas.
                </div>
              ) : (
                <div className="divide-y">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {meeting.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(meeting.date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onTakeAttendance(meeting.id)}
                          >
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Tomar asistencia
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDelete(meeting.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
