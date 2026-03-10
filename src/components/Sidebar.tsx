import {
  LayoutDashboard,
  Calendar,
  UserCircle,
  Users,
  ClipboardCheck,
  Eye,
  UsersRound,
  DollarSign,
  LogOut
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeSection, onNavigate, onLogout }: SidebarProps) {
  const items = [
    { id: "home", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendario", icon: Calendar },
    { id: "personal-data", label: "Datos personales", icon: UserCircle },
    { id: "explorers-list", label: "Exploradores", icon: Users },
    { id: "attendance-taking", label: "Tomar asistencia", icon: ClipboardCheck },
    { id: "attendance-report", label: "Ver asistencia", icon: Eye },
    { id: "service-schedule", label: "Grupos de servicio", icon: UsersRound },
    { id: "finance-manager", label: "Finanzas", icon: DollarSign }
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Club Exploradores
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Sistema de gestión
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}