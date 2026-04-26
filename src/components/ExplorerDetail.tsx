import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Clock3,
  FileText,
  Shield,
  HeartPulse,
  Users,
  ExternalLink,
  FileCheck2,
  Hash,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useIsDesktop } from "../hooks/useIsDesktop";
interface Explorer {
  id: string;
  codigoInterno?: string | null;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  direccion: string;
  alergias?: string | null;
  medicinaControlada?: string | null;
  foto?: string | null;
  fotoUrl?: string | null;
  recetaUrl?: string | null;
  permisoUrl?: string | null;
  estudia?: boolean;
  nivelEducativo?: string | null;
  nombreResponsable: string;
  telefonoResponsable: string;
  aceptoCristo: boolean;
  bautizado: boolean;
  asisteCelula: boolean;
  nombreLiderCelula?: string | null;
}

interface AttendanceApiRecord {
  id: string;
  meetingId: string;
  attended: boolean;
  justification?: string | null;
  meeting?: {
    id: string;
    date: string;
    type: string;
    createdAt?: string;
  };
}

interface AttendanceRecord {
  id: string;
  meetingId: string;
  date: string;
  meetingType: string;
  meetingTypeName: string;
  attended: boolean;
  justification?: string;
}

interface ExplorerDetailProps {
  explorerId: string;
  onBack: () => void;
  onOpenMeeting: (meetingId: string) => void;
}

const legacyMeetingTypeMap: Record<string, string> = {
  "1": "Reunión General",
  "2": "Célula de Niños",
  "3": "Actividad Especial",
  "4": "Campamento",
};

function normalizeMeetingType(type?: string) {
  if (!type) return "Sin tipo";
  return legacyMeetingTypeMap[type] || type;
}

export function ExplorerDetail({
  explorerId,
  onBack,
  onOpenMeeting,
}: ExplorerDetailProps) {
  const [explorer, setExplorer] = useState<Explorer | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Explorer | null>(null);

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const isReadOnly = storedUser.role === "lider_territorial";

  useEffect(() => {
    loadExplorer();
    loadAttendance();
  }, [explorerId]);

  async function loadExplorer() {
    try {
      setLoading(true);
      const data = await apiFetch(`/explorers/${explorerId}`);
      setExplorer(data);
    } catch (err) {
      console.error("Error cargando explorador:", err);
      toast.error("Error cargando explorador");
      setExplorer(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance() {
    try {
      setAttendanceLoading(true);
      const data: AttendanceApiRecord[] = await apiFetch(`/attendance/explorer/${explorerId}`);

      const mapped = data.map((record) => ({
        id: record.id,
        meetingId: record.meetingId,
        date: record.meeting?.date || "",
        meetingType: record.meeting?.type || "",
        meetingTypeName: normalizeMeetingType(record.meeting?.type),
        attended: record.attended,
        justification: record.justification || "",
      }));

      setAttendanceRecords(mapped);
    } catch (err) {
      console.error("Error cargando asistencia:", err);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Sin fecha válida";

    return date.toLocaleDateString("es-SV", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Sin fecha";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Sin fecha válida";

    return date.toLocaleString("es-SV", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateInputValue = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString.slice(0, 10);
    }
    return date.toISOString().split("T")[0];
  };

  const getInitials = (nombre: string, apellidos: string) => {
    return `${nombre?.charAt(0) || ""}${apellidos?.charAt(0) || ""}`.toUpperCase();
  };

  const buildFileUrl = (raw?: string | null) => {
    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `http://localhost:4000${raw}`;
  };

  const getPhotoSrc = () => {
    return buildFileUrl(explorer?.fotoUrl || explorer?.foto || null) || undefined;
  };

  const handleEdit = () => {
    if (!explorer) return;
    setEditForm({ ...explorer });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  const updateEditField = <K extends keyof Explorer>(field: K, value: Explorer[K]) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !explorer) return;

    try {
      const payload = {
        codigoInterno: editForm.codigoInterno || null,
        nombre: editForm.nombre,
        apellidos: editForm.apellidos,
        fechaNacimiento: editForm.fechaNacimiento,
        telefono: editForm.telefono,
        direccion: editForm.direccion,
        alergias: editForm.alergias || null,
        medicinaControlada: editForm.medicinaControlada || null,
        estudia: editForm.estudia ?? false,
        nivelEducativo: editForm.nivelEducativo || null,
        nombreResponsable: editForm.nombreResponsable,
        telefonoResponsable: editForm.telefonoResponsable,
        aceptoCristo: editForm.aceptoCristo,
        bautizado: editForm.bautizado,
        asisteCelula: editForm.asisteCelula,
        nombreLiderCelula: editForm.asisteCelula ? editForm.nombreLiderCelula || null : null,
        fotoUrl: editForm.fotoUrl || null,
        recetaUrl: editForm.recetaUrl || null,
        permisoUrl: editForm.permisoUrl || null,
      };

      const updated = await apiFetch(`/explorers/${explorer.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setExplorer(updated);
      setEditForm(null);
      setIsEditing(false);
      toast.success("Datos actualizados correctamente");
    } catch (error) {
      console.error("Error guardando cambios:", error);
      toast.error("No se pudo actualizar el explorador");
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const attended = attendanceRecords.filter((r) => r.attended).length;
    const absent = total - attended;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { total, attended, absent, percentage };
  };

  const stats = getAttendanceStats();
  const current = isEditing && editForm ? editForm : explorer;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Cargando explorador...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!explorer || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border border-gray-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-gray-500">Explorador no encontrado</p>
            <Button
              onClick={onBack}
              variant="outline"
              className="mt-4 w-full border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              Volver al Listado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recetaLink = buildFileUrl(current.recetaUrl);
  const permisoLink = buildFileUrl(current.permisoUrl);

  const inputClasses =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200";
  const textareaClasses =
    "mt-1 min-h-[90px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200";
  const checkboxLabelClasses =
    "flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700";
  const documentItemClasses =
    "flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 transition-colors hover:bg-gray-50";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb", // bg-gray-50
      }}
    >
      <header
        style={{
          position: isDesktop ? "sticky" : "static",
          top: 0, zIndex: 10,
          backgroundColor: "white",
          borderBottom: isDesktop ? "1px solid #e2e8f0" : "none",
          padding: isDesktop ? "0.75rem 1.5rem" : "0.5rem 1rem",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500, flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Volver
          </button>

          {isDesktop && (
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Detalles del Explorador</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" }}>Información personal y asistencia</p>
            </div>
          )}
        </div>

        {isEditing ? (
  <div className="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCancelEdit}
      className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <X className="mr-2 h-4 w-4" />
      <span className={isDesktop ? "" : "hidden sm:inline"}>Cancelar</span>
    </Button>

    <Button
      type="button"
      size="sm"
      onClick={handleSaveEdit}
      className="!border !border-green-600 !bg-green-600 !text-white shadow-sm hover:!bg-green-700"
    >
      <Save className="mr-2 h-4 w-4" />
      <span className={isDesktop ? "" : "hidden sm:inline"}>Guardar</span>
    </Button>
  </div>
) : !isReadOnly ? (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={handleEdit}
    className="border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
  >
    <Edit className="mr-2 h-4 w-4" />
    <span className={isDesktop ? "" : "hidden sm:inline"}>Editar</span>
  </Button>
) : null}


      </header>

      <main
        style={{
          maxWidth: "64rem",
          margin: "0 auto",
          padding: isDesktop ? "1.5rem" : "0.5rem",
        }}
        className="space-y-6"
      >
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 h-24 w-24 border border-gray-200">
                <AvatarImage src={getPhotoSrc()} alt={current.nombre} />
                <AvatarFallback className="bg-gray-100 text-2xl font-semibold text-gray-700">
                  {getInitials(current.nombre, current.apellidos)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-semibold text-gray-900">
                {current.nombre} {current.apellidos}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {calculateAge(current.fechaNacimiento)} años
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {current.aceptoCristo && (
                  <Badge className="border border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                    Aceptó a Cristo
                  </Badge>
                )}
                {current.bautizado && (
                  <Badge className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                    Bautizado en Agua
                  </Badge>
                )}
                {current.asisteCelula && (
                  <Badge className="border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50">
                    Asiste a Célula
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="datos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 border border-gray-200 bg-white shadow-sm">
            <TabsTrigger
              value="datos"
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
            >
              Datos
            </TabsTrigger>
            <TabsTrigger
              value="asistencia"
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
            >
              Asistencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="space-y-4">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  Datos Personales
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Código interno
                        </p>
                        <div className="relative">
                          
                          <input
                            className={`${inputClasses} pl-9`}
                            value={editForm?.codigoInterno || ""}
                            onChange={(e) => updateEditField("codigoInterno", e.target.value)}
                            placeholder="Código"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Fecha de nacimiento
                        </p>
                        <input
                          type="date"
                          className={inputClasses}
                          value={formatDateInputValue(editForm?.fechaNacimiento)}
                          onChange={(e) => updateEditField("fechaNacimiento", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Nombre
                        </p>
                        <input
                          className={inputClasses}
                          value={editForm?.nombre || ""}
                          onChange={(e) => updateEditField("nombre", e.target.value)}
                          placeholder="Nombre"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Apellidos
                        </p>
                        <input
                          className={inputClasses}
                          value={editForm?.apellidos || ""}
                          onChange={(e) => updateEditField("apellidos", e.target.value)}
                          placeholder="Apellidos"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Teléfono
                      </p>
                      <input
                        className={inputClasses}
                        value={editForm?.telefono || ""}
                        onChange={(e) => updateEditField("telefono", e.target.value)}
                        placeholder="Teléfono"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Dirección
                      </p>
                      <textarea
                        className={textareaClasses}
                        value={editForm?.direccion || ""}
                        onChange={(e) => updateEditField("direccion", e.target.value)}
                        placeholder="Dirección"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Fecha de Nacimiento
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(current.fechaNacimiento)}
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Teléfono
                        </p>
                        <p className="mt-1 text-sm text-gray-900">{current.telefono}</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Dirección
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-900">
                          {current.direccion}
                        </p>
                      </div>
                    </div>

                    {current.codigoInterno && (
                      <>
                        <Separator className="bg-gray-200" />
                        <div className="flex items-start gap-3">
                          <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Código interno
                            </p>
                            <p className="mt-1 text-sm text-gray-900">{current.codigoInterno}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <HeartPulse className="mr-2 h-4 w-4 text-gray-500" />
                  Información Médica
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Alergias
                      </p>
                      <textarea
                        className={textareaClasses}
                        value={editForm?.alergias || ""}
                        onChange={(e) => updateEditField("alergias", e.target.value)}
                        placeholder="Alergias"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Medicina controlada
                      </p>
                      <textarea
                        className={textareaClasses}
                        value={editForm?.medicinaControlada || ""}
                        onChange={(e) =>
                          updateEditField("medicinaControlada", e.target.value)
                        }
                        placeholder="Medicina controlada"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Alergias
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {current.alergias || "No registradas"}
                      </p>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Medicina controlada
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {current.medicinaControlada || "No registrada"}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                  Educación y Vida Cristiana
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className={checkboxLabelClasses}>
                        <input
                          type="checkbox"
                          checked={!!editForm?.estudia}
                          onChange={(e) => updateEditField("estudia", e.target.checked)}
                        />
                        Estudia actualmente
                      </label>

                      <label className={checkboxLabelClasses}>
                        <input
                          type="checkbox"
                          checked={!!editForm?.aceptoCristo}
                          onChange={(e) => updateEditField("aceptoCristo", e.target.checked)}
                        />
                        Aceptó a Cristo
                      </label>

                      <label className={checkboxLabelClasses}>
                        <input
                          type="checkbox"
                          checked={!!editForm?.bautizado}
                          onChange={(e) => updateEditField("bautizado", e.target.checked)}
                        />
                        Bautizado en agua
                      </label>

                      <label className={checkboxLabelClasses}>
                        <input
                          type="checkbox"
                          checked={!!editForm?.asisteCelula}
                          onChange={(e) => updateEditField("asisteCelula", e.target.checked)}
                        />
                        Asiste a célula
                      </label>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nivel educativo
                      </p>
                      <input
                        className={inputClasses}
                        value={editForm?.nivelEducativo || ""}
                        onChange={(e) => updateEditField("nivelEducativo", e.target.value)}
                        placeholder="Nivel educativo"
                      />
                    </div>

                    {editForm?.asisteCelula && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Nombre del líder de célula
                        </p>
                        <input
                          className={inputClasses}
                          value={editForm?.nombreLiderCelula || ""}
                          onChange={(e) =>
                            updateEditField("nombreLiderCelula", e.target.value)
                          }
                          placeholder="Nombre del líder de célula"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Estudia
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {current.estudia ? "Sí" : "No"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Nivel educativo
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {current.nivelEducativo || "No registrado"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Aceptó a Cristo
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {current.aceptoCristo ? "Sí" : "No"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Bautizado
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {current.bautizado ? "Sí" : "No"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Líder de célula
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {current.asisteCelula
                            ? current.nombreLiderCelula || "No registrado"
                            : "No asiste a célula"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                  Responsable
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nombre del responsable
                      </p>
                      <input
                        className={inputClasses}
                        value={editForm?.nombreResponsable || ""}
                        onChange={(e) =>
                          updateEditField("nombreResponsable", e.target.value)
                        }
                        placeholder="Nombre del responsable"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Teléfono del responsable
                      </p>
                      <input
                        className={inputClasses}
                        value={editForm?.telefonoResponsable || ""}
                        onChange={(e) =>
                          updateEditField("telefonoResponsable", e.target.value)
                        }
                        placeholder="Teléfono del responsable"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nombre del responsable
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {current.nombreResponsable}
                      </p>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Teléfono del responsable
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {current.telefonoResponsable}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <FileText className="mr-2 h-4 w-4 text-gray-500" />
                  Documentos
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className={documentItemClasses}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">Receta médica</p>
                      <div className="mt-1 flex items-center gap-2">
                        {recetaLink ? (
                          <>
                            <FileCheck2 className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs text-green-700">Receta subida</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">No hay documento cargado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {recetaLink ? (
                    <a
                      href={recetaLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Ver archivo
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Sin archivo</span>
                  )}
                </div>

                <div className={documentItemClasses}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">Permiso firmado</p>
                      <div className="mt-1 flex items-center gap-2">
                        {permisoLink ? (
                          <>
                            <FileCheck2 className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs text-green-700">Permiso subido</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">No hay documento cargado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {permisoLink ? (
                    <a
                      href={permisoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Ver archivo
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Sin archivo</span>
                  )}
                </div>

                
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="asistencia" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{stats.total}</p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Asistió
                  </p>
                  <p className="mt-2 text-xl font-semibold text-green-600">
                    {stats.attended}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Faltó
                  </p>
                  <p className="mt-2 text-xl font-semibold text-red-600">
                    {stats.absent}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Porcentaje
                  </p>
                  <p
                    className={`mt-2 text-xl font-semibold ${
                      stats.percentage >= 80
                        ? "text-green-600"
                        : stats.percentage >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {stats.percentage}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                  <ClipboardCheck className="mr-2 h-4 w-4 text-gray-500" />
                  Historial de Asistencias
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {attendanceLoading ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">Cargando asistencias...</p>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">No hay registros de asistencia</p>
                    </div>
                  ) : (
                    attendanceRecords.map((record) => (
                      <button
                        key={record.id}
                        type="button"
                        className="w-full p-4 text-left transition-colors hover:bg-gray-50"
                        onClick={() => onOpenMeeting(record.meetingId)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {record.attended ? (
                                <Badge className="border border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Asistió
                                </Badge>
                              ) : (
                                <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  No asistió
                                </Badge>
                              )}

                              <Badge
                                variant="outline"
                                className="border-gray-200 bg-white text-gray-600"
                              >
                                {record.meetingTypeName}
                              </Badge>
                            </div>

                            <p className="mb-1 text-sm font-medium text-gray-900">
                              {record.meetingTypeName}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>{formatDateTime(record.date)}</span>
                            </div>

                            {record.justification && (
                              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <span className="font-semibold">Justificación:</span>{" "}
                                {record.justification}
                              </p>
                            )}
                          </div>

                          <span className="mt-1 shrink-0 text-xs font-medium text-blue-600">
                            Ver reunión
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}