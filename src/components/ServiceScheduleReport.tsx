import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Users
} from "lucide-react";

interface ServiceScheduleReportProps {
  onBack: () => void;
  initialGroupId?: string;
}

interface Explorer {
  id: string;
  nombre: string;
  apellidos: string;
  codigoExplorador: string;
}

interface ServiceAttendance {
  id: string;
  takenAt: string;
  serviceNotes?: string;
  members: {
    explorer: Explorer;
    present: boolean;
    note?: string;
  }[];
}

export function ServiceScheduleReport({
  onBack,
  initialGroupId,
}: ServiceScheduleReportProps) {

  const [records, setRecords] = useState<ServiceAttendance[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialGroupId) {
      loadRecords(initialGroupId);
    }
  }, [initialGroupId]);

  async function loadRecords(groupId: string) {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/api/service-attendance/group/${groupId}`
      );

      setRecords(data);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">

      <header className="bg-white border-b sticky top-0">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4"/>
          </Button>

          <div>
            <h1 className="text-lg text-purple-600">
              Historial de Servicio
            </h1>
            <p className="text-xs text-muted-foreground">
              Registros de asistencia
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">

        {loading && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Cargando historial...
            </CardContent>
          </Card>
        )}

        {!loading && records.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No hay registros de asistencia
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">

          {records.map((record) => {

            const present = record.members.filter(m => m.present);
            const absent = record.members.filter(m => !m.present);

            const percent = Math.round(
              (present.length / record.members.length) * 100
            );

            const isOpen = expanded === record.id;

            return (
              <Card key={record.id}>
                <CardContent className="p-4">

                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpand(record.id)}
                  >
                    <div className="flex justify-between mb-3">

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-600"/>
                          <span className="text-sm">
                            {new Date(record.takenAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4"/>
                            {present.length}
                          </span>

                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4"/>
                            {absent.length}
                          </span>

                          <span className="text-muted-foreground">
                            {percent}%
                          </span>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4"/>
                        ) : (
                          <ChevronDown className="w-4 h-4"/>
                        )}
                      </Button>

                    </div>

                    <div className="w-full bg-gray-200 h-2 rounded">
                      <div
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-4">
  <div className="rounded-lg border bg-slate-50 p-3">
    <h3 className="text-sm font-medium text-slate-900 mb-2">
      Información
    </h3>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>
        Fecha: {new Date(record.takenAt).toLocaleDateString("es-SV")}
      </p>
      <p>
        Total miembros: {record.members.length}
      </p>
      <p>
        Presentes: {present.length}
      </p>
      <p>
        Ausentes: {absent.length}
      </p>
      <p>
        Porcentaje de asistencia: {percent}%
      </p>
    </div>
  </div>

  <div>
    <h3 className="text-sm font-medium text-green-700 mb-2">
      Presentes
    </h3>

    {present.length === 0 ? (
      <p className="text-sm text-muted-foreground">No hubo presentes.</p>
    ) : (
      <div className="space-y-2">
        {present.map((m) => (
          <div
            key={m.explorer.id}
            className="rounded-lg bg-green-50 border border-green-100 p-3"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">
                  {m.explorer.nombre} {m.explorer.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.explorer.codigoExplorador}
                </p>
              </div>
            </div>

            {m.note && m.note.trim() !== "" && (
              <div className="mt-2 rounded-md bg-white p-2 border">
                <p className="text-xs font-medium text-slate-700 mb-1">
                  Nota de la persona
                </p>
                <p className="text-sm text-slate-600">{m.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  <div>
    <h3 className="text-sm font-medium text-red-700 mb-2">
      Ausentes
    </h3>

    {absent.length === 0 ? (
      <p className="text-sm text-muted-foreground">No hubo ausentes.</p>
    ) : (
      <div className="space-y-2">
        {absent.map((m) => (
          <div
            key={m.explorer.id}
            className="rounded-lg bg-red-50 border border-red-100 p-3"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">
                  {m.explorer.nombre} {m.explorer.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.explorer.codigoExplorador}
                </p>
              </div>
            </div>

            {m.note && m.note.trim() !== "" && (
              <div className="mt-2 rounded-md bg-white p-2 border">
                <p className="text-xs font-medium text-slate-700 mb-1">
                  Nota de la persona
                </p>
                <p className="text-sm text-slate-600">{m.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  {record.serviceNotes && record.serviceNotes.trim() !== "" && (
    <div className="rounded-lg border bg-purple-50 p-3">
      <h3 className="text-sm font-medium text-purple-900 mb-2">
        Notas del servicio
      </h3>
      <p className="text-sm text-slate-700">{record.serviceNotes}</p>
    </div>
  )}
</div>
                  )}

                </CardContent>
              </Card>
            );
          })}

        </div>
      </main>
    </div>
  );
}