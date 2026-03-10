import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  Filter,
  Save,
  Pencil,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

interface Explorer {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
}

interface AttendanceRecordApi {
  id?: string;
  explorerId: string;
  attended: boolean;
  justification?: string | null;
  explorer?: Explorer;
}

interface MeetingApi {
  id: string;
  date: string;
  type: string;
  createdAt?: string;
  records?: AttendanceRecordApi[];
}

interface AttendanceRecordView {
  explorerId: string;
  explorerName: string;
  attended: boolean;
  justification?: string;
  foto?: string;
}

interface MeetingView {
  id: string;
  date: string;
  meetingType: string;
  meetingTypeName: string;
  attendanceRecords: AttendanceRecordView[];
}

interface AttendanceReportProps {
  onBack: () => void;
  initialMeetingId?: string;
}

const predefinedMeetingTypes = [
  "Reunión General",
  "Célula de Niños",
  "Actividad Especial",
  "Campamento"
];

const legacyMeetingTypeMap: Record<string, string> = {
  "1": "Reunión General",
  "2": "Célula de Niños",
  "3": "Actividad Especial",
  "4": "Campamento",
};

function normalizeMeetingType(type: string) {
  return legacyMeetingTypeMap[type] || type;
}

export function AttendanceReport({ onBack, initialMeetingId }: AttendanceReportProps) {
  const [meetings, setMeetings] = useState<MeetingView[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingView | null>(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editMeetingType, setEditMeetingType] = useState("");
  const [editAttendance, setEditAttendance] = useState<Record<string, AttendanceRecordView>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (initialMeetingId) {
      openMeeting(initialMeetingId);
    }
  }, [initialMeetingId]);

  const availableMeetingTypes = useMemo(() => {
    const fromMeetings = meetings.map((m) => m.meetingTypeName);
    return Array.from(new Set([...predefinedMeetingTypes, ...fromMeetings])).sort();
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);

      if (filterType !== "all" && meeting.meetingTypeName !== filterType) {
        return false;
      }

      if (filterFrom) {
        const fromDate = new Date(filterFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (meetingDate < fromDate) {
          return false;
        }
      }

      if (filterTo) {
        const toDate = new Date(filterTo);
        toDate.setHours(23, 59, 59, 999);
        if (meetingDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [meetings, filterType, filterFrom, filterTo]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-SV", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-SV", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAttendanceStats = (meeting: { attendanceRecords: AttendanceRecordView[] }) => {
    const attended = meeting.attendanceRecords.filter((r) => r.attended).length;
    const absent = meeting.attendanceRecords.filter((r) => !r.attended).length;
    const total = meeting.attendanceRecords.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { attended, absent, total, percentage };
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    return `${names[0]?.charAt(0) || ""}${names[1]?.charAt(0) || ""}`.toUpperCase();
  };

  function mapMeetingFromApi(meeting: MeetingApi): MeetingView {
    const normalizedType = normalizeMeetingType(meeting.type);

    return {
      id: meeting.id,
      date: meeting.date,
      meetingType: normalizedType,
      meetingTypeName: normalizedType,
      attendanceRecords: (meeting.records || []).map((record) => ({
        explorerId: record.explorerId,
        explorerName: record.explorer
          ? `${record.explorer.nombre} ${record.explorer.apellidos}`
          : "Explorador",
        attended: record.attended,
        justification: record.justification || "",
        foto: record.explorer?.fotoUrl || "",
      })),
    };
  }

  async function loadMeetings() {
    try {
      setLoadingMeetings(true);

      const data: MeetingApi[] = await apiFetch("/api/attendance/meetings");
      const mappedMeetings = data.map(mapMeetingFromApi);

      setMeetings(mappedMeetings);
    } catch (error) {
      console.error("Error cargando reuniones:", error);
      toast.error("No se pudieron cargar las reuniones");
    } finally {
      setLoadingMeetings(false);
    }
  }

  async function openMeeting(meetingId: string) {
    try {
      setLoadingDetail(true);

      const data: MeetingApi = await apiFetch(`/api/attendance/meetings/${meetingId}`);
      const mappedMeeting = mapMeetingFromApi(data);

      setSelectedMeeting(mappedMeeting);
      setIsEditing(false);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      toast.error("No se pudo cargar el detalle de la reunión");
    } finally {
      setLoadingDetail(false);
    }
  }

  function clearFilters() {
    setFilterType("all");
    setFilterFrom("");
    setFilterTo("");
  }

  function startEditing() {
    if (!selectedMeeting) return;

    setEditDate(new Date(selectedMeeting.date).toISOString().split("T")[0]);
    setEditMeetingType(selectedMeeting.meetingTypeName);

    const mapped: Record<string, AttendanceRecordView> = {};
    selectedMeeting.attendanceRecords.forEach((record) => {
      mapped[record.explorerId] = { ...record };
    });

    setEditAttendance(mapped);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditAttendance({});
    setEditDate("");
    setEditMeetingType("");
  }

  function handleAttendanceChange(explorerId: string, attended: boolean) {
    setEditAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        ...prev[explorerId],
        attended,
        justification: prev[explorerId]?.justification || "",
      },
    }));
  }

  function handleJustificationChange(explorerId: string, justification: string) {
    setEditAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        ...prev[explorerId],
        justification,
      },
    }));
  }

  async function saveEdit() {
    if (!selectedMeeting) return;

    if (!editMeetingType) {
      toast.error("Selecciona el tipo de reunión");
      return;
    }

    try {
      setSavingEdit(true);

      const records = Object.values(editAttendance).map((record) => ({
        explorerId: record.explorerId,
        attended: record.attended,
        justification: record.justification || "",
      }));

      await apiFetch(`/api/attendance/meetings/${selectedMeeting.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date: editDate,
          meetingType: editMeetingType,
          records,
        }),
      });

      toast.success("Asistencia actualizada correctamente");
      setIsEditing(false);
      await loadMeetings();
      await openMeeting(selectedMeeting.id);
    } catch (error) {
      console.error("Error actualizando asistencia:", error);
      toast.error("No se pudo actualizar la asistencia");
    } finally {
      setSavingEdit(false);
    }
  }

  if (selectedMeeting) {
    const currentRecords = isEditing
      ? Object.values(editAttendance)
      : selectedMeeting.attendanceRecords;

    const stats = getAttendanceStats({ attendanceRecords: currentRecords });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedMeeting(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-base text-transparent">
                  Detalle de Asistencia
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(selectedMeeting.date)}
                </p>
              </div>

              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing} disabled={savingEdit}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingEdit ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-safe">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Card className="border">
              <CardContent className="p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo de reunión</Label>
                    <Select value={editMeetingType} onValueChange={setEditMeetingType}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMeetingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-2 text-xs text-muted-foreground">Tipo de Reunión</p>
                    <p className="truncate text-sm font-medium">
                      {selectedMeeting.meetingTypeName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Fecha</Label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="h-10"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-2 text-xs text-muted-foreground">Asistencia</p>
                    <p className="text-sm font-medium text-green-600">
                      {stats.attended} / {stats.total}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="mb-2 text-xs text-muted-foreground">Ausencias</p>
                  <p className="text-sm font-medium text-red-600">{stats.absent}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-medium">{stats.percentage}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registro de Asistencia</CardTitle>
              <CardDescription className="text-xs">
                {isEditing ? "Edita asistencia y justificaciones" : "Detalles de cada explorador"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {currentRecords.map((record) => (
                  <div key={record.explorerId} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={record.foto} alt={record.explorerName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-sm text-white">
                          {getInitials(record.explorerName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="mb-2 break-words text-sm font-medium">
                          {record.explorerName}
                        </p>

                        {!isEditing ? (
                          <>
                            <div className="mb-2 flex items-center space-x-2">
                              {record.attended ? (
                                <Badge className="border-0 bg-green-100 text-xs text-green-800">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Asistió
                                </Badge>
                              ) : (
                                <Badge className="border-0 bg-red-100 text-xs text-red-800">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  No asistió
                                </Badge>
                              )}
                            </div>

                            {record.justification && (
                              <p className="break-words rounded-md bg-amber-50 p-2 text-xs text-muted-foreground">
                                <span className="font-medium">Justificación:</span>{" "}
                                {record.justification}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-attendance-${record.explorerId}`}
                                checked={record.attended}
                                onCheckedChange={(checked) =>
                                  handleAttendanceChange(record.explorerId, checked === true)
                                }
                              />
                              <Label htmlFor={`edit-attendance-${record.explorerId}`} className="text-sm">
                                {record.attended ? "Asistió" : "Faltó"}
                              </Label>
                            </div>

                            {!record.attended && (
                              <div className="space-y-2">
                                <Label className="text-xs">Justificación</Label>
                                <Textarea
                                  value={record.justification || ""}
                                  onChange={(e) =>
                                    handleJustificationChange(record.explorerId, e.target.value)
                                  }
                                  placeholder="Motivo de la ausencia"
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-base text-transparent">
                Reporte de Asistencia
              </p>
              <p className="text-xs text-muted-foreground">
                Historial de reuniones
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-safe">
        <Card className="mb-4 border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            <CardDescription className="text-xs">
              Filtra por tipo de reunión o rango de fechas
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Tipo de reunión</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableMeetingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromDate" className="text-xs">
                  Desde
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDate" className="text-xs">
                  Hasta
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Resultados: {filteredMeetings.length}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadingMeetings ? (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Cargando reuniones...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No hay reuniones que coincidan con los filtros
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => {
              const stats = getAttendanceStats(meeting);

              return (
                <Card
                  key={meeting.id}
                  className="cursor-pointer border"
                  onClick={() => openMeeting(meeting.id)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start space-x-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {meeting.meetingTypeName}
                          </p>
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {meeting.meetingTypeName}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(meeting.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex-1 text-center">
                        <p className="mb-1 text-xs text-muted-foreground">Asistencia</p>
                        <p className="text-sm font-medium text-green-600">
                          {stats.attended}/{stats.total}
                        </p>
                      </div>

                      <div className="h-8 w-px bg-border" />

                      <div className="flex-1 text-center">
                        <p className="mb-1 text-xs text-muted-foreground">Porcentaje</p>
                        <p className="text-sm font-medium">{stats.percentage}%</p>
                      </div>

                      <div className="h-8 w-px bg-border" />

                      <div className="flex flex-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMeeting(meeting.id);
                          }}
                          disabled={loadingDetail}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}