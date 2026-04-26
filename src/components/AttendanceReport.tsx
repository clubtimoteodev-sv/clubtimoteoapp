import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
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
  Trash2,
  ChevronDown,
  AlertCircle,
  MapPin,
  Clock3,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { ExportManager } from "./ExportManager";

// ── Paleta compartida con CalendarView ──────────────────────────
const C = {
  green:   { accent: "#4ade80", bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  red:     { accent: "#f87171", bg: "#fff1f2", text: "#be123c", border: "#fda4af" },
  blue:    { accent: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  amber:   { accent: "#fbbf24", bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  slate:   { accent: "#94a3b8", bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
  page:    "#f1f5f9",   // bg-slate-100
  card:    "#ffffff",
  divide:  "#f1f5f9",
  border:  "#e2e8f0",
  textMain:"#1e293b",
  textSub: "#64748b",
  textMute:"#94a3b8",
};

// ── Estilos compartidos ─────────────────────────────────────────
const cardBase: React.CSSProperties = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,.07)",
  overflow: "hidden",
};

const footerArea: React.CSSProperties = {
  backgroundColor: C.page,
  borderTop: `1px solid ${C.border}`,
  padding: "10px 16px",
};

// ── Tipos ───────────────────────────────────────────────────────
interface Explorer { id: string; nombre: string; apellidos: string; fotoUrl?: string | null; }
interface AttendanceRecordApi { id?: string; explorerId: string; attended: boolean; justification?: string | null; explorer?: Explorer; }
interface MeetingApi { id: string; date: string; type: string; createdAt?: string; records?: AttendanceRecordApi[]; destacamento?: { nombre: string }; }
interface AttendanceRecordView { explorerId: string; explorerName: string; attended: boolean; justification?: string; foto?: string; }
interface MeetingView { id: string; date: string; meetingType: string; meetingTypeName: string; destacamentoNombre?: string; attendanceRecords: AttendanceRecordView[]; }
interface AttendanceReportProps { onBack: () => void; initialMeetingId?: string; }
interface DeletionEntry {
  id: string;
  meetingId: string;
  meetingType: string;
  meetingDate: string;
  destacamentoId: string;
  destacamentoName: string;
  territorioId?: string | null;
  deletedById: string;
  deletedByName: string;
  justification: string;
  deletedAt: string;
}

const predefinedMeetingTypes = ["Reunión General", "Célula de Niños", "Actividad Especial", "Campamento"];
const legacyMeetingTypeMap: Record<string, string> = { "1": "Reunión General", "2": "Célula de Niños", "3": "Actividad Especial", "4": "Campamento" };
function normalizeMeetingType(type: string) { return legacyMeetingTypeMap[type] || type; }

// ── Utilidades ──────────────────────────────────────────────────
function getInitials(fullName: string) {
  const parts = fullName.split(" ");
  return `${parts[0]?.charAt(0) || ""}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}
function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
}
function getAttendanceStats(records: AttendanceRecordView[]) {
  const attended  = records.filter(r => r.attended).length;
  const absent    = records.filter(r => !r.attended).length;
  const total     = records.length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { attended, absent, total, percentage };
}
function getJustifiedCount(records: AttendanceRecordView[]) {
  return records.filter(r => !r.attended && (r.justification || "").trim() !== "").length;
}
function pctColor(pct: number) {
  if (pct >= 80) return C.green.text;
  if (pct >= 50) return "#b45309"; // amber
  return C.red.text;
}

// ── Componente Avatar simple (sin shadcn) ───────────────────────
function Avatar({ name, foto, size = 40 }: { name: string; foto?: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (foto && !err) {
    return (
      <img
        src={foto} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {getInitials(name)}
    </div>
  );
}

// ── Badge inline ────────────────────────────────────────────────
function Pill({ label, bg, color, border }: { label: string; bg: string; color: string; border: string }) {
  return (
    <span style={{
      backgroundColor: bg, color, border: `1px solid ${border}`,
      borderRadius: "0.375rem", padding: "1px 8px",
      fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── Componente principal ────────────────────────────────────────
export function AttendanceReport({ onBack, initialMeetingId }: AttendanceReportProps) {
  const [meetings,       setMeetings]       = useState<MeetingView[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingView | null>(null);
  const [isFiltersOpen,  setIsFiltersOpen]  = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingDetail,  setLoadingDetail]  = useState(false);
  const [period,         setPeriod]         = useState("3m");
  const [isEditing,      setIsEditing]      = useState(false);
  const [editDate,       setEditDate]       = useState("");
  const [editMeetingType, setEditMeetingType] = useState("");
  const [editAttendance, setEditAttendance] = useState<Record<string, AttendanceRecordView>>({});
  const [savingEdit,     setSavingEdit]     = useState(false);
  const [loadingEditors, setLoadingEditors] = useState(false);
  const [deleteModal,    setDeleteModal]    = useState({ open: false, justification: "", deleting: false });
  const [deletionLog,    setDeletionLog]    = useState<DeletionEntry[]>([]);
  const [loadingLog,     setLoadingLog]     = useState(false);
  const [showHistory,    setShowHistory]    = useState(false);
  const isDesktop = useIsDesktop();

  const isReadOnly = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role === "lider_territorial"; }
    catch { return false; }
  })();

  const territorialOverride = localStorage.getItem("overrideDestacamentoName");
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const globalName = storedUser.territorioNombre ? `Territorio ${storedUser.territorioNombre}` : "Destacamento";

  const outpostInfo = {
    name: territorialOverride || storedUser?.destacamento?.name || storedUser.destacamentoNombre || globalName,
    city: storedUser?.destacamento?.city || "", 
    leader: storedUser.name || "Líder",
  };

  useEffect(() => { loadMeetings(); loadDeletionLog(); }, []);
  useEffect(() => { if (initialMeetingId) openMeeting(initialMeetingId); }, [initialMeetingId]);

  const availableMeetingTypes = useMemo(() => {
    const fromMeetings = meetings.map(m => m.meetingTypeName);
    return Array.from(new Set([...predefinedMeetingTypes, ...fromMeetings])).sort();
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    let months = 3;
    if (period === "1m") months = 1;
    if (period === "6m") months = 6;
    if (period === "1y") months = 12;
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - months);
    return meetings.filter(m => new Date(m.date) >= startDate);
  }, [meetings, period]);

  function mapMeetingFromApi(meeting: MeetingApi): MeetingView {
    const normalizedType = normalizeMeetingType(meeting.type);
    return {
      id: meeting.id, date: meeting.date,
      meetingType: normalizedType, meetingTypeName: normalizedType,
      destacamentoNombre: meeting.destacamento?.nombre,
      attendanceRecords: (meeting.records || []).map(record => ({
        explorerId:    record.explorerId,
        explorerName:  record.explorer ? `${record.explorer.nombre} ${record.explorer.apellidos}` : "Explorador",
        attended:      record.attended,
        justification: record.justification || "",
        foto:          record.explorer?.fotoUrl || "",
      })),
    };
  }

  async function loadMeetings() {
    try {
      setLoadingMeetings(true);
      const data: MeetingApi[] = await apiFetch("/attendance/meetings");
      setMeetings(data.map(mapMeetingFromApi));
    } catch { toast.error("No se pudieron cargar las reuniones"); }
    finally { setLoadingMeetings(false); }
  }

  async function loadDeletionLog() {
    try {
      setLoadingLog(true);
      const data: DeletionEntry[] = await apiFetch("/attendance/deletion-log");
      setDeletionLog(data);
    } catch {
      // silencioso — el log es extra, no crítico
    } finally {
      setLoadingLog(false);
    }
  }

  async function openMeeting(meetingId: string) {
    try {
      setLoadingDetail(true);
      const data: MeetingApi = await apiFetch(`/attendance/meetings/${meetingId}`);
      setSelectedMeeting(mapMeetingFromApi(data));
      setIsEditing(false);
    } catch { toast.error("No se pudo cargar el detalle de la reunión"); }
    finally { setLoadingDetail(false); }
  }

  async function startEditing() {
    if (!selectedMeeting) return;
    setEditDate(new Date(selectedMeeting.date).toISOString().split("T")[0]);
    setEditMeetingType(selectedMeeting.meetingTypeName);

    // Registros existentes indexados por explorerId
    const existing: Record<string, AttendanceRecordView> = {};
    selectedMeeting.attendanceRecords.forEach(r => { existing[r.explorerId] = { ...r }; });

    try {
      setLoadingEditors(true);
      // Cargar TODOS los exploradores del destacamento
      const allExp: Explorer[] = await apiFetch("/exploradores");
      const mapped: Record<string, AttendanceRecordView> = {};
      allExp.forEach(exp => {
        if (existing[exp.id]) {
          // Ya tiene registro — conservar datos
          mapped[exp.id] = existing[exp.id];
        } else {
          // Nuevo explorador sin registro — agregar como ausente por defecto
          mapped[exp.id] = {
            explorerId:    exp.id,
            explorerName:  `${exp.nombre} ${exp.apellidos}`,
            attended:      false,
            justification: "",
            foto:          exp.fotoUrl || "",
          };
        }
      });
      setEditAttendance(mapped);
    } catch {
      // Fallback: solo exploradores con registro previo
      setEditAttendance(existing);
      toast.error("No se pudieron cargar todos los exploradores");
    } finally {
      setLoadingEditors(false);
    }

    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false); setEditAttendance({}); setEditDate(""); setEditMeetingType("");
  }

  function handleAttendanceChange(explorerId: string, attended: boolean) {
    setEditAttendance(prev => ({ ...prev, [explorerId]: { ...prev[explorerId], attended, justification: prev[explorerId]?.justification || "" } }));
  }

  function handleJustificationChange(explorerId: string, justification: string) {
    setEditAttendance(prev => ({ ...prev, [explorerId]: { ...prev[explorerId], justification } }));
  }

  async function saveEdit() {
    if (!selectedMeeting) return;
    if (!editMeetingType) { toast.error("Selecciona el tipo de reunión"); return; }
    try {
      setSavingEdit(true);
      const records = Object.values(editAttendance).map(r => ({ explorerId: r.explorerId, attended: r.attended, justification: r.justification || "" }));
      await apiFetch(`/attendance/meetings/${selectedMeeting.id}`, {
        method: "PATCH",
        body: JSON.stringify({ date: editDate, meetingType: editMeetingType, records }),
      });
      toast.success("Asistencia actualizada correctamente");
      setIsEditing(false);
      await loadMeetings();
      await openMeeting(selectedMeeting.id);
    } catch { toast.error("No se pudo actualizar la asistencia"); }
    finally { setSavingEdit(false); }
  }

  async function handleDelete() {
    if (!selectedMeeting || !deleteModal.justification.trim()) {
      toast.error("Debes escribir una justificación para eliminar");
      return;
    }
    try {
      setDeleteModal(prev => ({ ...prev, deleting: true }));
      await apiFetch(`/attendance/meetings/${selectedMeeting.id}`, {
        method: "DELETE",
        body: JSON.stringify({ justification: deleteModal.justification }),
      });
      toast.success("Reunión eliminada");
      setDeleteModal({ open: false, justification: "", deleting: false });
      setSelectedMeeting(null);
      // Recargar reuniones e historial desde la BD
      await loadMeetings();
      await loadDeletionLog();
    } catch {
      toast.error("No se pudo eliminar la reunión");
      setDeleteModal(prev => ({ ...prev, deleting: false }));
    }
  }

  // ── Vista detalle de una reunión ──────────────────────────────
  if (selectedMeeting) {
    const currentRecords = isEditing ? Object.values(editAttendance) : selectedMeeting.attendanceRecords;
    const stats = getAttendanceStats(currentRecords);
    const justifiedCount = getJustifiedCount(currentRecords);

    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.page }}>
        {/* Header */}
        <header style={{
          position: isDesktop ? "sticky" : "static", top: 0, zIndex: 10,
          backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setSelectedMeeting(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: C.textSub,
                  backgroundColor: "white",
                  border: `1px solid ${C.border}`,
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
                Volver
              </button>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: C.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Detalle de Asistencia
                </p>
                <p style={{ fontSize: "0.75rem", color: C.textMute, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatShortDate(selectedMeeting.date)}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <ExportManager
                data={currentRecords.map((r) => ({
                  ...r,
                  estado: r.attended ? "Presente" : "Ausente",
                  justificacionText: r.justification || "N/A"
                }))}
                availableColumns={[
                  { key: "explorerName", label: "Explorador" },
                  { key: "estado", label: "Estado" },
                  { key: "justificacionText", label: "Justificación" }
                ]}
                filename={`Asistencia_${selectedMeeting.meetingTypeName.replace(/ /g, "_")}_${selectedMeeting.date.split("T")[0]}`}
                reportTitle={`Asistencia: ${selectedMeeting.meetingTypeName} (${formatShortDate(selectedMeeting.date)})`}
                outpostInfo={{
                  ...outpostInfo,
                  name: selectedMeeting.destacamentoNombre || outpostInfo.name,
                }}
              />

              {/* Botones: eliminar + editar / guardar */}
              {!isReadOnly && (
              !isEditing ? (
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {/* Botón eliminar */}
                  <button
                    onClick={() => setDeleteModal({ open: true, justification: "", deleting: false })}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "0.6rem", border: `1px solid ${C.red.border}`, background: C.red.bg, cursor: "pointer", fontSize: "0.8125rem", color: C.red.text, fontWeight: 600, flexShrink: 0 }}
                    title="Eliminar reunión"
                  >
                    <Trash2 size={14} />
                    {isDesktop && "Eliminar"}
                  </button>
                  {/* Botón editar */}
                  <button
                    onClick={startEditing}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "0.6rem", border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: "0.8125rem", color: C.textSub, fontWeight: 500, flexShrink: 0 }}
                  >
                    <Pencil size={14} />
                    {isDesktop && "Editar"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={cancelEditing} disabled={savingEdit}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "0.6rem", border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: "0.8125rem", color: C.textSub, fontWeight: 500 }}
                  >
                    <XCircle size={14} />
                    {isDesktop && "Cancelar"}
                  </button>
                  <button
                    onClick={saveEdit} disabled={savingEdit}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "0.6rem", border: "none", background: "#2563eb", cursor: "pointer", fontSize: "0.8125rem", color: "#fff", fontWeight: 700 }}
                  >
                    <Save size={14} />
                    {isDesktop && (savingEdit ? "Guardando..." : "Guardar")}
                  </button>
                </div>
              )
            )}
            </div>
          </div>
        </header>

        <main style={{ padding: isDesktop ? "1.25rem 1.5rem 5rem" : "1.25rem 1rem 5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Info de la reunión */}
          <div style={cardBase}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: C.textMain }}>Información de la reunión</p>
              <p style={{ fontSize: "0.75rem", color: C.textMute, marginTop: 2 }}>Resumen general</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "0.875rem 1.25rem" }}>
              {[
                { label: "Fecha",         value: formatShortDate(selectedMeeting.date), color: C.textMain },
                { label: "Hora",           value: formatTime(selectedMeeting.date),       color: C.blue.text },
                { label: "Tipo",           value: selectedMeeting.meetingTypeName,        color: C.textMain },
                { label: "Explorad.",     value: String(stats.total),                    color: C.blue.text },
                { label: "Justificados",  value: String(justifiedCount),                 color: C.amber.text },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: C.page, borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats: presentes / ausentes / porcentaje */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div style={{ ...cardBase, padding: "0.875rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Presentes</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: C.green.text }}>{stats.attended}</p>
            </div>
            <div style={{ ...cardBase, padding: "0.875rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Ausentes</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: C.red.text }}>{stats.absent}</p>
            </div>
            <div style={{ ...cardBase, padding: "0.875rem", textAlign: "center" }}>
              <TrendingUp size={14} style={{ color: C.blue.text, margin: "0 auto 4px" }} />
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: pctColor(stats.percentage) }}>{stats.percentage}%</p>
            </div>
          </div>

          {/* Selector tipo en modo edición */}
          {isEditing && (
            <div style={cardBase}>
              <div style={{ padding: "0.875rem 1.25rem" }}>
                <Label style={{ fontSize: "0.75rem", color: C.textSub, fontWeight: 600 }}>Tipo de reunión</Label>
                <Select value={editMeetingType} onValueChange={setEditMeetingType}>
                  <SelectTrigger className="h-10 mt-1.5">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMeetingTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Registro de exploradores */}
          <div style={cardBase}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: C.textMain }}>Registro de Asistencia</p>
              <p style={{ fontSize: "0.75rem", color: C.textMute, marginTop: 2 }}>
                {isEditing
                  ? loadingEditors
                    ? "Cargando todos los exploradores..."
                    : `${Object.keys(editAttendance).length} exploradores — marca quién asistió`
                  : `${currentRecords.length} registros`
                }
              </p>
            </div>

            {currentRecords.map((record, idx) => {
              const isJustified = !record.attended && (record.justification || "").trim() !== "";

              return (
                <div
                  key={record.explorerId}
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderTop: idx === 0 ? "none" : `1px solid ${C.divide}`,
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <Avatar name={record.explorerName} foto={record.foto} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nombre + badge estado */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: C.textMain }}>{record.explorerName}</p>
                        {!isEditing && (
                          record.attended
                            ? <Pill label="Asistió"    bg={C.green.bg} color={C.green.text} border={C.green.border} />
                            : <Pill label="No asistió" bg={C.red.bg}   color={C.red.text}   border={C.red.border}   />
                        )}
                        {isJustified && (
                          <Pill label="Justificado" bg={C.amber.bg} color={C.amber.text} border={C.amber.border} />
                        )}
                      </div>

                      {/* Vista normal */}
                      {!isEditing && record.justification && (
                        <p style={{ fontSize: "0.8125rem", color: C.textSub, backgroundColor: C.amber.bg, border: `1px solid ${C.amber.border}`, borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                          <span style={{ fontWeight: 700 }}>Justificación: </span>
                          {record.justification}
                        </p>
                      )}

                      {/* Vista edición */}
                      {isEditing && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Checkbox
                              id={`att-${record.explorerId}`}
                              checked={record.attended}
                              onCheckedChange={(checked: boolean | "indeterminate") => handleAttendanceChange(record.explorerId, checked === true)}
                            />
                            <Label htmlFor={`att-${record.explorerId}`} style={{ fontSize: "0.8125rem", color: record.attended ? C.green.text : C.red.text, fontWeight: 600 }}>
                              {record.attended ? "Asistió" : "Faltó"}
                            </Label>
                          </div>
                          {!record.attended && (
                            <div>
                              <Label style={{ fontSize: "0.75rem", color: C.textSub, fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Justificación</Label>
                              <Textarea
                                value={record.justification || ""}
                                onChange={e => handleJustificationChange(record.explorerId, e.target.value)}
                                placeholder="Motivo de la ausencia"
                                rows={2}
                                style={{ fontSize: "0.8125rem" }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ── Modal de eliminación ── */}
        {deleteModal.open && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => !deleteModal.deleting && setDeleteModal(prev => ({ ...prev, open: false }))}
          >
            <div
              style={{ ...cardBase, width: "100%", maxWidth: "26rem", padding: 0, overflow: "hidden" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Cabecera del modal */}
              <div style={{ background: C.red.bg, borderBottom: `1px solid ${C.red.border}`, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: C.red.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={16} style={{ color: C.red.text }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: C.red.text }}>Eliminar reunión</p>
                  <p style={{ fontSize: "0.75rem", color: C.red.text, opacity: 0.75, marginTop: 1 }}>{selectedMeeting.meetingTypeName} · {formatShortDate(selectedMeeting.date)}</p>
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "0.8125rem", color: C.textSub, marginBottom: "0.875rem", lineHeight: 1.5 }}>
                  Esta acción <strong style={{ color: C.textMain }}>no se puede deshacer</strong>. El registro de asistencia de esta reunión también se eliminará.
                </p>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: C.textSub, display: "block", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Justificación <span style={{ color: C.red.text }}>*</span> <span style={{ fontWeight: 400, textTransform: "none", color: C.textMute }}>(requerido)</span>
                </label>
                <Textarea
                  placeholder="Ej: Reunión duplicada, creada por error, fecha incorrecta..."
                  value={deleteModal.justification}
                  onChange={e => setDeleteModal(prev => ({ ...prev, justification: e.target.value }))}
                  rows={3}
                  style={{ fontSize: "0.8125rem", resize: "vertical" }}
                  disabled={deleteModal.deleting}
                />
                <p style={{ fontSize: "0.7rem", color: deleteModal.justification.trim() ? C.green.text : C.textMute, marginTop: "0.4rem" }}>
                  {deleteModal.justification.trim()
                    ? `✓ Justificación ingresada (${deleteModal.justification.trim().length} car.)`
                    : "Debes explicar el motivo de la eliminación"}
                </p>
              </div>

              {/* Acciones */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "0.875rem 1.25rem", display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setDeleteModal({ open: false, justification: "", deleting: false })}
                  disabled={deleteModal.deleting}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.6rem", border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: "0.8125rem", color: C.textSub, fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteModal.deleting || !deleteModal.justification.trim()}
                  style={{
                    padding: "0.5rem 1.25rem", borderRadius: "0.6rem", border: "none",
                    background: deleteModal.justification.trim() ? C.red.text : "#e2e8f0",
                    cursor: deleteModal.justification.trim() ? "pointer" : "not-allowed",
                    fontSize: "0.8125rem", color: deleteModal.justification.trim() ? "#fff" : C.textMute,
                    fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem",
                    transition: "background 0.15s",
                  }}
                >
                  <Trash2 size={13} />
                  {deleteModal.deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vista lista de reuniones ────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.page }}>
      {/* Header */}
      <header style={{
        position: isDesktop ? "sticky" : "static", top: 0, zIndex: 10,
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: C.textSub,
                backgroundColor: "white",
                border: `1px solid ${C.border}`,
                borderRadius: "0.5rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: C.textMain }}>Ver Asistencia</p>
              <p style={{ fontSize: "0.75rem", color: C.textMute, marginTop: 1 }}>Historial de reuniones</p>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: isDesktop ? "1.25rem 1.5rem 5rem" : "1.25rem 1rem 5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

        {/* Filtros colapsables */}
        <div style={cardBase}>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.25rem", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={16} style={{ color: C.textMute, flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: C.textMain }}>Filtros</p>
                <p style={{ fontSize: "0.75rem", color: C.textMute }}>Rango de fechas · {filteredMeetings.length} resultado{filteredMeetings.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <ChevronDown size={16} style={{ color: C.textMute, transform: isFiltersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
          </button>

          {isFiltersOpen && (
            <div style={{ borderTop: `1px solid ${C.border}`, padding: "0.875rem 1.25rem" }}>
              <Label style={{ fontSize: "0.75rem", color: C.textSub, fontWeight: 600 }}>Periodo</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-10 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Último mes</SelectItem>
                  <SelectItem value="3m">Últimos 3 meses</SelectItem>
                  <SelectItem value="6m">Últimos 6 meses</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Estados de carga / vacío */}
        {loadingMeetings ? (
          <div style={{ ...cardBase, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite", marginBottom: "0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: C.textMute, fontWeight: 500 }}>Cargando reuniones...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div style={{ ...cardBase, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem" }}>
            <CalendarIcon size={40} style={{ color: C.border, marginBottom: "0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: C.textMute, fontWeight: 600 }}>Sin reuniones en este período</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
            gap: "0.75rem",
            alignItems: "start",
          }}>
          {filteredMeetings.map(meeting => {
            const stats       = getAttendanceStats(meeting.attendanceRecords);
            const noRecords   = meeting.attendanceRecords.length === 0;
            const isPast      = new Date(meeting.date) <= new Date();
            const isDelayed   = isPast && noRecords;

            // Acento izquierdo según estado
            const accent = isDelayed ? C.red.accent : stats.percentage >= 80 ? C.green.accent : stats.percentage >= 50 ? C.amber.accent : C.red.accent;

            return (
              <div
                key={meeting.id}
                onClick={() => openMeeting(meeting.id)}
                style={{
                  ...cardBase,
                  cursor: "pointer",
                  borderLeft: `5px solid ${accent}`,
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.1)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.07)")}
              >
                {/* Alerta atrasada */}
                {isDelayed && (
                  <div style={{ backgroundColor: C.red.bg, borderBottom: `1px solid ${C.red.border}`, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertCircle size={13} style={{ color: C.red.text, flexShrink: 0 }} />
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: C.red.text }}>Asistencia no registrada</p>
                  </div>
                )}

                {/* Cabecera */}
                <div style={{ padding: "0.875rem 1.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: C.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {meeting.meetingTypeName}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: 2, flexWrap: "wrap" }}>
                      <p style={{ fontSize: "0.8125rem", color: C.textSub }}>{formatShortDate(meeting.date)}</p>
                      <span style={{ fontSize: "0.75rem", color: C.textMute }}>·</span>
                      <p style={{ fontSize: "0.8125rem", color: C.blue.text, fontWeight: 600 }}>{formatTime(meeting.date)}</p>
                    </div>
                    {meeting.destacamentoNombre && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <MapPin size={11} style={{ color: C.blue.text }} />
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: C.blue.text }}>{meeting.destacamentoNombre}</p>
                      </div>
                    )}
                  </div>
                  <FileText size={16} style={{ color: C.textMute, flexShrink: 0 }} />
                </div>

                {/* Footer de stats */}
                {!noRecords && (
                  <div style={{ ...footerArea, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 0 }}>
                    <div>
                      <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Presentes</p>
                      <p style={{ fontWeight: 800, fontSize: "1rem", color: C.green.text }}>{stats.attended}/{stats.total}</p>
                    </div>
                    <div style={{ borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
                      <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Ausentes</p>
                      <p style={{ fontWeight: 800, fontSize: "1rem", color: C.red.text }}>{stats.absent}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.6875rem", color: C.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Asistencia</p>
                      <p style={{ fontWeight: 800, fontSize: "1rem", color: pctColor(stats.percentage) }}>{stats.percentage}%</p>
                    </div>
                  </div>
                )}

                {noRecords && (
                  <div style={{ ...footerArea }}>
                    <p style={{ textAlign: "center", fontSize: "0.8125rem", color: C.textMute }}>Sin registros aún</p>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* ── Historial de eliminaciones ── */}
        {(deletionLog.length > 0 || loadingLog) && (
          <div style={cardBase}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.25rem", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trash2 size={14} style={{ color: C.red.text }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: C.textMain }}>Historial de eliminaciones</p>
                  <p style={{ fontSize: "0.75rem", color: C.textMute }}>
                    {loadingLog ? "Cargando..." : `${deletionLog.length} registro${deletionLog.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} style={{ color: C.textMute, transform: showHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>

            {showHistory && (
              <div style={{ borderTop: `1px solid ${C.border}` }}>
                {loadingLog ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite", margin: "0 auto 0.5rem" }} />
                    <p style={{ fontSize: "0.8125rem", color: C.textMute }}>Cargando historial...</p>
                  </div>
                ) : deletionLog.map((entry, idx) => (
                  <div
                    key={entry.id}
                    style={{ padding: "1rem 1.25rem", borderTop: idx === 0 ? "none" : `1px solid ${C.divide}`, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
                  >
                    {/* Acento rojo */}
                    <div style={{ width: 3, borderRadius: 999, background: C.red.accent, alignSelf: "stretch", flexShrink: 0, minHeight: 44 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Tipo + fecha eliminación */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: C.textMain }}>{entry.meetingType}</p>
                        <span style={{
                          fontSize: "0.6875rem", fontWeight: 700, color: C.red.text, backgroundColor: C.red.bg,
                          border: `1px solid ${C.red.border}`, borderRadius: "0.375rem", padding: "1px 6px", whiteSpace: "nowrap",
                        }}>
                          Eliminada {new Date(entry.deletedAt).toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Fecha de la reunión */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <Clock3 size={11} style={{ color: C.textMute, flexShrink: 0 }} />
                        <p style={{ fontSize: "0.75rem", color: C.textSub }}>
                          Reunión: {formatShortDate(entry.meetingDate)} · {formatTime(entry.meetingDate)}
                        </p>
                      </div>

                      {/* Destacamento + quien borró */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} style={{ color: C.blue.text, flexShrink: 0 }} />
                          <p style={{ fontSize: "0.75rem", color: C.blue.text, fontWeight: 600 }}>{entry.destacamentoName}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Users size={11} style={{ color: C.textMute, flexShrink: 0 }} />
                          <p style={{ fontSize: "0.75rem", color: C.textSub }}>Por: <strong>{entry.deletedByName}</strong></p>
                        </div>
                      </div>

                      {/* Motivo */}
                      <div style={{ backgroundColor: C.red.bg, border: `1px solid ${C.red.border}`, borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                        <p style={{ fontSize: "0.75rem", color: C.red.text, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700 }}>Motivo: </span>{entry.justification}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
