import { useState } from "react";

import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import Home from "./components/Home";
import { CalendarView } from "./components/CalendarView";
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

type AttendanceReportSource = "menu" | "explorer-detail";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("token") ? "home" : "login";
  });

  const [selectedExplorerId, setSelectedExplorerId] = useState<string | null>(null);
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [attendanceReportSource, setAttendanceReportSource] =
    useState<AttendanceReportSource>("menu");

  const goHome = () => setActiveSection("home");

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
    setActiveSection("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setActiveSection("login");
    setSelectedExplorerId(null);
    setSelectedServiceGroupId(null);
    setSelectedMeetingId(null);
    setAttendanceReportSource("menu");
  };

  const handleSidebarNavigate = (section: string) => {
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
  };

  const handleBackFromAttendanceReport = () => {
    if (attendanceReportSource === "explorer-detail" && selectedExplorerId) {
      setActiveSection("explorer-detail");
      return;
    }

    goHome();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Home />;

      case "calendar":
        return (
          <CalendarView
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
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleSidebarNavigate}
        onLogout={handleLogout}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-6">
          {activeSection === "home" ? (
            <div className="min-h-[calc(100vh-48px)] rounded-[28px] bg-gray-50 p-8">
              {renderContent()}
            </div>
          ) : (
            <div className="min-w-0">{renderContent()}</div>
          )}
        </div>
      </main>
    </div>
  );
}