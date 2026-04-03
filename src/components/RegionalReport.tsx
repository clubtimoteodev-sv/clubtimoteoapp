import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';

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
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Reporte_Regional_Mensual',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await apiFetch('/territorio/reporte-detallado');
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* cabecera con botones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white text-gray-600 rounded-full hover:bg-gray-100 shadow-sm transition-colors border border-gray-200"
            title="Volver al inicio"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Reporte Regional</h1>
            <p className="text-sm text-gray-500 font-medium">Visualización y análisis de datos de su zona</p>
          </div>
        </div>
        
        {/* Boton imprimir */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 w-full sm:w-auto justify-center"
        >
          <Printer size={18} />
          Generar Reporte Mensual
        </button>
      </div>

      {/* Contenedor Imprimible */}
      <div ref={printRef} className="space-y-8 bg-gray-50 p-6 sm:p-2 sm:bg-transparent rounded-2xl print:bg-white print:p-8">
        
        {/* Solo visible en impresion */}
        <div className="hidden print:block mb-8 text-center border-b pb-4">
          <h1 className="text-3xl font-black text-gray-900">Reporte Regional Mensual</h1>
          <p className="text-gray-500 mt-2">Diócesis / Zona Evaluada — Generado el {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seccion 1: Demografia (Pie Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">Demografía por Ministerios</h2>
              <p className="text-sm text-gray-500">Distribución de exploradores por rango de edad</p>
            </div>
            <div style={{ height: 300, width: '100%' }}>
              {data.demografia.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.demografia}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {data.demografia.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value} exploradores`, 'Cantidad']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No hay datos demográficos de exploradores registrados.
                </div>
              )}
            </div>
          </div>

          {/* Seccion 2: Asistencia (Line Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">Tendencia de Asistencia</h2>
              <p className="text-sm text-gray-500">Promedio general de la zona en los últimos meses (%)</p>
            </div>
            <div style={{ height: 300, width: '100%' }}>
              {data.asistenciaTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.asistenciaTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value}% asistencia promedio`, 'Asistencia']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="asistencia" 
                      stroke="#4F46E5" 
                      strokeWidth={4}
                      dot={{ r: 6, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No hay suficientes datos de reuniones para mostrar una tendencia.
                </div>
              )}
            </div>
          </div>

          {/* Seccion 3: Crecimiento / Distribucion por Destacamento (Stacked Bar Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">Grupos por Destacamento</h2>
              <p className="text-sm text-gray-500">Desglose de los destacamentos con más exploradores (Top 10)</p>
            </div>
            <div style={{ height: 320, width: '100%' }} className="mt-6">
              {data.crecimiento.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.crecimiento}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                    <Bar dataKey="amiguitos" stackId="a" name="Amiguitos de Jesús" fill="#00BFFF" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="seguidores" stackId="a" name="Seguidores del Maestro" fill="#228B22" />
                    <Bar dataKey="servicio" stackId="a" name="Servicio Cristiano" fill="#FF0000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No hay datos en los destacamentos del territorio.
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
