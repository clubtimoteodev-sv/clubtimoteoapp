/**
 * ForcePasswordChange
 *
 * Pantalla de bloqueo total que aparece cuando mustChangePassword === true.
 * El usuario NO puede ver ningún otro módulo hasta completar el cambio.
 */
import { useState } from "react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";

interface ForcePasswordChangeProps {
  /** Nombre del usuario logueado */
  userName: string;
  /** Callback al completar el cambio exitosamente */
  onSuccess: (newToken: string) => void;
  /** Callback para cerrar sesión */
  onLogout: () => void;
}

export function ForcePasswordChange({ userName, onSuccess, onLogout }: ForcePasswordChangeProps) {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);

  // Validaciones en tiempo real
  const hasMin8      = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber    = /[0-9]/.test(newPassword);
  const matches      = newPassword !== "" && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMin8 || !matches) return;

    setLoading(true);
    try {
      const data = await apiFetch("/auth/update-password-required", {
        method: "PUT",
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      // Actualizar token y user en localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        const raw = localStorage.getItem("user");
        if (raw) {
          try {
            const u = JSON.parse(raw);
            localStorage.setItem("user", JSON.stringify({ ...u, mustChangePassword: false }));
          } catch { /* ignore */ }
        }
      }

      setDone(true);
      toast.success("¡Contraseña establecida! Bienvenido al sistema.");
      setTimeout(() => onSuccess(data.token), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la contraseña";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.5rem",
    border: "1.5px solid #d1d5db", fontSize: "0.9rem", outline: "none",
    transition: "border-color .15s", background: "white", color: "#111827",
    boxSizing: "border-box",
  };

  const ruleRow = (ok: boolean, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: ok ? "#16a34a" : "#6b7280" }}>
      <CheckCircle2 size={13} style={{ color: ok ? "#16a34a" : "#d1d5db", flexShrink: 0 }} />
      {label}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "white", borderRadius: "1.25rem", padding: "2rem",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 25px 60px rgba(0,0,0,.4)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
            boxShadow: "0 4px 14px rgba(245,158,11,.3)",
          }}>
            <ShieldAlert size={28} style={{ color: "#b45309" }} />
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: 0 }}>
            Cambio de contraseña requerido
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.4rem" }}>
            Hola <strong>{userName}</strong>. Por seguridad, debes establecer una contraseña personal antes de continuar.
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <CheckCircle2 size={48} style={{ color: "#16a34a", margin: "0 auto 0.75rem", display: "block" }} />
            <p style={{ color: "#16a34a", fontWeight: 600 }}>¡Contraseña establecida!</p>
            <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Accediendo al sistema...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {/* Nueva contraseña */}
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>
                Nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={loading}
                  style={{ ...inputBase, paddingRight: "2.5rem" }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  tabIndex={-1}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Indicadores de fortaleza */}
              {newPassword && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {ruleRow(hasMin8, "Al menos 8 caracteres")}
                  {ruleRow(hasUppercase, "Al menos una letra mayúscula")}
                  {ruleRow(hasNumber, "Al menos un número")}
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>
                Confirmar contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  disabled={loading}
                  style={{
                    ...inputBase,
                    paddingRight: "2.5rem",
                    borderColor: confirmPassword ? (matches ? "#16a34a" : "#dc2626") : "#d1d5db",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword && !matches && (
                <p style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "0.25rem" }}>Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading || !hasMin8 || !matches}
              style={{
                padding: "0.7rem", borderRadius: "0.6rem", border: "none",
                background: loading || !hasMin8 || !matches
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: loading || !hasMin8 || !matches ? "#9ca3af" : "white",
                fontWeight: 700, fontSize: "0.9rem", cursor: loading || !hasMin8 || !matches ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "all .15s",
              }}
            >
              <KeyRound size={16} />
              {loading ? "Guardando..." : "Establecer contraseña"}
            </button>

            {/* Enlace para cerrar sesión */}
            <button
              type="button"
              onClick={onLogout}
              style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline" }}
            >
              Cerrar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForcePasswordChange;
