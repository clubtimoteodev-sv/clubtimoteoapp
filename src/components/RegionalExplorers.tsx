import { useState, useEffect } from "react";
import { ArrowLeft, Church, Search } from "lucide-react";
import { apiFetch } from "../services/api";

interface RegionalExplorersProps {
  onBack: () => void;
}

const PASTEL_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"
];

const stringToColor = (str: string) => {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return PASTEL_COLORS[sum % PASTEL_COLORS.length];
};

export default function RegionalExplorers({ onBack }: RegionalExplorersProps) {
  const [explorers, setExplorers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al no haber override, cargará todos los de la región
    apiFetch("/explorers")
      .then(setExplorers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = explorers.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(term) ||
      e.apellidos.toLowerCase().includes(term) ||
      e.codigoInterno.toLowerCase().includes(term) ||
      (e.destacamento && e.destacamento.nombre.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", borderRadius: "0.5rem" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Church size={24} color="#0d9488" />
            Exploradores de Región
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Vista consolidada de todos los niños inscritos</p>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", position: "relative", maxWidth: "400px" }}>
        <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, código o iglesia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%", padding: "0.5rem 1rem 0.5rem 2.5rem",
            borderRadius: "0.5rem", border: "1px solid #d1d5db",
            outline: "none", fontSize: "0.875rem"
          }}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Cargando exploradores...</p>
      ) : (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Código</th>
                  <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Nombre Completo</th>
                  <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Destacamento</th>
                  <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Edad</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      No se encontraron exploradores.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const iglesia = e.destacamento?.nombre || "Desconocida";
                    const age = Math.floor((new Date().getTime() - new Date(e.fechaNacimiento).getTime()) / 31557600000);
                    return (
                      <tr key={e.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>
                          {e.codigoInterno}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
                          {e.nombre} {e.apellidos}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem" }}>
                          <span style={{
                            display: "inline-block", padding: "0.25rem 0.5rem",
                            borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                            backgroundColor: stringToColor(iglesia), color: "#1f2937"
                          }}>
                            {iglesia}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
                          {age} años
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
