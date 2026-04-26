import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Printer, Loader2, Users, Download, Activity, TrendingUp } from 'lucide-react';
import { apiFetch } from '../services/api';
import { ExportManager } from './ExportManager';

interface DemographicData {
  name: string;
  value: number;
  fill: string;
}

interface GrowthData {
  name: string;
  amiguitos: number;
  seguidores: number;
  servicio: number;
  total: number;
}

interface AttendanceData {
  date: string;
  asistencia: number;
}

interface ReportData {
  totalDestacamentos: number;
  demografia: DemographicData[];
  crecimiento: GrowthData[];
  asistenciaTrend: AttendanceData[];
}

interface RegionalReportProps {
  onBack: () => void;
}

export const RegionalReport: React.FC<RegionalReportProps> = ({ onBack }) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Reporte_Regional_${selectedYear}_${selectedMonth + 1}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const json = await apiFetch(`/territorio/reporte-detallado?month=${selectedMonth}&year=${selectedYear}`);
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Cargando reporte regional...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          <p className="font-bold">Error</p>
          <p>{error || 'No se pudieron cargar los datos'}</p>
          <button
            onClick={onBack}
            className="mt-4 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const globalName = storedUser.territorioNombre ? `Territorio ${storedUser.territorioNombre}` : "Región";

  const outpostInfo = {
    name: storedUser?.destacamento?.name || storedUser.destacamentoNombre || globalName,
    city: storedUser?.destacamento?.city || "",
    leader: storedUser.name || "Líder Regional",
    totalDestacamentos: data?.totalDestacamentos || 0
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return percent > 0 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // Calculos generales para las tarjetas superiores
  const totales = data ? {
    amiguitos: data.crecimiento.reduce((acc, curr) => acc + curr.amiguitos, 0),
    seguidores: data.crecimiento.reduce((acc, curr) => acc + curr.seguidores, 0),
    servicio: data.crecimiento.reduce((acc, curr) => acc + curr.servicio, 0),
    general: data.crecimiento.reduce((acc, curr) => acc + curr.total, 0),
  } : { amiguitos: 0, seguidores: 0, servicio: 0, general: 0 };

  const currentYear = new Date().getFullYear();
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera Responsiva */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
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
              Reporte Regional
            </p>
            <p className="text-[0.75rem] font-medium text-slate-500 mt-[1px] truncate">
              Métricas de crecimiento y asistencia
            </p>
          </div>
        </div>

        {/* Controles de Accion y Filtros */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer pl-1"
            >
              {months.map((m, i) => {
                const isFuture = selectedYear === currentYear && i > new Date().getMonth();
                return !isFuture ? <option key={i} value={i}>{m}</option> : null;
              })}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = Number(e.target.value);
                setSelectedYear(newYear);
                const currentMonth = new Date().getMonth();
                if (newYear === currentYear && selectedMonth > currentMonth) {
                  setSelectedMonth(currentMonth);
                }
              }}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {[2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
          >
            <Printer size={16} className="text-slate-500" />
            <span>Imprimir Visual</span>
          </button>
        </div>
      </div>

      {/* Contenedor Imprimible */}
      <div ref={printRef} className="bg-transparent rounded-2xl print:bg-white print:p-8 space-y-8 print:space-y-10">

        {/* Cabecera exclusiva de impresion */}
        <div className="hidden print:block mb-8 text-center border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reporte Regional: {months[selectedMonth]} {selectedYear}</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">{outpostInfo.name} — Reporte histórico generado el {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* --- Tarjetas de Resumen KPI --- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Destacamentos', value: data.totalDestacamentos || 0, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icon: Activity },
            { label: 'Total Exploradores', value: totales.general, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', icon: Users },
            { label: 'Amiguitos de Jesús', value: totales.amiguitos, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', icon: Users },
            { label: 'Seguidores', value: totales.seguidores, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: Users },
            { label: 'Servicio Cristiano', value: totales.servicio, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', icon: Users },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">{card.value}</p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-3 ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* --- Seccion 1: Demografia (Pie Chart) --- */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="text-blue-500" size={20} />
                  Distribución por Ministerios
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Desglose de edades y programas</p>
              </div>
              <ExportManager
                data={data.demografia as any[]}
                availableColumns={[
                  { key: "name", label: "Ministerio" },
                  { key: "value", label: "Total Exploradores" }
                ] as any[]}
                filename="Reporte_Demografia_Ministerios"
                reportTitle="Distribución por Ministerios"
                outpostInfo={outpostInfo}
              />
            </div>
            <div style={{ height: 320, width: '100%' }}>
              {data.demografia.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.demografia}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={105}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {data.demografia.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} niños`, 'Inscritos']}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users size={32} className="mb-2 opacity-50" />
                  <p className="font-medium">Sin datos demográficos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Seccion 2: Asistencia (Line Chart) --- */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-indigo-500" size={20} />
                  Tendencia de Asistencia
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Evolución porcentual del territorio</p>
              </div>
              <ExportManager
                data={data.asistenciaTrend as any[]}
                availableColumns={[
                  { key: "date", label: "Mes/Periodo" },
                  { key: "asistencia", label: "Asistencia Promedio (%)" }
                ] as any[]}
                filename="Reporte_Asistencia_Regional"
                reportTitle="Tendencia Histórica de Asistencia"
                outpostInfo={outpostInfo}
              />
            </div>
            <div style={{ height: 320, width: '100%' }}>
              {data.asistenciaTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.asistenciaTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                      dx={-10}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value}% participación`, 'Asistencia Media']}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="asistencia"
                      stroke="#6366f1"
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, stroke: '#e0e7ff', strokeWidth: 4 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Activity size={32} className="mb-2 opacity-50" />
                  <p className="font-medium">No hay suficientes reuniones registradas</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Seccion 3: Crecimiento por Destacamento (Stack Bar) --- */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Brigadas por Destacamentos
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Comparativa de grupos (Top 10 poblacional)</p>
              </div>
              <ExportManager
                data={data.crecimiento as any[]}
                availableColumns={[
                  { key: "name", label: "Destacamento" },
                  { key: "amiguitos", label: "Amiguitos de Jesús" },
                  { key: "seguidores", label: "Seguidores del Maestro" },
                  { key: "servicio", label: "Servicio Cristiano" },
                  { key: "total", label: "Total Exploradores" }
                ] as any[]}
                filename="Reporte_Brigadas_Destacamentos"
                reportTitle="Brigadas por Destacamentos"
                outpostInfo={outpostInfo}
              />
            </div>
            <div style={{ height: 360, width: '100%' }}>
              {data.crecimiento.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.crecimiento}
                    margin={{ top: 0, right: 0, left: -20, bottom: 20 }}
                    barSize={48}
                  >
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px' }} />
                    <Bar dataKey="amiguitos" stackId="a" name="Amiguitos" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="seguidores" stackId="a" name="Seguidores" fill="#22c55e" />
                    <Bar dataKey="servicio" stackId="a" name="Servicio" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <TrendingUp size={32} className="mb-2 opacity-50" />
                  <p className="font-medium">Aún no hay exploradores vinculados a los destacamentos</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegionalReport;
