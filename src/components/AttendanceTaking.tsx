import { useEffect, useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ArrowLeft, Save, Calendar as CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Explorer {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
}

interface AttendanceRecord {
  explorerId: string;
  attended: boolean;
  justification?: string;
}

interface MeetingRecordFromApi {
  explorerId: string;
  attended: boolean;
  justification?: string | null;
}

interface MeetingFromApi {
  id: string;
  date: string;
  type: string;
  records: MeetingRecordFromApi[];
}

interface AttendanceTakingProps {
  onBack: () => void;
  initialMeetingId?: string;
}

export function AttendanceTaking({ onBack, initialMeetingId }: AttendanceTakingProps) {
  const isDesktop = useIsDesktop();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [meetingType, setMeetingType] = useState("");
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [explorers, setExplorers] = useState<Explorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadExplorers() {
      try {
        setLoading(true);
        const data = await apiFetch("/explorers");
        setExplorers(data);
      } catch (error) {
        console.error("Error cargando exploradores:", error);
        toast.error("No se pudieron cargar los exploradores");
      } finally {
        setLoading(false);
      }
    }

    loadExplorers();
  }, []);

  useEffect(() => {
    if (!initialMeetingId) return;

    async function loadMeeting() {
      try {

        setLoadingMeeting(true);

        const meeting: MeetingFromApi = await apiFetch(
          `/attendance/meetings/${initialMeetingId}`
        );

        setSelectedDate(meeting.date.split("T")[0]);
        setMeetingType(meeting.type);

        const initialAttendance: Record<string, AttendanceRecord> = {};

        meeting.records.forEach((record) => {

          initialAttendance[record.explorerId] = {
            explorerId: record.explorerId,
            attended: record.attended,
            justification: record.justification || "",
          };

        });

        setAttendance(initialAttendance);

      } catch (error) {

        console.error("Error cargando reunión:", error);
        toast.error("No se pudo cargar la reunión");

      } finally {

        setLoadingMeeting(false);

      }
    }

    loadMeeting();

  }, [initialMeetingId]);

  const handleAttendanceChange = (explorerId: string, attended: boolean) => {

    setAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        explorerId,
        attended,
        justification: prev[explorerId]?.justification || "",
      },
    }));

  };

  const handleJustificationChange = (explorerId: string, justification: string) => {

    setAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        ...prev[explorerId],
        explorerId,
        attended: prev[explorerId]?.attended ?? false,
        justification,
      },
    }));

  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!meetingType) {

      toast.error("Por favor escribe el tipo de reunión");
      return;

    }

    if (explorers.length === 0) {

      toast.error("No hay exploradores para registrar");
      return;

    }

    try {

      setSaving(true);

      const records = explorers.map((explorer) => ({
        explorerId: explorer.id,
        attended: attendance[explorer.id]?.attended ?? false,
        justification: attendance[explorer.id]?.justification ?? "",
      }));

      await apiFetch(
        initialMeetingId
          ? `/attendance/meetings/${initialMeetingId}`
          : "/attendance",
        {
          method: initialMeetingId ? "PATCH" : "POST",
          body: JSON.stringify({
            meetingId: initialMeetingId,
            date: selectedDate,
            meetingType,
            records,
          }),
        }
      );

      toast.success(
        initialMeetingId
          ? "Asistencia actualizada exitosamente"
          : "Asistencia guardada exitosamente"
      );

      if (!initialMeetingId) {
        setAttendance({});
        setMeetingType("");
      }

    } catch (error) {

      console.error("Error guardando asistencia:", error);
      toast.error("Error guardando asistencia");

    } finally {

      setSaving(false);

    }
  };

  const getInitials = (nombre: string, apellidos: string) => {
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  const attendedCount = explorers.filter(
    (explorer) => attendance[explorer.id]?.attended === true
  ).length;

  const absentCount = explorers.filter(
    (explorer) => explorer.id in attendance && attendance[explorer.id]?.attended === false
  ).length;

  const isBusy = loading || loadingMeeting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">

      {isDesktop && (
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Volver
          </button>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Toma de Asistencia</p>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" }}>{initialMeetingId ? "Editando reunión existente" : "Registra la asistencia"}</p>
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
            Cancelar
          </button>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
            {initialMeetingId ? "Editar asistencia" : "Nueva asistencia"}
          </span>
        </div>
      )}

      <main className="px-4 py-5 pb-safe">

        <form onSubmit={handleSubmit} className="space-y-4">

          <Card className="border">

            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Configuración
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              <div className="space-y-2">
                <Label htmlFor="date">Fecha de la Reunión *</Label>

                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  disabled={!!initialMeetingId}
                />
              </div>

              {/* INPUT LIBRE PARA TIPO */}

              <div className="space-y-2">
                <Label htmlFor="meetingType">Tipo de Reunión *</Label>

                <Input
                  id="meetingType"
                  type="text"
                  placeholder="Ej: Reunión General, Campamento, Actividad..."
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  disabled={!!initialMeetingId}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">

                <Badge className="bg-green-100 text-green-800">
                  Asistieron: {attendedCount}
                </Badge>

                <Badge className="bg-red-100 text-red-800">
                  Faltaron: {absentCount}
                </Badge>

                <Badge className="bg-gray-100 text-gray-800">
                  Total: {explorers.length}
                </Badge>

              </div>

            </CardContent>

          </Card>

          {/* LISTA DE EXPLORADORES */}

          <Card className="border">

            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Users className="mr-2 h-4 w-4" />
                Lista de Exploradores
              </CardTitle>
            </CardHeader>
            
            <div className="flex justify-between px-4 pb-2 text-xs font-semibold text-gray-500">
  <span>Explorador</span>
  <span>Presente</span>
</div>

            <CardContent className="p-0">

              {isBusy ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Cargando exploradores...
                </div>

              ) : explorers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No hay exploradores registrados.
                </div>

              ) : (

                <div className="divide-y">

                  {explorers.map((explorer) => {

                    const isAttended = attendance[explorer.id]?.attended || false;
                    const justification = attendance[explorer.id]?.justification || "";

                    return (

                      <div key={explorer.id} className="p-4">

                        <div className="flex items-start space-x-3">

                          <Avatar className="h-10 w-10 flex-shrink-0">

                            <AvatarImage src={explorer.fotoUrl || ""} />

                            <AvatarFallback>
                              {getInitials(explorer.nombre, explorer.apellidos)}
                            </AvatarFallback>

                          </Avatar>

                          <div className="min-w-0 flex-1">

                            <div className="mb-3 flex items-center justify-between">

                              <p className="text-sm font-medium">
                                {explorer.nombre} {explorer.apellidos}
                              </p>

                              <Checkbox
                                checked={isAttended}
                                onCheckedChange={(checked) =>
                                  handleAttendanceChange(explorer.id, checked === true)
                                }
                              />

                            </div>

                            {!isAttended && explorer.id in attendance && (

                              <Textarea
                                placeholder="Motivo de la ausencia (opcional)"
                                value={justification}
                                onChange={(e) =>
                                  handleJustificationChange(explorer.id, e.target.value)
                                }
                                rows={2}
                              />

                            )}

                          </div>

                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

            </CardContent>

          </Card>

          <div className="flex gap-3">

            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={saving || isBusy}
            >

              <Save className="mr-2 h-4 w-4" />

              {saving
                ? "Guardando..."
                : initialMeetingId
                ? "Actualizar asistencia"
                : "Guardar"}

            </Button>

          </div>

        </form>

      </main>

    </div>
  );
}
