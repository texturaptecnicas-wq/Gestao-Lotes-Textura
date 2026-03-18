import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, Loader2, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getPeriodRange } from '@/utils/periodHelpers';
import { getLogsForPeriod, getQualityReport, saveQualityReport, calculateWeightedReworkPercentage, calculateMetricAggregations } from '@/services/qualityService';
import ReportMetrics from './ReportMetrics';
import ReportCharts from './ReportCharts';
import ReportTable from './ReportTable';
import ReportByCabine from './ReportByCabine';
const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const QualityReports = () => {
  const [reportView, setReportView] = useState('geral'); // 'geral' | 'cabine'
  const [periodType, setPeriodType] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [records, setRecords] = useState([]);
  const [totalPiecesPainted, setTotalPiecesPainted] = useState(0);
  const [reworkPercentage, setReworkPercentage] = useState(0);
  const [aggregations, setAggregations] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingTotal, setSavingTotal] = useState(false);
  const fetchData = useCallback(async () => {
    // Only fetch global data if we are in 'geral' view. ReportByCabine handles its own fetching.
    if (reportView !== 'geral') return;
    setLoading(true);
    try {
      const range = getPeriodRange(periodType, selectedDate);
      setDateRange(range);
      const [fetchedLogs, savedReport] = await Promise.all([getLogsForPeriod(range.start, range.end), getQualityReport(periodType, range.start, range.end)]);
      setRecords(fetchedLogs);
      const totalPieces = savedReport ? savedReport.total_pieces_painted : 0;
      setTotalPiecesPainted(totalPieces);
      const percentage = calculateWeightedReworkPercentage(fetchedLogs, totalPieces);
      setReworkPercentage(percentage);
      const aggs = calculateMetricAggregations(fetchedLogs);
      setAggregations(aggs);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao carregar relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [periodType, selectedDate, reportView]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleSaveTotalPieces = async value => {
    setSavingTotal(true);
    try {
      const percentage = calculateWeightedReworkPercentage(records, value);
      await saveQualityReport({
        period_type: periodType,
        period_start: dateRange.start,
        period_end: dateRange.end,
        total_pieces_painted: value,
        rework_percentage: percentage
      });
      setTotalPiecesPainted(value);
      setReworkPercentage(percentage);
      toast({
        title: "Sucesso",
        description: "Total de peças e % ponderada atualizados."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar total de peças.",
        variant: "destructive"
      });
    } finally {
      setSavingTotal(false);
    }
  };
  const formatDisplayRange = () => {
    if (!dateRange.start || !dateRange.end) return '';
    const formatSafeShortDate = dStr => {
      const [y, m, d] = dStr.split('T')[0].split('-');
      return `${d}/${m}/${y.slice(-2)}`;
    };
    const d1 = formatSafeShortDate(dateRange.start);
    const d2 = formatSafeShortDate(dateRange.end);
    return d1 === d2 ? d1 : `${d1} até ${d2}`;
  };
  return <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-2 md:p-6 bg-slate-950/50">
      
      {/* Top View Selector */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
         <button onClick={() => setReportView('geral')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${reportView === 'geral' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
           Visão Geral
         </button>
         <button onClick={() => setReportView('cabine')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${reportView === 'cabine' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
           Por Cabine
         </button>
      </div>

      {reportView === 'cabine' ? <ReportByCabine /> : <>
          {/* Filters Header (Global View) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Análise de Retrabalho
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sky-400 font-semibold text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Período: {formatDisplayRange()}
                </p>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Inclui lançamentos retroativos
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500">
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
              
              <input type="date" style={{
            colorScheme: 'dark'
          }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 flex-1 md:flex-none" />
              
              <button onClick={fetchData} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700" title="Atualizar">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3 min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p>Analisando dados globais ponderados...</p>
            </div> : <>
              <ReportMetrics records={records} totalPiecesPainted={totalPiecesPainted} reworkPercentage={reworkPercentage} aggregations={aggregations} onSaveTotalPieces={handleSaveTotalPieces} isSaving={savingTotal} />
              
              <ReportCharts aggregations={aggregations.aggregations || {
          clients: {},
          colors: {},
          painters: {},
          problems: {},
          sizes: {}
        }} />
              
              <ReportTable records={records} />
            </>}
        </>}
    </div>;
};
export default QualityReports;