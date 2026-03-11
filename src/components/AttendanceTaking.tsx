import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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

const meetingTypes = [
  "Reunión General",
  "Célula de Niños",
  "Actividad Especial",
  "Campamento"
];

interface AttendanceTakingProps {
  onBack: () => void;
  initialMeetingId?: string;
}

export function AttendanceTaking({ onBack, initialMeetingId }: AttendanceTakingProps) {
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
          `/api/attendance/meetings/${initialMeetingId}`
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
      toast.error("Por favor selecciona el tipo de reunión");
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
          ? `/api/attendance/meetings/${initialMeetingId}`
          : "/api/attendance",
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
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-base text-transparent">
                Toma de Asistencia
              </p>
              <p className="text-xs text-muted-foreground">
                {initialMeetingId
                  ? "Editando reunión existente"
                  : "Registra la asistencia"}
              </p>
            </div>
          </div>
        </div>
      </header>

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
                <Label htmlFor="date" className="text-sm">
                  Fecha de la Reunión *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="h-11"
                  disabled={!!initialMeetingId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingType" className="text-sm">
                  Tipo de Reunión *
                </Label>
                <Select
                  value={meetingType}
                  onValueChange={setMeetingType}
                  disabled={!!initialMeetingId}
                >
                  <SelectTrigger id="meetingType" className="h-11">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="border-0 bg-green-100 text-xs text-green-800">
                  Asistieron: {attendedCount}
                </Badge>
                <Badge variant="secondary" className="border-0 bg-red-100 text-xs text-red-800">
                  Faltaron: {absentCount}
                </Badge>
                <Badge variant="secondary" className="border-0 bg-gray-100 text-xs text-gray-800">
                  Total: {explorers.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Users className="mr-2 h-4 w-4" />
                Lista de Exploradores
              </CardTitle>
            </CardHeader>
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
                            <AvatarImage src={explorer.fotoUrl || ""} alt={explorer.nombre} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-sm text-white">
                              {getInitials(explorer.nombre, explorer.apellidos)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="mr-2 min-w-0 flex-1 text-sm font-medium">
                                {explorer.nombre} {explorer.apellidos}
                              </p>

                              <div className="flex flex-shrink-0 items-center space-x-2">
                                <Checkbox
                                  id={`attendance-${explorer.id}`}
                                  checked={isAttended}
                                  onCheckedChange={(checked) =>
                                    handleAttendanceChange(explorer.id, checked === true)
                                  }
                                  className="h-5 w-5"
                                />
                                <Label
                                  htmlFor={`attendance-${explorer.id}`}
                                  className="cursor-pointer text-xs"
                                >
                                  {isAttended ? (
                                    <span className="font-medium text-green-600">Asistió</span>
                                  ) : (
                                    <span className="font-medium text-red-600">Faltó</span>
                                  )}
                                </Label>
                              </div>
                            </div>

                            {!isAttended && explorer.id in attendance && (
                              <div className="mt-3 space-y-2">
                                <Label
                                  htmlFor={`justification-${explorer.id}`}
                                  className="text-xs"
                                >
                                  Justificación
                                </Label>
                                <Textarea
                                  id={`justification-${explorer.id}`}
                                  placeholder="Motivo de la ausencia (opcional)"
                                  value={justification}
                                  onChange={(e) =>
                                    handleJustificationChange(explorer.id, e.target.value)
                                  }
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
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

          <div className="sticky bottom-0 flex gap-3 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 pt-4 pb-safe">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
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