import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowUpDown, ExternalLink, Loader2, Building2 } from "lucide-react";
import { apiFetch } from "../services/api";

type DestacamentoStat = {
  id: string;
  nombre: string;
  totalExploradores: number;
  nuevosExploradoresMes: number;
  reunionesMes: number;
  asistenciaMes: number;
  balanceMes: number;
  isActive: boolean;
  lastMeetingDate: string | null;
};

type SortConfig = {
  key: keyof DestacamentoStat | null;
  direction: "asc" | "desc";
};

interface RegionalComparisonProps {
  onBack: () => void;
  onViewDestacamento: (id: string, nombre: string) => void;
}

export default function RegionalComparison({ onBack, onViewDestacamento }: RegionalComparisonProps) {
  const [data, setData] = useState<DestacamentoStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "totalExploradores", direction: "desc" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiFetch("/territorio/comparativa");
        setData(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error fetching comparativa", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (key: keyof DestacamentoStat) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DestacamentoStat];
        const bValue = b[sortConfig.key as keyof DestacamentoStat];
        
        if (aValue === null && bValue !== null) return 1;
        if (aValue !== null && bValue === null) return -1;
        
        if (aValue! < bValue!) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const currentMonthName = new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date());
  const monthTitle = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
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
                Destacamentos Pro
              </p>
              <p className="text-xs text-slate-500">
                Comparativa y rendimiento del territorio
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-6 flex-1 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="animate-spin h-10 w-10 mb-4" />
            <p className="text-sm font-medium">Calculando métricas territoriales...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0 w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th 
                      onClick={() => handleSort("nombre")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        Destacamento {sortConfig.key === "nombre" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("isActive")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Estado {sortConfig.key === "isActive" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("totalExploradores")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Exploradores {sortConfig.key === "totalExploradores" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("nuevosExploradoresMes")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Exploradores nuevos en {monthTitle.toLowerCase()} {sortConfig.key === "nuevosExploradoresMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("reunionesMes")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Reuniones en {monthTitle.toLowerCase()} {sortConfig.key === "reunionesMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("asistenciaMes")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        % Asistencia {sortConfig.key === "asistenciaMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("balanceMes")}
                      className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Balance {monthTitle} {sortConfig.key === "balanceMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedData.map((dest) => (
                    <tr key={dest.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{dest.nombre}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Última reunión: {dest.lastMeetingDate ? new Date(dest.lastMeetingDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          dest.isActive 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dest.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                          {dest.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-slate-700">{dest.totalExploradores}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-slate-700">{dest.nuevosExploradoresMes}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-slate-700">{dest.reunionesMes}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold ${
                          dest.asistenciaMes >= 80 ? 'text-green-600' :
                          dest.asistenciaMes >= 50 ? 'text-amber-600' :
                          'text-red-500'
                        }`}>
                          {dest.asistenciaMes}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium">
                        <span className={`${dest.balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${dest.balanceMes.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onViewDestacamento(dest.id, dest.nombre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <ExternalLink size={16} />
                          <span className="hidden sm:inline">Ver Detalles</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {sortedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50">
                        No hay destacamentos registrados en tu territorio todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
