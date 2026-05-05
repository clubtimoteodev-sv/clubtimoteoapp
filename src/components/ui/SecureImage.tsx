/**
 * <SecureImage />
 *
 * Componente seguro para mostrar fotos de perfil de exploradores.
 *
 * - Nunca expone el link directo de Cloudinary en el DOM.
 * - Usa IntersectionObserver para Lazy Loading (solo carga cuando el
 *   elemento es visible en pantalla → ahorra Bandwidth de Cloudinary).
 * - Obtiene una URL firmada con expiración de 10 minutos del backend.
 * - Muestra un skeleton mientras carga y un avatar fallback si hay error.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch, getToken } from "../../services/api.js";

// ────────────────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────────────────
interface SecureImageProps {
  /** public_id de Cloudinary, e.g. "club-timoteo/destacamentos/DES-001/perfiles/cuid123" */
  publicId: string | null | undefined;
  /** Nombre del explorador para alt + fallback de iniciales */
  explorerName?: string;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Tamaño visual del avatar (px). Por defecto 80. */
  size?: number;
}

type Status = "idle" | "loading" | "ready" | "error";

// ────────────────────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────────────────────

/** Extrae las iniciales del nombre para el avatar fallback */
function getInitials(name = ""): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Paleta de colores de fondo para el avatar fallback — basados en el índice
 * de la primera letra para que sean siempre consistentes por explorador.
 */
const AVATAR_COLORS = [
  "#4f46e5", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#7c3aed", "#db2777", "#0284c7",
];
function getAvatarColor(name = ""): string {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ────────────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────────────
export function SecureImage({
  publicId,
  explorerName = "",
  className = "",
  size = 80,
}: SecureImageProps) {
  const [status, setStatus]   = useState<Status>("idle");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedRef   = useRef(false); // Evitar doble-fetch con StrictMode

  // ── Función que llama al backend para obtener la URL firmada ─────────────
  const fetchSignedUrl = useCallback(async () => {
    if (!publicId || fetchedRef.current) return;
    fetchedRef.current = true;
    setStatus("loading");

    try {
      // Encode slashes del publicId para que el router los acepte correctamente
      const encodedId = publicId.split("/").map(encodeURIComponent).join("/");
      const data = await apiFetch(`/explorers/photo/${encodedId}`);
      setSignedUrl(data.signedUrl);
      setStatus("ready");
    } catch (err) {
      console.error("[SecureImage] Error obteniendo URL firmada:", err);
      setStatus("error");
    }
  }, [publicId]);

  // ── IntersectionObserver — Lazy Loading ───────────────────────────────────
  useEffect(() => {
    if (!publicId) {
      setStatus("error"); // Sin publicId → mostrar fallback inmediatamente
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          fetchSignedUrl();
        }
      },
      { rootMargin: "200px" } // Pre-carga 200px antes de llegar al viewport
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [publicId, fetchSignedUrl]);

  // ── Sin token → no intentar cargar ───────────────────────────────────────
  useEffect(() => {
    if (!getToken()) setStatus("error");
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────
  const initials = getInitials(explorerName);
  const bgColor  = getAvatarColor(explorerName);

  return (
    <div
      ref={containerRef}
      className={`secure-image-wrapper ${className}`}
      style={{
        width:        size,
        height:       size,
        borderRadius: "50%",
        overflow:     "hidden",
        flexShrink:   0,
        position:     "relative",
        background:   status === "ready" ? "transparent" : bgColor,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
      }}
      aria-label={explorerName ? `Foto de ${explorerName}` : "Foto de perfil"}
    >
      {/* ── Skeleton mientras carga ─────────────────────────────────────── */}
      {status === "loading" && (
        <div
          className="secure-image-skeleton"
          style={{
            position:        "absolute",
            inset:           0,
            background:      "linear-gradient(90deg, rgba(255,255,255,.08) 25%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.08) 75%)",
            backgroundSize:  "200% 100%",
            animation:       "shimmer 1.4s infinite",
          }}
        />
      )}

      {/* ── Imagen firmada ──────────────────────────────────────────────── */}
      {status === "ready" && signedUrl && (
        <img
          src={signedUrl}
          alt={explorerName ? `Foto de ${explorerName}` : "Foto de perfil"}
          loading="lazy"
          decoding="async"
          style={{
            width:       "100%",
            height:      "100%",
            objectFit:   "cover",
            display:     "block",
            borderRadius: "50%",
          }}
          onError={() => setStatus("error")}
        />
      )}

      {/* ── Fallback: iniciales cuando no hay foto o hay error ──────────── */}
      {(status === "idle" || status === "error") && (
        <span
          aria-hidden="true"
          style={{
            color:      "#fff",
            fontWeight: 700,
            fontSize:   size * 0.35,
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

// ── CSS keyframe para el shimmer (se inyecta una sola vez) ───────────────────
if (typeof document !== "undefined") {
  const STYLE_ID = "secure-image-shimmer-keyframes";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default SecureImage;
