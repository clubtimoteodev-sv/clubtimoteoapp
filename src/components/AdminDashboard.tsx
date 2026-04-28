import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";
import {
  Shield, Users, Bell, Download, RefreshCw, Lock, Unlock,
  AlertTriangle, CheckCircle2, Database, FileText, Eye,
  ChevronLeft, ChevronRight, Filter, X, Plus, KeyRound, Ban, UserCheck, Check, Edit2, Map as MapIcon, Church
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRow = {
  id: string; name: string; email: string; role: string;
  isLocked: boolean; failedLoginAttempts: number; createdAt: string;
  destacamento?: { id: string; nombre: string; ciudad: string } | null;
  territorio?: { id: string; nombre: string } | null;
};
type AuditEntry = {
  id: string; action: string; endpoint: string; method: string;
  createdAt: string; user?: { name: string; email: string; role: string } | null;
};
type Notification = {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: string;
};
type BackupEntry = { id: string; filename: string; createdAt: string; generatedBy?: { name: string } | null };
type Stats = {
  blockedCount: number; totalUsers: number; unreadNotifications: number;
  recentLogs: AuditEntry[]; lastBackup: BackupEntry | null;
};
type Territorio = { id: string; nombre: string; };
type Destacamento = { id: string; nombre: string; ciudad: string; territorioId: string; };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d).toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });
const METHOD_COLOR: Record<string, string> = {
  POST: "bg-blue-100 text-blue-700", PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700", DELETE: "bg-red-100 text-red-700",
  GET: "bg-green-100 text-green-700",
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  lider_territorial: "Líder Territorial",
  lider_destacamento: "Líder de Destacamento"
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, colorClass, bgClass }: { icon: any; label: string; value: number | string; colorClass: string; bgClass: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5">
      <div className={`shrink-0 rounded-lg p-4 ${bgClass} ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState<"overview" | "users" | "zones" | "audit" | "backups">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPages, setAuditPages] = useState(1);
  const [auditMethod, setAuditMethod] = useState("");
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [territories, setTerritories] = useState<Territorio[]>([]);
  const [destacamentos, setDestacamentos] = useState<Destacamento[]>([]);

  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPwdModal, setShowPwdModal] = useState<string | null>(null); // user ID
  
  // Catalog modals
  const [showDestacamentoModal, setShowDestacamentoModal] = useState(false);
  const [editingDestacamentoId, setEditingDestacamentoId] = useState<string | null>(null);
  
  const [showTerritorioModal, setShowTerritorioModal] = useState(false);
  const [tForm, setTForm] = useState({ nombre: "" });

  const [dForm, setDForm] = useState({ codigo: "", nombre: "", ciudad: "", territorioId: "" });

  // User Form
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "lider_destacamento",
    territorioId: "", destacamentoId: ""
  });
  const [pwdForm, setPwdForm] = useState("");

  const showToast = (msg: string, ok = true) => {
    window.alert(msg);
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try { setStats(await apiFetch("/admin/stats")); } catch { /* ignore */ }
  }, []);

  const loadUsers = useCallback(async () => {
    try { setUsers(await apiFetch("/admin/users")); } catch { /* ignore */ }
  }, []);

  const loadNotifications = useCallback(async () => {
    try { setNotifications(await apiFetch("/admin/notifications")); } catch { /* ignore */ }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: "20" });
      if (auditMethod) params.set("method", auditMethod);
      const d = await apiFetch(`/admin/audit?${params}`);
      setAudit(d.logs); setAuditTotal(d.total); setAuditPages(d.pages);
    } catch { /* ignore */ }
  }, [auditPage, auditMethod]);

  const loadBackups = useCallback(async () => {
    try { setBackups(await apiFetch("/admin/backup/history")); } catch { /* ignore */ }
  }, []);

  const loadCatalogs = useCallback(async () => {
    try {
      setTerritories(await apiFetch("/admin/catalog/territories"));
      setDestacamentos(await apiFetch("/admin/catalog/destacamentos"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadStats(); loadNotifications(); }, [loadStats, loadNotifications]);
  useEffect(() => { if (tab === "users" || tab === "zones") { loadUsers(); loadCatalogs(); } }, [tab, loadUsers, loadCatalogs]);
  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab, loadAudit]);
  useEffect(() => { if (tab === "backups") loadBackups(); }, [tab, loadBackups]);

  // Actions
  const handleAction = async (action: string, id: string, name: string) => {
    try {
      setLoading(true);
      await apiFetch(`/admin/users/${id}/${action}`, { method: "POST" });
      showToast(`Usuario ${name} actualizado (${action})`);
      loadUsers(); loadStats(); loadNotifications();
    } catch { showToast(`Error al actualizar ${name}`, false); }
    finally { setLoading(false); }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return showToast("Faltan campos requeridos", false);
    
    setLoading(true);
    try {
      if (editingUserId) {
        await apiFetch(`/admin/users/${editingUserId}`, { method: "PUT", body: formData });
        showToast("Usuario actualizado exitosamente");
      } else {
        if (!formData.password) return showToast("La contraseña es requerida", false);
        await apiFetch("/admin/users", { method: "POST", body: formData });
        showToast("Usuario creado exitosamente");
      }
      setShowUserModal(false);
      setEditingUserId(null);
      setFormData({ name: "", email: "", password: "", role: "lider_destacamento", territorioId: "", destacamentoId: "" });
      loadUsers(); loadStats();
    } catch (err: any) {
      showToast(`Error: ${err.message || "No se pudo guardar"}`, false);
    } finally { setLoading(false); }
  };

  const openEditModal = (u: UserRow) => {
    setFormData({
      name: u.name, email: u.email, password: "", role: u.role,
      territorioId: u.territorio?.id || "", destacamentoId: u.destacamento?.id || ""
    });
    setEditingUserId(u.id);
    setShowUserModal(true);
  };



  const handleCreateDestacamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDestacamentoId) {
        await apiFetch(`/admin/catalog/destacamentos/${editingDestacamentoId}`, { method: "PUT", body: dForm });
        showToast("Destacamento actualizado");
      } else {
        await apiFetch("/admin/catalog/destacamentos", { method: "POST", body: dForm });
        showToast("Destacamento creado");
      }
      setShowDestacamentoModal(false);
      setEditingDestacamentoId(null);
      setDForm({ codigo: "", nombre: "", ciudad: "", territorioId: "" });
      loadCatalogs();
    } catch (err: any) { showToast(err.message, false); }
    finally { setLoading(false); }
  };

  const handleCreateTerritorio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/admin/catalog/territories", { method: "POST", body: tForm });
      showToast("Territorio creado");
      setShowTerritorioModal(false);
      setTForm({ nombre: "" });
      loadCatalogs();
    } catch (err: any) { showToast(err.message, false); }
    finally { setLoading(false); }
  };

  const openEditDestacamento = (d: any) => {
    // Destacamento del catálogo no trae "codigo" a veces si el endpoint no lo envía,
    // wait, I need to make sure the catalog GET endpoint returns `codigo`. Let me check that next.
    // For now, assume it might have it or we fetch it.
    setDForm({ codigo: d.codigo || "", nombre: d.nombre, ciudad: d.ciudad || "", territorioId: d.territorioId });
    setEditingDestacamentoId(d.id);
    setShowDestacamentoModal(true);
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.length < 6) return showToast("La contraseña debe tener 6+ caracteres", false);
    setLoading(true);
    try {
      await apiFetch(`/admin/users/${showPwdModal}/change-password`, { method: "POST", body: { newPassword: pwdForm } });
      showToast("Contraseña actualizada correctamente");
      setShowPwdModal(null); setPwdForm("");
      loadUsers();
    } catch (err: any) {
      showToast(`Error: ${err.message || "No se pudo cambiar"}`, false);
    } finally { setLoading(false); }
  };

  const handleDismissNotif = async (id: string) => {
    try {
      await apiFetch(`/admin/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      loadStats();
    } catch { /* ignore */ }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/admin/backup/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `backup_clubtimoteo_${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup descargado correctamente");
      loadBackups(); loadStats();
    } catch { showToast("Error generando backup. Verifica que pg_dump esté disponible en el servidor.", false); }
    finally { setBackupLoading(false); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const TABS = [
    { key: "overview", label: "Dashboard", icon: Shield },
    { key: "users", label: "Usuarios & Accesos", icon: Users },
    { key: "zones", label: "Zonas & Destacamentos", icon: MapIcon },
    { key: "audit", label: "Auditoría de Sistema", icon: FileText },
    { key: "backups", label: "Respaldos SQL", icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-lg px-6 py-4 shadow-lg text-white text-sm font-semibold transition-all ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 size={20} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
          {toast.msg}
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Shield className="text-white h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">Admin Control Center</h1>
                <p className="hidden sm:block text-xs font-medium text-gray-500 uppercase mt-0.5">Gestión Maestra • Club Timoteo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => { loadStats(); loadNotifications(); }} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 transition-all">
                <RefreshCw size={16} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(v => !v)}
                  className={`p-2 rounded-lg border transition-all ${unreadCount > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-gray-500"}`}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="fixed sm:absolute bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden" style={{ right: 8, top: 58, width: 'min(320px, calc(100vw - 16px))' }}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Bell size={16} className="text-blue-500" /> Alertas de Seguridad
                      </span>
                      <button onClick={() => setShowNotifs(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center gap-2">
                          <CheckCircle2 size={24} className="text-green-500 opacity-50" />
                          <p className="text-sm text-gray-500">No hay alertas recientes.</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`p-3 mb-2 rounded-lg border ${n.read ? "bg-transparent border-transparent opacity-60" : "bg-gray-50 border-gray-200"} flex gap-3`}>
                          <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${n.type === "ACCOUNT_LOCKED" ? "bg-red-500" : "bg-blue-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${n.read ? "text-gray-700" : "font-bold text-gray-900"}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2">{fmt(n.createdAt)}</p>
                          </div>
                          {!n.read && (
                            <button onClick={() => handleDismissNotif(n.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tab Navigation — abbreviated on mobile */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-3 pt-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${tab === key ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <Icon size={13} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
        
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={Lock} label="Bloqueos Activos" value={stats?.blockedCount ?? "—"} colorClass="text-red-600" bgClass="bg-red-50" />
              <StatCard icon={Users} label="Usuarios Totales" value={stats?.totalUsers ?? "—"} colorClass="text-blue-600" bgClass="bg-blue-50" />
              <StatCard icon={Bell} label="Alertas Pendientes" value={stats?.unreadNotifications ?? "—"} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Actividad Reciente */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><Eye className="text-gray-600 h-5 w-5" /></div>
                    <h2 className="text-lg font-bold text-gray-800">Actividad Reciente</h2>
                  </div>
                  <button onClick={() => setTab("audit")} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">Ver todo <ChevronRight size={14} /></button>
                </div>
                
                <div className="space-y-4">
                  {(stats?.recentLogs ?? []).length === 0 ? (
                    <div className="py-6 text-center"><p className="text-gray-500 font-medium">Sin actividad aún.</p></div>
                  ) : (stats?.recentLogs ?? []).map(l => (
                    <div key={l.id} className="flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-1 rounded border border-gray-100 ${METHOD_COLOR[l.method] ?? "bg-gray-100 text-gray-600"}`}>
                        {l.method}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{l.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-500">{(l as any).user?.name ?? "Sistema"}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-400">{fmt(l.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Último Backup */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><Database className="text-blue-600 h-5 w-5" /></div>
                    <h2 className="text-lg font-bold text-gray-800">Estado de Respaldo</h2>
                  </div>
                  <button onClick={() => setTab("backups")} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">Gestionar <ChevronRight size={14} /></button>
                </div>
                
                {stats?.lastBackup ? (
                  <div className="bg-gray-800 rounded-xl p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">SQL DUMP OK</span>
                        <span className="text-xs text-gray-300">{fmt(stats.lastBackup.createdAt)}</span>
                      </div>
                      <p className="font-mono text-sm text-gray-200 mb-1 truncate">{stats.lastBackup.filename}</p>
                      <p className="text-sm text-gray-400">Generado por: <span className="text-gray-200">{(stats.lastBackup as any).generatedBy?.name ?? "—"}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <Database className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-600">No hay respaldos generados</p>
                    <button onClick={() => setTab("backups")} className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700">Ir a generador</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Directorio de Accesos</h2>
                <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados en el sistema</p>
              </div>
              <button 
                onClick={() => { setEditingUserId(null); setFormData({ name: "", email: "", password: "", role: "lider_destacamento", territorioId: "", destacamentoId: "" }); setShowUserModal(true); }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
              >
                <Plus size={18} /> Nuevo Acceso
              </button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {/* Mobile card view — visible on xs only */}
              <div className="sm:hidden divide-y divide-gray-100">
                {users.map(u => (
                  <div key={u.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${u.isLocked ? 'bg-red-500' : 'bg-blue-600'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 truncate text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${u.role === "superadmin" ? "bg-purple-100 text-purple-800" : u.role === "lider_territorial" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                          {u.isLocked
                            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">Bloqueado</span>
                            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800">Activo</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      {u.role !== "superadmin" && (
                        <button onClick={() => openEditModal(u)} className="p-2 rounded bg-gray-100 text-gray-600" title="Editar"><Edit2 size={14} /></button>
                      )}
                      <button onClick={() => setShowPwdModal(u.id)} className="p-2 rounded bg-gray-100 text-gray-600" title="Cambiar contraseña"><KeyRound size={14} /></button>
                      {u.isLocked
                        ? <button disabled={loading} onClick={() => handleAction("unlock", u.id, u.name)} className="flex items-center gap-1 px-2 py-1.5 rounded bg-green-100 text-green-800 text-[10px] font-bold"><Unlock size={12} /> Desbloquear</button>
                        : u.role !== "superadmin" && <button disabled={loading} onClick={() => { if(window.confirm(`¿Desactivar acceso a ${u.name}?`)) handleAction("deactivate", u.id, u.name); }} className="p-2 rounded bg-red-50 text-red-600" title="Desactivar"><Ban size={14} /></button>
                      }
                    </div>
                  </div>
                ))}
                {users.length === 0 && <div className="p-8 text-center text-gray-500">No hay usuarios para mostrar.</div>}
              </div>

              {/* Desktop table — hidden on mobile */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Rol & Asignación</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.isLocked ? 'bg-red-500' : 'bg-blue-600'}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${u.role === "superadmin" ? "bg-purple-100 text-purple-800" : u.role === "lider_territorial" ? "bg-blue-100 text-blue-800" : u.role === "admin" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                            {u.destacamento ? <><Database size={12}/> {u.destacamento.nombre}</> 
                              : u.territorio ? <><Users size={12}/> Territorio: {u.territorio.nombre}</>
                              : <span className="opacity-50">— Acceso Global —</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                              <Lock size={12} /> Bloqueado {u.failedLoginAttempts > 0 && `(${u.failedLoginAttempts})`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                              <CheckCircle2 size={12} /> Activo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Solo permitir editar nombre/correo/zona a lideres regulares por seguridad, no al superadmin */}
                            {u.role !== "superadmin" && (
                              <button onClick={() => openEditModal(u)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Editar Información"><Edit2 size={16} /></button>
                            )}
                            <button onClick={() => setShowPwdModal(u.id)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Cambiar Contraseña"><KeyRound size={16} /></button>
                            {u.isLocked ? (
                              <button disabled={loading} onClick={() => handleAction("unlock", u.id, u.name)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-100 text-green-800 text-xs font-bold hover:bg-green-200 transition-colors disabled:opacity-50">
                                <Unlock size={14} /> Desbloquear
                              </button>
                            ) : (
                              u.role !== "superadmin" && (
                                <button disabled={loading} onClick={() => { if(window.confirm(`¿Desactivar acceso a ${u.name}?`)) handleAction("deactivate", u.id, u.name); }} className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title="Desactivar Cuenta"><Ban size={16} /></button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div className="p-10 text-center text-gray-500">No hay usuarios para mostrar.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── ZONES ── */}
        {tab === "zones" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Catálogo de Zonas Geográficas</h2>
                <p className="text-sm text-gray-500 mt-1">Gestión de territorios y sus respectivos destacamentos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Territorios */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon size={18} className="text-blue-600" />
                    <h3 className="font-bold text-gray-800">Territorios</h3>
                  </div>
                  <button onClick={() => { setTForm({ nombre: "" }); setShowTerritorioModal(true); }} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                    <Plus size={14} /> Crear Territorio
                  </button>
                </div>
                <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[400px]">
                  {territories.map(t => (
                    <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <p className="font-bold text-gray-800">{t.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {destacamentos.filter(d => d.territorioId === t.id).length} destacamentos asignados
                      </p>
                    </div>
                  ))}
                  {territories.length === 0 && <div className="p-8 text-center text-gray-500">No hay territorios registrados.</div>}
                </div>
              </div>

              {/* Destacamentos */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Church size={18} className="text-blue-600" />
                    <h3 className="font-bold text-gray-800">Destacamentos / Iglesias</h3>
                  </div>
                  <button onClick={() => { setEditingDestacamentoId(null); setDForm({ codigo: "", nombre: "", ciudad: "", territorioId: "" }); setShowDestacamentoModal(true); }} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                    <Plus size={14} /> Crear Destacamento
                  </button>
                </div>
                <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[400px]">
                  {destacamentos.map(d => {
                    const terr = territories.find(t => t.id === d.territorioId);
                    return (
                      <div key={d.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-bold text-gray-800">{d.nombre}</p>
                            <p className="text-xs text-gray-500 mt-1">{d.ciudad}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {terr?.nombre || "Sin Territorio"}
                            </span>
                            <button onClick={() => openEditDestacamento(d)} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Editar Destacamento"><Edit2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {destacamentos.length === 0 && <div className="p-8 text-center text-gray-500">No hay destacamentos registrados.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIT ── */}
        {tab === "audit" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={18} /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Bitácora de Auditoría</h2>
                  <p className="text-xs text-gray-500">{auditTotal} registros de eventos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select value={auditMethod} onChange={e => { setAuditMethod(e.target.value); setAuditPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 outline-none">
                  <option value="">Todos los métodos</option>
                  {["POST","PUT","PATCH","DELETE"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Acción / Endpoint</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actor</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {audit.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 text-sm">{l.action}</p>
                        <p className="text-xs font-mono text-gray-500 mt-1">{l.endpoint}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border border-gray-200 ${METHOD_COLOR[l.method] ?? "bg-gray-100 text-gray-600"}`}>
                          {l.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{(l as any).user?.name ?? "Sistema"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-gray-500">{fmt(l.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {audit.length === 0 && <div className="p-10 text-center text-gray-500">No se encontraron registros.</div>}
            </div>

            {auditPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Página {auditPage} de {auditPages}</span>
                <div className="flex gap-2">
                  <button disabled={auditPage <= 1} onClick={() => setAuditPage(p => p - 1)} className="p-2 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
                  <button disabled={auditPage >= auditPages} onClick={() => setAuditPage(p => p + 1)} className="p-2 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BACKUPS ── */}
        {tab === "backups" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Generador SQL</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Crea un volcado completo de la base de datos.
                </p>
                <button
                  onClick={handleBackup}
                  disabled={backupLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-70"
                >
                  {backupLoading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                  {backupLoading ? "Generando..." : "Descargar Backup"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Historial de Operaciones</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[500px]">
                {backups.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">El historial está vacío.</div>
                ) : backups.map(b => (
                  <div key={b.id} className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-gray-100 rounded shrink-0"><FileText className="text-gray-500 h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold text-gray-700 truncate">{b.filename}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{fmt(b.createdAt)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><UserCheck size={12}/> {(b as any).generatedBy?.name ?? "Sistema"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── MODALS ── */}

      {/* 1. Modal Crear/Editar Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">{editingUserId ? "Editar Usuario" : "Nuevo Acceso"}</h2>
              <button onClick={() => setShowUserModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correo (Login)</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="juan@club.com" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editingUserId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña Inicial</label>
                    <input required={!editingUserId} minLength={6} type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mín. 6 caracteres" />
                  </div>
                )}
                <div className={editingUserId ? "col-span-2" : ""}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rol en Sistema</label>
                  <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value, destacamentoId: "", territorioId: ""})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="lider_destacamento">Líder Destacamento</option>
                    <option value="lider_territorial">Líder Territorial</option>
                  </select>
                </div>
              </div>

              {/* Conditional fields based on role */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mt-2">
                {formData.role === "lider_destacamento" ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-gray-700">Destacamento Asignado</label>
                      <button type="button" onClick={() => setShowDestacamentoModal(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">+ Nuevo</button>
                    </div>
                    <select required value={formData.destacamentoId} onChange={e => setFormData({...formData, destacamentoId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Seleccione un destacamento...</option>
                      {destacamentos.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.ciudad})</option>)}
                    </select>
                  </div>
                ) : formData.role === "lider_territorial" ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-gray-700">Territorio Asignado</label>
                    </div>
                    <select required value={formData.territorioId} onChange={e => setFormData({...formData, territorioId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Seleccione un territorio...</option>
                      {territories.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Guardando..." : (editingUserId ? "Guardar Cambios" : "Crear Usuario")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal Nuevo Destacamento */}
      {showDestacamentoModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Church size={18}/> {editingDestacamentoId ? "Editar Destacamento" : "Crear Destacamento"}</h3>
            <form onSubmit={handleCreateDestacamento} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Código</label>
                  <input required value={dForm.codigo} onChange={e => setDForm({...dForm, codigo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="#123" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
                  <input required value={dForm.ciudad} onChange={e => setDForm({...dForm, ciudad: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Santa Ana" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Iglesia/Destacamento</label>
                <input required value={dForm.nombre} onChange={e => setDForm({...dForm, nombre: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Iglesia El Calvario" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Territorio al que pertenece</label>
                <select required value={dForm.territorioId} onChange={e => setDForm({...dForm, territorioId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="">Seleccione territorio...</option>
                  {territories.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                {territories.length === 0 && <p className="text-xs text-red-500 mt-1">Crea un territorio primero.</p>}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowDestacamentoModal(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Territorio */}
      {showTerritorioModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MapIcon size={18}/> Crear Territorio</h3>
            <form onSubmit={handleCreateTerritorio} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Territorio</label>
                <input required value={tForm.nombre} onChange={e => setTForm({ nombre: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Ej. Zona Occidente" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowTerritorioModal(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Cambio Contraseña */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><KeyRound size={18} className="text-gray-500"/> Cambiar Contraseña</h2>
              <button onClick={() => {setShowPwdModal(null); setPwdForm("");}} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleChangePwd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva Contraseña</label>
                <input required minLength={6} type="text" value={pwdForm} onChange={e => setPwdForm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="Escriba la nueva contraseña" autoFocus />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => {setShowPwdModal(null); setPwdForm("");}} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={loading || pwdForm.length < 6} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
