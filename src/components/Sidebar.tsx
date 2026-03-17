import {
  LayoutDashboard,
  UserCircle,
  Users,
  ClipboardCheck,
  Eye,
  UsersRound,
  DollarSign,
  Calendar,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  activeSection,
  onNavigate,
  onLogout,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const navItems = [
    { id: "home", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendario", icon: Calendar },
    { id: "personal-data", label: "Datos personales", icon: UserCircle },
    { id: "explorers-list", label: "Exploradores", icon: Users },
    { id: "attendance-taking", label: "Tomar asistencia", icon: ClipboardCheck },
    { id: "attendance-report", label: "Ver asistencia", icon: Eye },
    { id: "service-schedule", label: "Grupos de servicio", icon: UsersRound },
    { id: "finance-manager", label: "Finanzas", icon: DollarSign },
  ];

  const handleNavigate = (section: string) => {
    onNavigate(section);
    onClose?.();
  };

  const content = (
    <>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Club Exploradores</h1>
          <p className="text-sm text-gray-600 mt-1">Sistema de gestión</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.id}
            onClick={() => handleNavigate(item.id)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            JD
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Juan Diaz</p>
            <p className="text-xs text-gray-600">Administrador</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop / tablet */}
      <aside className="hidden md:flex w-64 shrink-0 min-h-screen bg-white border-r border-gray-200 flex-col">
        {content}
      </aside>

      {/* Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}