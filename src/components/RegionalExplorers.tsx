import { useState, useEffect } from "react";
import { ArrowLeft, Church, Search, Loader2 } from "lucide-react";
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
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* Header — igual que RegionalComparison */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-base font-bold text-transparent">
                Exploradores de Región
              </p>
              <p className="text-xs text-slate-500">
                Vista consolidada de todos los niños inscritos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 space-y-5">
        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, código o iglesia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Código
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Church size={14} />
                        Destacamento
                      </span>
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Edad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-slate-500 bg-slate-50/50">
                        No se encontraron exploradores.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e) => {
                      const iglesia = e.destacamento?.nombre || "Desconocida";
                      const age = Math.floor(
                        (new Date().getTime() - new Date(e.fechaNacimiento).getTime()) / 31557600000
                      );
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-sm font-semibold text-blue-700">
                            {e.codigoInterno}
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-medium text-gray-900">
                              {e.nombre} {e.apellidos}
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-gray-800"
                              style={{ backgroundColor: stringToColor(iglesia) }}
                            >
                              {iglesia}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {age} años
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con conteo */}
            {filtered.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 bg-slate-50/50">
                {filtered.length} explorador{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
