import { useState, useEffect, lazy, Suspense } from "react";
import { Eye, X } from "lucide-react";

import { Sidebar } from "./components/Sidebar";
import { MobileHeader } from "./components/MobileHeader";
import { Login } from "./components/Login";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import Home from "./components/Home";

// Code splitting: Carga diferida de módulos pesados
const CalendarView = lazy(() => import("./components/CalendarView").then(m => ({ default: m.CalendarView })));
const RegionalExplorers = lazy(() => import("./components/RegionalExplorers"));
const RegionalComparison = lazy(() => import("./components/RegionalComparison"));
const PersonalDataForm = lazy(() => import("./components/PersonalDataForm").then(m => ({ default: m.PersonalDataForm })));
const ExplorersList = lazy(() => import("./components/ExplorersList").then(m => ({ default: m.ExplorersList })));
const ExplorerDetail = lazy(() => import("./components/ExplorerDetail").then(m => ({ default: m.ExplorerDetail })));
const AttendanceTaking = lazy(() => import("./components/AttendanceTaking").then(m => ({ default: m.AttendanceTaking })));
const AttendanceReport = lazy(() => import("./components/AttendanceReport").then(m => ({ default: m.AttendanceReport })));
const FinanceManager = lazy(() => import("./components/FinanceManager").then(m => ({ default: m.FinanceManager })));
const ServiceGroups = lazy(() => import("./components/ServiceGroups").then(m => ({ default: m.ServiceGroups })));
const ServiceScheduleCreation = lazy(() => import("./components/ServiceScheduleCreation").then(m => ({ default: m.ServiceScheduleCreation })));
const ServiceScheduleAttendance = lazy(() => import("./components/ServiceScheduleAttendance").then(m => ({ default: m.ServiceScheduleAttendance })));
const ServiceScheduleReport = lazy(() => import("./components/ServiceScheduleReport").then(m => ({ default: m.ServiceScheduleReport })));
const DashboardTerritorial = lazy(() => import("./components/DashboardTerritorial"));
const RegionalReport = lazy(() => import("./components/RegionalReport"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const Settings = lazy(() => import("./components/Settings").then(m => ({ default: m.Settings })));

const LoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", minHeight: "400px" }}>
    <div style={{ padding: "1.5rem", borderRadius: "1rem", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "4px solid #e0e7ff", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <span style={{ color: "#4b5563", fontWeight: 500 }}>Cargando módulo...</span>
    </div>
  </div>
);

type AttendanceReportSource = "menu" | "explorer-detail";

const ProtectedRoute = ({ allowedRoles, currentRole, children }: { allowedRoles: string[], currentRole?: string, children: React.ReactNode }) => {
  if (!currentRole || !allowedRoles.includes(currentRole)) return <Home />;
  return <>{children}</>;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [activeSection, setActiveSection] = useState(() => {
    if (!localStorage.getItem("token")) return "login";
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user.role === "superadmin") return "admin-home";
        if (user.role === "lider_territorial") return "territorial-home";
      }
    } catch { /* ignore */ }
    return "home";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedExplorerId, setSelectedExplorerId] = useState<string | null>(null);
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [drilledName, setDrilledName] = useState<string>(() => {
    return localStorage.getItem("overrideDestacamentoId") ? "Iglesia Seleccionada" : "";
  });
  const [attendanceReportSource, setAttendanceReportSource] =
    useState<AttendanceReportSource>("menu");

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; destacamentoNombre?: string; territorioNombre?: string; mustChangePassword?: boolean } | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // ── Flag de cambio obligatorio de contraseña ──────────────────────────────────
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) return JSON.parse(raw).mustChangePassword === true;
    } catch { /* ignore */ }
    return false;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  const goHome = () => {
    const isDrilledDown = !!localStorage.getItem("overrideDestacamentoId");
    if (isDrilledDown) {
      setActiveSection("view-destacamento");
    } else if (currentUser?.role === "lider_territorial") {
      setActiveSection("territorial-home");
    } else {
      setActiveSection("home");
    }
  };

  const exitDrillDown = () => {
    localStorage.removeItem("overrideDestacamentoId");
    localStorage.removeItem("overrideDestacamentoName");
    setDrilledName("");
    if (currentUser?.role === "lider_territorial") {
      setActiveSection("territorial-home");
    } else {
      setActiveSection("home");
    }
  };

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
    localStorage.removeItem("overrideDestacamentoId");
    localStorage.removeItem("overrideDestacamentoName");
    setDrilledName("");
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        // Verificar cambio obligatorio de contraseña
        if (user.mustChangePassword) {
          setMustChangePassword(true);
          return;
        }
        if (user.role === "superadmin") { setActiveSection("admin-home"); return; }
        if (user.role === "lider_territorial") { setActiveSection("territorial-home"); return; }
      }
    } catch { /* ignore */ }
    setActiveSection("home");
  };

  const handleLogout = () => {
    // ✅ SEGURIDAD: Limpiar TODA la sesión del localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("overrideDestacamentoId");
    localStorage.removeItem("overrideDestacamentoName");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveSection("login");
    setSelectedExplorerId(null);
    setSelectedServiceGroupId(null);
    setSelectedMeetingId(null);
    setDrilledName("");
    setAttendanceReportSource("menu");
    setIsSidebarOpen(false);
  };

  const handleSidebarNavigate = (section: string) => {
    if (section.startsWith("view-destacamento:")) {
      const [, id, nombre] = section.split(":");
      localStorage.setItem("overrideDestacamentoId", id);
      localStorage.setItem("overrideDestacamentoName", nombre);
      setDrilledName(nombre);
      setActiveSection("view-destacamento");
      setIsSidebarOpen(false);
      return;
    }

    if (section === "territorial-home") {
      localStorage.removeItem("overrideDestacamentoId");
      localStorage.removeItem("overrideDestacamentoName");
      setDrilledName("");
    }

    if (section === "attendance-taking") {
      setSelectedMeetingId(null);
    }

    if (section === "attendance-report") {
      setSelectedMeetingId(null);
      setAttendanceReportSource("menu");
    }

    if (section !== "explorer-detail") {
      setSelectedExplorerId(null);
    }

    if (
      section !== "service-schedule-attendance" &&
      section !== "service-schedule-report"
    ) {
      setSelectedServiceGroupId(null);
    }

    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const handleBackFromAttendanceReport = () => {
    if (attendanceReportSource === "explorer-detail" && selectedExplorerId) {
      setActiveSection("explorer-detail");
      return;
    }

    goHome();
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      home: "Dashboard",
      "view-destacamento": "Dashboard de Iglesia",
      "territorial-home": "Dashboard Territorial",
      "regional-report": "Reporte Regional",
      "regional-comparison": "Destacamentos ",
      "regional-attendance": "Asistencia Territorial",
      "churches-list": "Exporadores de Región",
      calendar: "Calendario",
      "personal-data": "Datos personales",
      "explorers-list": "Exploradores",
      "explorer-detail": "Detalle del explorador",
      "attendance-taking": "Tomar asistencia",
      "attendance-report": "Ver asistencia",
      "service-schedule": "Grupos de servicio",
      "service-schedule-creation": "Crear grupo",
      "service-schedule-attendance": "Asistencia de servicio",
      "service-schedule-report": "Reporte de servicio",
      "finance-manager": "Finanzas",
    };

    return titles[activeSection] || "Dashboard";
  };

  const renderContent = () => {
    switch (activeSection) {
      case "admin-home":
        return (
          <ProtectedRoute allowedRoles={["superadmin"]} currentRole={currentUser?.role}>
            <AdminDashboard />
          </ProtectedRoute>
        );

      case "home":
        return <Home />;

      case "view-destacamento":
        // key prop forces React to unmount and remount Home when the drilledName changes,
        // which makes it re-fetch the dashboard data for the newly selected church.
        return <Home key={drilledName} />;

      case "territorial-home":
        return (
            <ProtectedRoute allowedRoles={["lider_territorial"]} currentRole={currentUser?.role}>
              <DashboardTerritorial user={currentUser} />
            </ProtectedRoute>
        );

      case "regional-report":
        return (
            <ProtectedRoute allowedRoles={["lider_territorial"]} currentRole={currentUser?.role}>
              <RegionalReport onBack={goHome} />
            </ProtectedRoute>
        );

      case "regional-comparison":
        return (
          <ProtectedRoute allowedRoles={["lider_territorial"]} currentRole={currentUser?.role}>
            <RegionalComparison 
              onBack={goHome} 
              onViewDestacamento={(id, name) => handleSidebarNavigate(`view-destacamento:${id}:${name}`)} 
            />
          </ProtectedRoute>
        );

      case "regional-attendance":
        return (
          <ProtectedRoute allowedRoles={["lider_territorial"]} currentRole={currentUser?.role}>
            <AttendanceReport onBack={goHome} />
          </ProtectedRoute>
        );

      case "churches-list":
        return (
          <ProtectedRoute allowedRoles={["lider_territorial"]} currentRole={currentUser?.role}>
            <RegionalExplorers onBack={goHome} />
          </ProtectedRoute>
        );

      case "calendar":
        return (
          <CalendarView
            onBack={goHome}
            onTakeAttendance={(meetingId: string) => {
              setSelectedMeetingId(meetingId);
              setActiveSection("attendance-taking");
            }}
            onViewAttendance={(meetingId: string) => {
              setSelectedMeetingId(meetingId);
              setAttendanceReportSource("menu");
              setActiveSection("attendance-report");
            }}
          />
        );

      case "personal-data":
        return <PersonalDataForm onBack={goHome} />;

      case "explorers-list":
        return (
          <ExplorersList
            onBack={goHome}
            onViewExplorer={(id: string) => {
              setSelectedExplorerId(id);
              setActiveSection("explorer-detail");
            }}
            onAddNew={() => setActiveSection("personal-data")}
          />
        );

      case "explorer-detail":
        return selectedExplorerId ? (
          <ExplorerDetail
            explorerId={selectedExplorerId}
            onBack={() => setActiveSection("explorers-list")}
            onOpenMeeting={(meetingId: string) => {
              setSelectedMeetingId(meetingId);
              setAttendanceReportSource("explorer-detail");
              setActiveSection("attendance-report");
            }}
          />
        ) : (
          <Home />
        );

      case "attendance-taking":
        return (
          <AttendanceTaking
            onBack={goHome}
            initialMeetingId={selectedMeetingId || undefined}
          />
        );

      case "attendance-report":
        return (
          <AttendanceReport
            onBack={handleBackFromAttendanceReport}
            initialMeetingId={selectedMeetingId || undefined}
          />
        );

      case "service-schedule":
        return (
          <ServiceGroups
            onBack={goHome}
            onNavigate={setActiveSection}
            onTakeAttendance={(groupId: string) => {
              setSelectedServiceGroupId(groupId);
              setActiveSection("service-schedule-attendance");
            }}
            onViewReport={(groupId: string) => {
              setSelectedServiceGroupId(groupId);
              setActiveSection("service-schedule-report");
            }}
          />
        );

      case "service-schedule-creation":
        return (
          <ServiceScheduleCreation
            onBack={() => setActiveSection("service-schedule")}
          />
        );

      case "service-schedule-attendance":
        return (
          <ServiceScheduleAttendance
            onBack={() => setActiveSection("service-schedule")}
            initialGroupId={selectedServiceGroupId || undefined}
          />
        );

      case "service-schedule-report":
        return (
          <ServiceScheduleReport
            onBack={() => setActiveSection("service-schedule")}
            initialGroupId={selectedServiceGroupId || undefined}
          />
        );

      case "settings":
        return <Settings onBack={goHome} />;

      case "finance-manager":
        return <FinanceManager onBack={goHome} />;

      default:
        return <Home />;
    }
  };

  // ── Interceptor: cambio obligatorio de contraseña ───────────────────────────
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (mustChangePassword) {
    return (
      <ForcePasswordChange
        userName={currentUser?.name || "Usuario"}
        onSuccess={(newToken) => {
          setMustChangePassword(false);
          // Actualizar currentUser desde localStorage
          try {
            const raw = localStorage.getItem("user");
            if (raw) setCurrentUser(JSON.parse(raw));
          } catch { /* ignore */ }
          // Navegar según rol
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const user = JSON.parse(raw);
              if (user.role === "superadmin") { setActiveSection("admin-home"); return; }
              if (user.role === "lider_territorial") { setActiveSection("territorial-home"); return; }
            }
          } catch { /* ignore */ }
          setActiveSection("home");
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb", overflow: "hidden" }}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleSidebarNavigate}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        userRole={currentUser?.role}
        destacamentoName={currentUser?.destacamentoNombre}
        territorioName={currentUser?.territorioNombre}
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <MobileHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={getSectionTitle()}
        />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>
          {drilledName && (
            <div 
              style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.25rem",
                background: "linear-gradient(to right, #4c1d95, #4338ca)",
                color: "white",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                flexShrink: 0,
                flexWrap: "wrap"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: 700, minWidth: 0, flex: 1 }}>
                <Eye size={22} style={{ color: "#c7d2fe", flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Modo Líder Territorial <span style={{ opacity: 0.75, fontWeight: 500, margin: "0 0.25rem" }}>|</span> <strong>{drilledName}</strong>
                </span>
                <span style={{
                  display: "inline-block",
                  marginLeft: "0.5rem",
                  fontSize: "0.65rem",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap"
                }}>
                  Solo lectura
                </span>
              </span>
              <button 
                onClick={exitDrillDown} 
                style={{
                  backgroundColor: "white",
                  color: "#4338ca",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  whiteSpace: "nowrap"
                }}
              >
                <X size={16} /> Salir del modo territorial
              </button>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}