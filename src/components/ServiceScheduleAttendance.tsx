import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, CheckCircle2, XCircle, FileText } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

interface ServiceScheduleAttendanceProps {
  onBack: () => void;
  initialGroupId?: string;
}

interface Explorer {
  id: string;
  codigoExplorador: string;
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

interface AttendanceMemberState {
  explorerId: string;
  present: boolean;
  note: string;
}

export function ServiceScheduleAttendance({
  onBack,
  initialGroupId,
}: ServiceScheduleAttendanceProps) {
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupApi[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || "");
  const [serviceNotes, setServiceNotes] = useState("");
  const [memberAttendance, setMemberAttendance] = useState<Record<string, AttendanceMemberState>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await apiFetch("/api/service-groups");
      setServiceGroups(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los grupos");
    } finally {
      setLoading(false);
    }
  }

  const selectedGroup = useMemo(
    () => serviceGroups.find((group) => group.id === selectedGroupId) || null,
    [serviceGroups, selectedGroupId]
  );

  const groupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.members.map((member) => ({
      id: member.explorer.id,
      code: member.explorer.codigoExplorador,
      name: `${member.explorer.nombre} ${member.explorer.apellidos}`,
    }));
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) {
      setMemberAttendance({});
      return;
    }

    const initialState: Record<string, AttendanceMemberState> = {};
    selectedGroup.members.forEach((member) => {
      initialState[member.explorer.id] = {
        explorerId: member.explorer.id,
        present: false,
        note: "",
      };
    });

    setMemberAttendance(initialState);
    setServiceNotes("");
  }, [selectedGroup]);

  function handleToggleAttendance(explorerId: string) {
    setMemberAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        ...prev[explorerId],
        explorerId,
        present: !prev[explorerId]?.present,
        note: prev[explorerId]?.note || "",
      },
    }));
  }

  function handleNoteChange(explorerId: string, note: string) {
    setMemberAttendance((prev) => ({
      ...prev,
      [explorerId]: {
        ...prev[explorerId],
        explorerId,
        present: prev[explorerId]?.present || false,
        note,
      },
    }));
  }

  function markAllPresent() {
    const updated: Record<string, AttendanceMemberState> = {};
    groupMembers.forEach((member) => {
      updated[member.id] = {
        explorerId: member.id,
        present: true,
        note: memberAttendance[member.id]?.note || "",
      };
    });
    setMemberAttendance(updated);
  }

  function markAllAbsent() {
    const updated: Record<string, AttendanceMemberState> = {};
    groupMembers.forEach((member) => {
      updated[member.id] = {
        explorerId: member.id,
        present: false,
        note: memberAttendance[member.id]?.note || "",
      };
    });
    setMemberAttendance(updated);
  }

  async function handleSaveAttendance() {
    if (!selectedGroupId) {
      toast.error("Selecciona un grupo");
      return;
    }

    if (groupMembers.length === 0) {
      toast.error("Este grupo no tiene miembros");
      return;
    }

    try {
      setSaving(true);

      const members = groupMembers.map((member) => ({
        explorerId: member.id,
        present: memberAttendance[member.id]?.present ?? false,
        note: memberAttendance[member.id]?.note ?? "",
      }));

      await apiFetch("/api/service-attendance", {
        method: "POST",
        body: JSON.stringify({
          groupId: selectedGroupId,
          serviceNotes,
          members,
        }),
      });

      toast.success("Asistencia guardada correctamente");

      const resetState: Record<string, AttendanceMemberState> = {};
      groupMembers.forEach((member) => {
        resetState[member.id] = {
          explorerId: member.id,
          present: false,
          note: "",
        };
      });

      setMemberAttendance(resetState);
      setServiceNotes("");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la asistencia");
    } finally {
      setSaving(false);
    }
  }

  const presentMembers = groupMembers.filter(
    (member) => memberAttendance[member.id]?.present === true
  );

  const absentMembers = groupMembers.filter(
    (member) => memberAttendance[member.id]?.present !== true
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="!text-slate-700">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-base font-medium text-slate-900">
                Asistencia de Servicio
              </p>
              <p className="text-xs text-muted-foreground">
                Marca presentes y ausentes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-safe space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Asistencia de Servicio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona un grupo y registra la asistencia
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Grupo de servicio</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={loading ? "Cargando grupos..." : "Selecciona un grupo"} />
                </SelectTrigger>
                <SelectContent>
                  {serviceGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.day} - {new Date(group.date).toLocaleDateString("es-SV")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-purple-100 text-purple-800 border-0">
                  {selectedGroup.day}
                </Badge>
                <Badge variant="outline">
                  {new Date(selectedGroup.date).toLocaleDateString("es-SV")}
                </Badge>
                <Badge variant="outline">
                  Miembros: {groupMembers.length}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedGroup && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-semibold text-green-600">
                    {presentMembers.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Presentes</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-semibold text-red-600">
                    {absentMembers.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Ausentes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 !text-green-700"
                onClick={markAllPresent}
                type="button"
              >
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-xs">Todos Presentes</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 !text-red-700"
                onClick={markAllAbsent}
                type="button"
              >
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-xs">Todos Ausentes</span>
                </div>
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium">Marcar Asistencia</h2>
                  <div className="text-sm text-muted-foreground">
                    {presentMembers.length}/{groupMembers.length}
                  </div>
                </div>

                <div className="space-y-4">
                  {groupMembers.map((explorer) => {
                    const isPresent = memberAttendance[explorer.id]?.present || false;

                    return (
                      <div key={explorer.id} className="space-y-2">
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                            isPresent
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <Checkbox
                            id={`attendance-${explorer.id}`}
                            checked={isPresent}
                            onCheckedChange={() => handleToggleAttendance(explorer.id)}
                          />

                          <label
                            htmlFor={`attendance-${explorer.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium">{explorer.name}</p>
                            <p className="text-xs text-muted-foreground">{explorer.code}</p>
                          </label>

                          {isPresent ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300" />
                          )}
                        </div>

                        <div className="pl-10">
                          <Textarea
                            placeholder={`Notas para ${explorer.name.split(" ")[0]}...`}
                            className="w-full h-16 text-sm"
                            value={memberAttendance[explorer.id]?.note || ""}
                            onChange={(e) => handleNoteChange(explorer.id, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="service-notes">Notas Generales del Servicio</Label>
                </div>

                <Textarea
                  id="service-notes"
                  placeholder="Escribe notas generales sobre el servicio de hoy..."
                  className="w-full h-24"
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                />
              </CardContent>
            </Card>

            <Button
              className="w-full h-14 !text-white !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-700 hover:!to-indigo-700"
              onClick={handleSaveAttendance}
              disabled={saving}
              type="button"
            >
              {saving
                ? "Guardando..."
                : `Guardar Asistencia (${presentMembers.length} presentes)`}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}