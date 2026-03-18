
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, Loader2, Factory, TrendingDown, AlertTriangle, User, ShieldAlert } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getPeriodRange } from '@/utils/periodHelpers';
import { getWeightedMetricsForAllCabines, calculateWeightedReworkPercentage } from '@/services/qualityService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import ReportTable from './ReportTable';

const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const CABINE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#EF4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold text-sm mb-1">{label}</p>
        <p className="text-sky-400 font-bold text-sm">
          {payload[0].value.toFixed(1)}% Retrabalho Ponderado
        </p>
      </div>
    );
  }
  return null;
};

const ReportByCabine = () => {
  const [periodType, setPeriodType] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [cabineData, setCabineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCabineLogs, setSelectedCabineLogs] = useState([]);
  const [activeCabine, setActiveCabine] = useState(null);
  
  // State for storing user-inputted total pieces painted per cabin (to calculate %)
  const [totalsPainted, setTotalsPainted] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getPeriodRange(periodType, selectedDate);
      setDateRange(range);

      const rawCabineData = await getWeightedMetricsForAllCabines(range.start, range.end);
      
      // Process and sort cabine data
      const processed = rawCabineData.map(cab => {
        // Find top problem
        const sortedProblems = Object.entries(cab.problems).sort((a, b) => b[1] - a[1]);
        const topProblem = sortedProblems.length > 0 ? sortedProblems[0][0] : 'N/A';
        
        // Find top painter
        const sortedPainters = Object.entries(cab.painters).sort((a, b) => b[1] - a[1]);
        const topPainter = sortedPainters.length > 0 ? sortedPainters[0][0] : 'N/A';

        return {
          ...cab,
          topProblem,
          topPainter
        };
      }).sort((a, b) => b.weightedRework - a.weightedRework); // Sort by highest rework by default

      setCabineData(processed);
      if (processed.length > 0 && !activeCabine) {
        setActiveCabine(processed[0].cabine);
        setSelectedCabineLogs(processed[0].logs);
      } else if (activeCabine) {
        const current = processed.find(c => c.cabine === activeCabine);
        setSelectedCabineLogs(current ? current.logs : []);
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar relatórios por cabine.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [periodType, selectedDate, activeCabine]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTotalChange = (cabineId, value) => {
    setTotalsPainted(prev => ({ ...prev, [cabineId]: parseInt(value) || 0 }));
  };

  const handleCabineSelect = (cabineId, logs) => {
    setActiveCabine(cabineId);
    setSelectedCabineLogs(logs);
    // scroll to table slightly
  };

  const formatDisplayRange = () => {
    if (!dateRange.start || !dateRange.end) return '';
    const formatSafeShortDate = (dStr) => {
      const [y, m, d] = dStr.split('T')[0].split('-');
      return `${d}/${m}/${y.slice(-2)}`;
    };
    const d1 = formatSafeShortDate(dateRange.start);
    const d2 = formatSafeShortDate(dateRange.end);
    return d1 === d2 ? d1 : `${d1} até ${d2}`;
  };

  // Prepare chart data based on inputted totals
  const chartData = cabineData.map(cab => {
    const total = totalsPainted[cab.cabine] || 0;
    const percentage = total > 0 ? calculateWeightedReworkPercentage(cab.weightedRework, total) : 0;
    return {
      name: `Cabine ${cab.cabine}`,
      percentage: percentage,
      rawRework: cab.rawRework,
      weightedRework: cab.weightedRework
    };
  }).sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-sky-400" />
            Desempenho por Cabine
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sky-400 font-semibold text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Período: {formatDisplayRange()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
          
          <input
            type="date"
            style={{ colorScheme: 'dark' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 flex-1 md:flex-none"
          />
          
          <button 
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p>Analisando dados das cabines...</p>
        </div>
      ) : cabineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-4 text-center">
          <ShieldAlert className="w-12 h-12 mb-3 text-slate-600" />
          <p className="text-lg">Nenhum retrabalho registrado para o período.</p>
        </div>
      ) : (
        <>
          {/* Info Notice */}
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-3 text-sm text-sky-200">
             <div className="mt-0.5"><TrendingDown className="w-4 h-4" /></div>
             <p><strong>Cálculo Ponderado:</strong> O retrabalho é ajustado pelo peso do tamanho da peça (Muito Pequena=0.5x, Média=1.5x, Muito Grande=3.0x). Insira o total de peças produzidas por cabine para visualizar a porcentagem de retrabalho.</p>
          </div>

          {/* Cabin Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabineData.map((cab, index) => {
              const totalPainted = totalsPainted[cab.cabine] || '';
              const percentage = totalPainted > 0 ? calculateWeightedReworkPercentage(cab.weightedRework, totalPainted) : 0;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={cab.cabine} 
                  onClick={() => handleCabineSelect(cab.cabine, cab.logs)}
                  className={`bg-slate-900/60 border ${activeCabine === cab.cabine ? 'border-sky-500 ring-1 ring-sky-500/50' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-5 flex flex-col shadow-lg transition-all cursor-pointer relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: CABINE_COLORS[index % CABINE_COLORS.length] }} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Factory className="w-5 h-5 text-slate-400" />
                      Cabine {cab.cabine}
                    </h3>
                    {percentage > 0 && (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${percentage > 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {percentage.toFixed(1)}% Ret.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Peças Retrabalho</p>
                      <p className="text-xl font-bold text-amber-400">{cab.weightedRework.toFixed(1)} <span className="text-xs text-slate-500 font-normal ml-1">Pond.</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">{cab.rawRework} Reais</p>
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Produção Total</p>
                       <input 
                          type="number"
                          placeholder="Qtd..."
                          value={totalPainted}
                          onChange={(e) => handleTotalChange(cab.cabine, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-white focus:ring-1 focus:ring-sky-500"
                       />
                    </div>
                  </div>

                  <div className="mt-auto space-y-2 pt-3 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="truncate" title={cab.topProblem}>{cab.topProblem}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <User className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{cab.topPainter}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mt-6">
            <h4 className="text-slate-300 font-bold text-sm mb-6 uppercase tracking-wider">Comparativo de Retrabalho Ponderado (%)</h4>
            <div className="w-full h-[300px]">
              {chartData.some(d => d.percentage > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CABINE_COLORS[index % CABINE_COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Insira a produção total nas cabines para gerar o gráfico comparativo.
                </div>
              )}
            </div>
          </div>

          {/* Details Table for Selected Cabine */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Registros Detalhados {activeCabine ? `- Cabine ${activeCabine}` : ''}
            </h3>
            <ReportTable records={selectedCabineLogs} />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportByCabine;
