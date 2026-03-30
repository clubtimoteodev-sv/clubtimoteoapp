import { Menu } from "lucide-react";
import { useIsDesktop } from "../hooks/useIsDesktop";

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  const isDesktop = useIsDesktop();

  // On desktop, don't render the mobile top bar at all
  if (isDesktop) return null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <button
        type="button"
        onClick={onMenuClick}
        style={{
          padding: "0.5rem",
          borderRadius: "0.5rem",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Menu style={{ width: "1.5rem", height: "1.5rem", color: "#374151" }} />
      </button>

      <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
        {title}
      </h1>
    </header>
  );
}