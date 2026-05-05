import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Church, Search, Loader2, ArrowUpDown } from "lucide-react";
import { apiFetch } from "../services/api";
import { ExportManager } from "./ExportManager";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrigada, setFilterBrigada] = useState("all");
  const [filterDestacamento, setFilterDestacamento] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: explorers = [], isLoading: loading } = useQuery({
    queryKey: ["explorers"],
    queryFn: () => apiFetch("/explorers"),
  });

  const getBrigada = (age: number) => {
    if (age <= 10) return { name: "Amiguitos de Jesús", color: "bg-sky-100 text-sky-700" };
    if (age <= 15) return { name: "Seguidores del Maestro", color: "bg-emerald-100 text-emerald-700" };
    return { name: "Servicio Cristiano", color: "bg-rose-100 text-rose-700" };
  };

  const destacamentos = Array.from(new Set(explorers.map((e: any) => e.destacamento?.nombre).filter(Boolean))).sort();

  const filtered = explorers.filter((e) => {
    const age = Math.floor((new Date().getTime() - new Date(e.fechaNacimiento).getTime()) / 31557600000);
    const brigadaName = getBrigada(age).name;
    const destName = e.destacamento?.nombre || "Desconocida";

    if (filterBrigada !== "all" && brigadaName !== filterBrigada) return false;
    if (filterDestacamento !== "all" && destName !== filterDestacamento) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!e.nombre.toLowerCase().includes(term) &&
          !e.apellidos.toLowerCase().includes(term) &&
          !e.codigoInterno.toLowerCase().includes(term) &&
          !destName.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...filtered].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal: string = "";
    let bVal: string = "";
    
    if (sortConfig.key === "nombre") {
      aVal = `${a.nombre} ${a.apellidos}`.toLowerCase();
      bVal = `${b.nombre} ${b.apellidos}`.toLowerCase();
    } else if (sortConfig.key === "codigoInterno") {
      aVal = (a.codigoInterno || "").toLowerCase();
      bVal = (b.codigoInterno || "").toLowerCase();
    } else if (sortConfig.key === "destacamento") {
      aVal = (a.destacamento?.nombre || "").toLowerCase();
      bVal = (b.destacamento?.nombre || "").toLowerCase();
    } else if (sortConfig.key === "brigada") {
      const ageA = Math.floor((new Date().getTime() - new Date(a.fechaNacimiento).getTime()) / 31557600000);
      const ageB = Math.floor((new Date().getTime() - new Date(b.fechaNacimiento).getTime()) / 31557600000);
      aVal = getBrigada(ageA).name;
      bVal = getBrigada(ageB).name;
    }
    
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const outpostInfo = {
    name: storedUser?.destacamento?.name || storedUser.destacamentoNombre || (storedUser.territorioNombre ? "Territorio " + storedUser.territorioNombre : "Territorio General"),
    city: storedUser?.destacamento?.city || "", 
    leader: storedUser.name || "Líder Regional",
  };

  const exportData = sortedData.map((e) => {
    const age = Math.floor(
      (new Date().getTime() - new Date(e.fechaNacimiento).getTime()) / 31557600000
    );
    const brigadaName = getBrigada(age).name;
    return {
      ...e,
      destacamentoNombre: e.destacamento?.nombre || "Desconocida",
      brigada: brigadaName,
    };
  });

  const explorerColumns = [
    { key: "codigoInterno", label: "Código" },
    { key: "nombre", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "destacamentoNombre", label: "Destacamento" },
    { key: "brigada", label: "Brigada" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* Header — igual que RegionalComparison */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <div className="min-w-0">
              <p className="font-bold text-[1rem] text-slate-800 truncate pr-2">
                Exploradores de Región
              </p>
              <p className="text-[0.75rem] font-medium text-slate-500 mt-[1px] truncate">
                Vista consolidada de todos los niños inscritos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportManager
              data={exportData as any[]}
              availableColumns={explorerColumns as any[]}
              filename="Exploradores_Region"
              reportTitle="Exploradores de Región"
              outpostInfo={outpostInfo}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 space-y-5">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="relative w-full sm:w-auto flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, código o iglesia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
          
          <select 
            value={filterBrigada}
            onChange={(e) => setFilterBrigada(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-gray-200 bg-slate-50 py-2.5 px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '2.5rem' }}
          >
            <option value="all">Todas las Brigadas</option>
            <option value="Amiguitos de Jesús">Amiguitos de Jesús</option>
            <option value="Seguidores del Maestro">Seguidores del Maestro</option>
            <option value="Servicio Cristiano">Servicio Cristiano</option>
          </select>

          <select 
            value={filterDestacamento}
            onChange={(e) => setFilterDestacamento(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-gray-200 bg-slate-50 py-2.5 px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition cursor-pointer appearance-none max-w-[200px] truncate"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '2.5rem' }}
          >
            <option value="all">Todos los Destacamentos</option>
            {destacamentos.map(d => (
              <option key={d as string} value={d as string}>{d as string}</option>
            ))}
          </select>
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
                    <th 
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("codigoInterno")}
                    >
                      <div className="flex items-center gap-1">Código {sortConfig?.key === "codigoInterno" && <ArrowUpDown size={12} />}</div>
                    </th>
                    <th 
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("nombre")}
                    >
                      <div className="flex items-center gap-1">Nombre Completo {sortConfig?.key === "nombre" && <ArrowUpDown size={12} />}</div>
                    </th>
                    <th 
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("destacamento")}
                    >
                      <span className="flex items-center gap-1">
                        <Church size={14} />
                        Destacamento {sortConfig?.key === "destacamento" && <ArrowUpDown size={12} />}
                      </span>
                    </th>
                    <th 
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("brigada")}
                    >
                      <div className="flex items-center gap-1">Brigada {sortConfig?.key === "brigada" && <ArrowUpDown size={12} />}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-slate-500 bg-slate-50/50">
                        No se encontraron exploradores.
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((e) => {
                      const iglesia = e.destacamento?.nombre || "Desconocida";
                      const age = Math.floor(
                        (new Date().getTime() - new Date(e.fechaNacimiento).getTime()) / 31557600000
                      );
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-sm font-bold text-blue-700">
                            {e.codigoInterno}
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-slate-900">
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
                          <td className="p-4">
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${getBrigada(age).color}`}>
                              {getBrigada(age).name}
                            </span>
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
