/**
 * Settings — Ajustes de cuenta del usuario
 *
 * Permite al usuario:
 *   1. Ver su información de perfil
 *   2. Cambiar contraseña (requiere contraseña actual)
 */
import { useState } from "react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, EyeOff, KeyRound, User,
  Building2, ShieldCheck, CheckCircle2,
} from "lucide-react";

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  // ── Cambio de contraseña voluntario ──────────────────────────────────────
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  // Validaciones
  const hasMin8      = newPwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPwd);
  const hasNumber    = /[0-9]/.test(newPwd);
  const matches      = newPwd !== "" && newPwd === confirmPwd;
  const canSubmit    = currentPwd !== "" && hasMin8 && matches;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd }),
      });
      toast.success("¡Contraseña actualizada correctamente!");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar la contraseña";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers de estilo ─────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.875rem", borderRadius: "0.5rem",
    border: "1.5px solid #e5e7eb", fontSize: "0.875rem", outline: "none",
    background: "white", color: "#111827", boxSizing: "border-box",
    transition: "border-color .15s",
  };

  const ruleRow = (ok: boolean, label: string) => (
    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: ok ? "#16a34a" : "#9ca3af" }}>
      <CheckCircle2 size={12} style={{ color: ok ? "#16a34a" : "#d1d5db", flexShrink: 0 }} />
      {label}
    </div>
  );

  const roleLabel: Record<string, string> = {
    superadmin:         "Super Administrador",
    admin:              "Administrador",
    lider_destacamento: "Líder de Destacamento",
    lider_territorial:  "Líder Territorial",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10, background: "white",
        borderBottom: "1px solid #e2e8f0", padding: "0.75rem 1.25rem",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <button
          type="button" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Volver
        </button>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", margin: 0 }}>Ajustes de cuenta</p>
          <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>Perfil y seguridad</p>
        </div>
      </header>

      <main style={{ maxWidth: "520px", margin: "0 auto", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── Card: Información del perfil ──────────────────────────────── */}
        <section style={{ background: "white", borderRadius: "0.875rem", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={15} style={{ color: "#64748b" }} /> Mi perfil
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <InfoRow icon={<User size={14} />} label="Nombre" value={storedUser.name || "—"} />
            <InfoRow icon={<ShieldCheck size={14} />} label="Rol" value={roleLabel[storedUser.role] || storedUser.role || "—"} />
            {storedUser.destacamentoNombre && (
              <InfoRow icon={<Building2 size={14} />} label="Destacamento" value={storedUser.destacamentoNombre} />
            )}
            {storedUser.territorioNombre && (
              <InfoRow icon={<Building2 size={14} />} label="Territorio" value={storedUser.territorioNombre} />
            )}
          </div>
        </section>

        {/* ── Card: Cambiar contraseña ──────────────────────────────────── */}
        <section style={{ background: "white", borderRadius: "0.875rem", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <KeyRound size={15} style={{ color: "#64748b" }} /> Cambiar contraseña
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 0 1.1rem" }}>
            Se requiere tu contraseña actual para confirmar el cambio.
          </p>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {/* Contraseña actual */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.3rem" }}>
                Contraseña actual
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Tu contraseña actual"
                  required disabled={loading}
                  style={{ ...inputBase, paddingRight: "2.5rem" }}
                />
                <ToggleEye show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.3rem" }}>
                Nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required disabled={loading}
                  style={{ ...inputBase, paddingRight: "2.5rem" }}
                />
                <ToggleEye show={showNew} onToggle={() => setShowNew(v => !v)} />
              </div>
              {newPwd && (
                <div style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  {ruleRow(hasMin8, "Al menos 8 caracteres")}
                  {ruleRow(hasUppercase, "Al menos una mayúscula")}
                  {ruleRow(hasNumber, "Al menos un número")}
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.3rem" }}>
                Confirmar nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required disabled={loading}
                  style={{
                    ...inputBase, paddingRight: "2.5rem",
                    borderColor: confirmPwd ? (matches ? "#16a34a" : "#dc2626") : "#e5e7eb",
                  }}
                />
                <ToggleEye show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              {confirmPwd && !matches && (
                <p style={{ fontSize: "0.73rem", color: "#dc2626", margin: "0.2rem 0 0" }}>Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                padding: "0.65rem", borderRadius: "0.5rem", border: "none",
                background: loading || !canSubmit ? "#e5e7eb" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: loading || !canSubmit ? "#9ca3af" : "white",
                fontWeight: 700, fontSize: "0.875rem",
                cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "all .15s",
              }}
            >
              <KeyRound size={15} />
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

// ── Subcomponentes auxiliares ─────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ color: "#94a3b8", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: "90px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1e293b" }}>{value}</span>
    </div>
  );
}

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle} tabIndex={-1}
      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

export default Settings;
