import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, ArrowUpDown, ExternalLink, Loader2, Building2, Grid, List, Activity, DollarSign, Calendar, Users } from "lucide-react";
import { apiFetch } from "../services/api";
import { ExportManager } from "./ExportManager";

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const outpostInfo = {
    name: storedUser?.destacamento?.name || storedUser.destacamentoNombre || (storedUser.territorioNombre ? "Territorio " + storedUser.territorioNombre : "Territorio General"),
    city: storedUser?.destacamento?.city || "", 
    leader: storedUser.name || "Líder Regional",
  };

  const exportData = sortedData.map(dest => ({
    ...dest,
    estado: dest.isActive ? "Activo" : "Inactivo",
  }));

  const comparisonColumns = [
    { key: "nombre", label: "Destacamento" },
    { key: "estado", label: "Estado" },
    { key: "totalExploradores", label: "Exploradores" },
    { key: "nuevosExploradoresMes", label: "Nuevos Exploradores" },
    { key: "reunionesMes", label: "Reuniones" },
    { key: "asistenciaMes", label: "% Asistencia" },
    { key: "balanceMes", label: "Balance ($)" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
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
                Destacamentos 
              </p>
              <p className="text-[0.75rem] font-medium text-slate-500 mt-[1px] truncate">
                Comparativa y rendimiento territorial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista de Tarjetas"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista de Tabla"
              >
                <List size={16} />
              </button>
            </div>
            
            <ExportManager
              data={exportData as any[]}
              availableColumns={comparisonColumns as any[]}
              filename="Destacamentos_Pro_Comparativa"
              reportTitle="Comparativa de Destacamentos"
              outpostInfo={outpostInfo}
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 flex-1 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="animate-spin h-10 w-10 mb-4" />
            <p className="text-sm font-medium">Calculando métricas territoriales...</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="flex items-center justify-end mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">Ordenar por:</span>
                  <select
                    className="rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={`${sortConfig.key}-${sortConfig.direction}`}
                    onChange={(e) => {
                      const [key, dir] = e.target.value.split('-');
                      setSortConfig({ key: key as keyof DestacamentoStat, direction: dir as "asc" | "desc" });
                    }}
                  >
                    <option value="nombre-asc">Nombre (A-Z)</option>
                    <option value="totalExploradores-desc">Más Exploradores</option>
                    <option value="asistenciaMes-desc">Mayor Asistencia</option>
                    <option value="balanceMes-desc">Mayor Balance</option>
                    <option value="reunionesMes-desc">Más Reuniones</option>
                  </select>
                </div>
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0 w-full">
                <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th 
                      onClick={() => handleSort("nombre")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-1">
                        Destacamento {sortConfig.key === "nombre" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("isActive")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-1">
                        Estado {sortConfig.key === "isActive" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("totalExploradores")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Exploradores {sortConfig.key === "totalExploradores" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("nuevosExploradoresMes")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Exploradores nuevos en {monthTitle.toLowerCase()} {sortConfig.key === "nuevosExploradoresMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("reunionesMes")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Reuniones en {monthTitle.toLowerCase()} {sortConfig.key === "reunionesMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("asistenciaMes")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        % Asistencia {sortConfig.key === "asistenciaMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("balanceMes")}
                      className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Balance {monthTitle} {sortConfig.key === "balanceMes" && <ArrowUpDown size={14} className="text-slate-400" />}
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
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
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedData.map((dest) => {
                  const astColor = dest.asistenciaMes >= 80 ? { t: "text-green-600/80", i: "text-green-500", b: "bg-green-100/50", v: "text-green-600" } : dest.asistenciaMes >= 50 ? { t: "text-amber-600/80", i: "text-amber-500", b: "bg-amber-100/50", v: "text-amber-600" } : { t: "text-red-600/80", i: "text-red-500", b: "bg-red-100/50", v: "text-red-500" };
                  const balColor = dest.balanceMes >= 0 ? { t: "text-emerald-600/80", i: "text-emerald-500", b: "bg-emerald-100/50", v: "text-emerald-600" } : { t: "text-red-600/80", i: "text-red-500", b: "bg-red-100/50", v: "text-red-600" };

                  return (
                  <div key={dest.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-50 relative">
                      <div className="flex py-1 items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Building2 size={22} className="stroke-[2.5px]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 truncate text-[1.125rem] pr-2">Destacamento {dest.nombre}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                              Última reunión: {dest.lastMeetingDate ? new Date(dest.lastMeetingDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-[0.7rem] uppercase tracking-wider font-bold shadow-sm"
                        style={{
                          backgroundColor: dest.isActive ? "#16a34a" : "#ca8a04",
                          color: "#ffffff"
                        }}
                      >
                        {dest.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Metrics Body */}
                    <div className="px-6 py-6 flex-1 bg-slate-50/50">
                      
                      {/* Flex grid for metrics */}
                      <div className="grid grid-cols-2 gap-4 gap-y-5">
                         <div>
                           <p className="text-[0.68rem] font-bold text-blue-600/80 mb-1 flex items-center gap-1.5 uppercase tracking-widest">
                             <span className="p-1 rounded-md bg-blue-100/50"><Users size={13} className="text-blue-500 stroke-[2.5px]" /></span> Exploradores
                           </p>
                           <div className="flex items-end gap-2 mt-1">
                             <p className="text-2xl font-bold text-slate-800 leading-none">{dest.totalExploradores}</p>
                             <p className="text-[0.7rem] font-bold text-green-600/80 leading-none mb-0.5">+{dest.nuevosExploradoresMes}</p>
                           </div>
                         </div>
                         
                         <div>
                           <p className="text-[0.68rem] font-bold text-purple-600/80 mb-1 flex items-center gap-1.5 uppercase tracking-widest">
                             <span className="p-1 rounded-md bg-purple-100/50"><Calendar size={13} className="text-purple-500 stroke-[2.5px]" /></span> Reuniones
                           </p>
                           <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{dest.reunionesMes}</p>
                         </div>

                         <div>
                           <p className={`text-[0.68rem] font-bold ${astColor.t} mb-1 flex items-center gap-1.5 uppercase tracking-widest`}>
                             <span className={`p-1 rounded-md ${astColor.b}`}><Activity size={13} className={`${astColor.i} stroke-[2.5px]`} /></span> Asistencia
                           </p>
                           <p className={`text-2xl font-bold leading-none mt-1 ${astColor.v}`}>{dest.asistenciaMes}%</p>
                         </div>

                         <div>
                           <p className={`text-[0.68rem] font-bold ${balColor.t} mb-1 flex items-center gap-1.5 uppercase tracking-widest`}>
                             <span className={`p-1 rounded-md ${balColor.b}`}><DollarSign size={13} className={`${balColor.i} stroke-[2.5px]`} /></span> Balance
                           </p>
                           <p className={`text-2xl font-bold leading-none mt-1 ${balColor.v}`}>
                             ${dest.balanceMes.toFixed(2)}
                           </p>
                         </div>
                      </div>

                    </div>

                    {/* Footer Action */}
                    <div className="bg-white px-6 py-4 border-t border-slate-100 flex justify-end">
                       <button
                          onClick={() => onViewDestacamento(dest.id, dest.nombre)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-colors group-hover:bg-blue-600 group-hover:text-white border border-blue-100 group-hover:border-blue-600"
                        >
                          Ver Operaciones
                          <ArrowRight size={16} />
                        </button>
                    </div>
                  </div>
                )})}
                
                {sortedData.length === 0 && (
                  <div className="col-span-full p-8 text-center font-medium text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm">
                    No hay destacamentos registrados en tu territorio.
                  </div>
                )}
              </div>
          )}
          </>
        )}
      </main>
    </div>
  );
}
