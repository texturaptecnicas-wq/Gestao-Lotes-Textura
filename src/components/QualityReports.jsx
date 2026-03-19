import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getFilteredLogs, getFilterOptions, getReportDataByDateRange, getProblemsFrequency } from '@/services/qualityService';
import ReportFilters from './ReportFilters';
import ReportSummary from './ReportSummary';
import ReportEvolutionChart from './ReportEvolutionChart';
import ReportProblemsChart from './ReportProblemsChart';
import ReportSolutionsChart from './ReportSolutionsChart';
import ReportExport from './ReportExport';
import { getDateRange } from '@/utils/getDateRange';
const QualityReports = () => {
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    cabines: [],
    pintores: [],
    clientes: [],
    cores: []
  });
  const [currentFilters, setCurrentFilters] = useState({
    startDate: getDateRange('month').startDate,
    endDate: getDateRange('month').endDate,
    cabines: [],
    pintores: [],
    clientes: [],
    cores: []
  });
  const [reportData, setReportData] = useState({
    logs: [],
    prevLogs: [],
    evolutionData: [],
    problemsData: []
  });
  useEffect(() => {
    getFilterOptions().then(setFilterOptions).catch(console.error);
  }, []);
  const fetchDashboardData = useCallback(async filters => {
    setLoading(true);
    try {
      if (!filters.startDate || !filters.endDate) return;
      const logs = await getFilteredLogs(filters.startDate, filters.endDate, filters);
      const evolution = getReportDataByDateRange(logs);
      const problems = getProblemsFrequency(logs);

      // Calculate previous period for trend analysis directly here
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays + 1);
      const formatD = d => d.toISOString().split('T')[0];
      const prevLogs = await getFilteredLogs(formatD(prevStart), formatD(prevEnd), filters);
      setReportData({
        logs,
        prevLogs,
        evolutionData: evolution,
        problemsData: problems
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do painel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDashboardData(currentFilters);
  }, [currentFilters, fetchDashboardData]);
  const handleFilterChange = newFilters => {
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  return <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-950/80 print:bg-white print:text-black">
      
      <div className="mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Retrabalho</h2>
        <p className="text-slate-400">Análise detalhada de retrabalho e qualidade</p>
      </div>

      <div className="print:hidden">
        <ReportFilters onFilterChange={handleFilterChange} filterOptions={filterOptions} />
      </div>

      {loading ? <div className="flex flex-col items-center justify-center flex-1 text-sky-500 min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-slate-400 font-medium animate-pulse">Processando dados analíticos...</p>
        </div> : <div className="space-y-6">
          {/* Passed period filters to ReportSummary so it can display the correct date range */}
          <ReportSummary logs={reportData.logs} prevLogs={reportData.prevLogs} period={{
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate
      }} />

          <ReportEvolutionChart data={reportData.evolutionData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[450px]">
            <ReportProblemsChart data={reportData.problemsData} />
            <ReportSolutionsChart logs={reportData.logs} />
          </div>

          <div className="print:hidden">
             <ReportExport logs={reportData.logs} period={{
          startDate: currentFilters.startDate,
          endDate: currentFilters.endDate
        }} filters={currentFilters} />
          </div>
        </div>}
    </div>;
};
export default QualityReports;