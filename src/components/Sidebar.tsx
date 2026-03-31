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
  MapPin, // Añadido para el icono del destacamento
  type LucideIcon,
} from "lucide-react";
import { useIsDesktop } from "../hooks/useIsDesktop";

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
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        transition: "all 0.15s",
        background: active ? "#eff6ff" : "transparent",
        color: active ? "#2563eb" : "#374151",
        border: "none",
        cursor: "pointer",
        fontWeight: 500,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <Icon style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
      <span>{label}</span>
    </button>
  );
}

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  destacamentoName?: string; // NUEVO: Prop para el nombre de la iglesia
}

/** Returns user initials (up to 2 letters) from a full name */
function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Translate role slug to Spanish label */
function formatRole(role?: string): string {
  const map: Record<string, string> = {
    admin: "Administrador",
    superadmin: "Super Admin",
    lider: "Líder",
    director: "Director",
    territorial: "Líder Territorial"
  };
  return role ? (map[role] ?? role) : "Usuario";
}

export function Sidebar({
  activeSection,
  onNavigate,
  onLogout,
  isOpen = false,
  onClose,
  userName,
  userEmail,
  userRole,
  destacamentoName, // NUEVO
}: SidebarProps) {
  const isDesktop = useIsDesktop();

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

  const sidebarContent = (
    <>
      {/* Header Modificado para mostrar el Destacamento */}
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
  
  {/* Sección de Título y Subtítulo */}
  <div>
    <h1 style={{ 
      fontSize: "1.25rem", 
      fontWeight: 800, 
      color: "#111827", 
      lineHeight: 1.1,
      letterSpacing: "-0.025em" 
    }}>
      Club Timoteo
    </h1>
    <p style={{ 
      fontSize: "0.75rem", 
      color: "#6b7280", 
      marginTop: "2px",
      fontWeight: 500
    }}>
      Sistema de Gestión
    </p>
  </div>

  {/* Etiqueta (Badge) de Ubicación */}
  {destacamentoName && (
    <div style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      gap: "6px", 
      backgroundColor: "#f0fdfa", /* Fondo aqua/teal muy clarito */
      border: "1px solid #ccfbf1", /* Borde sutil para darle volumen */
      padding: "4px 10px", 
      borderRadius: "9999px", /* Bordes totalmente redondeados estilo píldora */
      width: "fit-content",
      maxWidth: "100%"
    }}>
      <MapPin style={{ 
        flexShrink: 0, /* Evita que el ícono se aplaste si el texto es muy largo */
        width: "0.85rem", 
        height: "0.85rem", 
        color: "#0d9488" 
      }} />
      <span style={{ 
        fontSize: "0.7rem", 
        fontWeight: 700, 
        color: "#0d9488", 
        textTransform: "uppercase", 
        letterSpacing: "0.05em", 
        whiteSpace: "nowrap", 
        overflow: "hidden", 
        textOverflow: "ellipsis" 
      }}>
        {destacamentoName}
      </span>
    </div>
  )}

</div>

        {!isDesktop && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.4rem",
              borderRadius: "0.5rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              marginLeft: "10px"
            }}
          >
            <X style={{ width: "1.25rem", height: "1.25rem", color: "#374151" }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => handleNavigate(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: "0.75rem",
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
      

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          {/* Avatar with initials */}
          <div
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #0d9488, #0f766e)", // Lo cambié a tonos teal/verde para combinar
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "0.8rem",
              flexShrink: 0,
            }}
          >
            {getInitials(userName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName ?? "Usuario"}
            </p>
            {userEmail && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#4b5563",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </p>
            )}
            <p
              style={{
                fontSize: "0.7rem",
                color: "#6b7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textTransform: "capitalize"
              }}
            >
              {formatRole(userRole)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#dc2626",
            fontWeight: 500,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut style={{ width: "1.125rem", height: "1.125rem", flexShrink: 0 }} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  // ── Desktop: fixed sidebar ──────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <aside
        style={{
          width: "16rem",
          flexShrink: 0,
          height: "100vh",
          background: "white",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 10,
          overflowY: "hidden",
        }}
      >
        {sidebarContent}
      </aside>
    );
  }

  // ── Mobile: drawer overlay ──────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
      }}
    >
      <aside
        style={{
          width: "16rem",
          height: "100%",
          background: "white",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        }}
      >
        {sidebarContent}
      </aside>

      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />
    </div>
  );
}