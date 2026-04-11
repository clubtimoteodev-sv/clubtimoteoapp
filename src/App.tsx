import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";

import { Sidebar } from "./components/Sidebar";
import { MobileHeader } from "./components/MobileHeader";
import { Login } from "./components/Login";
import Home from "./components/Home";
import { CalendarView } from "./components/CalendarView";
import RegionalExplorers from "./components/RegionalExplorers";
import RegionalComparison from "./components/RegionalComparison";
import { PersonalDataForm } from "./components/PersonalDataForm";
import { ExplorersList } from "./components/ExplorersList";
import { ExplorerDetail } from "./components/ExplorerDetail";
import { AttendanceTaking } from "./components/AttendanceTaking";
import { AttendanceReport } from "./components/AttendanceReport";
import { FinanceManager } from "./components/FinanceManager";
import { ServiceGroups } from "./components/ServiceGroups";
import { ServiceScheduleCreation } from "./components/ServiceScheduleCreation";
import { ServiceScheduleAttendance } from "./components/ServiceScheduleAttendance";
import { ServiceScheduleReport } from "./components/ServiceScheduleReport";
import DashboardTerritorial from "./components/DashboardTerritorial";
import RegionalReport from "./components/RegionalReport";

type AttendanceReportSource = "menu" | "explorer-detail";

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
        if (user.role === "lider territorial") return "territorial-home";
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

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; destacamentoNombre?: string } | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
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
    } else if (currentUser?.role === "lider territorial") {
      setActiveSection("territorial-home");
    } else {
      setActiveSection("home");
    }
  };

  const exitDrillDown = () => {
    localStorage.removeItem("overrideDestacamentoId");
    setDrilledName("");
    if (currentUser?.role === "lider territorial") {
      setActiveSection("territorial-home");
    } else {
      setActiveSection("home");
    }
  };

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
    localStorage.removeItem("overrideDestacamentoId");
    setDrilledName("");
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user.role === "lider territorial") {
          setActiveSection("territorial-home");
          return;
        }
      }
    } catch { /* ignore */ }
    setActiveSection("home");
  };

  const handleLogout = () => {
    // ✅ SEGURIDAD: Limpiar TODA la sesión del localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("overrideDestacamentoId");
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
      setDrilledName(nombre);
      setActiveSection("view-destacamento");
      setIsSidebarOpen(false);
      return;
    }

    if (section === "territorial-home") {
      localStorage.removeItem("overrideDestacamentoId");
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
      "regional-comparison": "Destacamentos Pro",
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
      case "home":
        return <Home />;

      case "view-destacamento":
        // key prop forces React to unmount and remount Home when the drilledName changes,
        // which makes it re-fetch the dashboard data for the newly selected church.
        return <Home key={drilledName} />;

      case "territorial-home":
        return <DashboardTerritorial user={currentUser} />;

      case "regional-report":
        return <RegionalReport onBack={goHome} />;

      case "regional-comparison":
        return (
          <RegionalComparison 
            onBack={goHome} 
            onViewDestacamento={(id, name) => handleSidebarNavigate(`view-destacamento:${id}:${name}`)} 
          />
        );

      case "regional-attendance":
        return (
          <AttendanceReport
            onBack={goHome}
          />
        );

      case "churches-list":
        return <RegionalExplorers onBack={goHome} />;

      case "calendar":
        return (
          <CalendarView
            onBack={goHome}
            onTakeAttendance={(meetingId: string) => {
              setSelectedMeetingId(meetingId);
              setActiveSection("attendance-taking");
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

      case "finance-manager":
        return <FinanceManager onBack={goHome} />;

      default:
        return <Home />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <MobileHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={getSectionTitle()}
        />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>
          {drilledName && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-orange-50 border-b border-orange-200 px-4 py-3 shrink-0">
              <span className="text-orange-700 text-sm font-semibold flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                <Eye size={18} className="shrink-0" />
                <span className="truncate">Modo Supervisor: <strong>{drilledName}</strong></span>
              </span>
              <button 
                onClick={exitDrillDown} 
                className="w-full sm:w-auto bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-colors hover:bg-orange-100 shrink-0 shadow-sm"
              >
                <X size={14} /> Salir del Modo
              </button>
            </div>
          )}
          <div style={{ flex: 1 }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}