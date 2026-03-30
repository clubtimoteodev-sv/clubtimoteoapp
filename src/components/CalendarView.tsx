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
  const isDesktop = useIsDesktop();
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
      {isDesktop && (
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
              <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
              Volver
            </button>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Calendario</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" }}>Crear y administrar reuniones</p>
            </div>
          </div>
          <Button type="button" onClick={goToCreate}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Crear reunión
          </Button>
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
            Calendario
          </span>
          <button
            type="button"
            onClick={goToCreate}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "0.5rem", border: "none", background: "#111827", color: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
          >
            <CalendarPlus style={{ width: "0.9rem", height: "0.9rem" }} />
            Crear
          </button>
        </div>
      )}

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
