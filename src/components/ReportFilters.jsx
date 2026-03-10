
import React, { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { getDateRange } from '@/utils/getDateRange';

const ReportFilters = ({ onPeriodChange }) => {
  const [activeFilter, setActiveFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Initialize with month
  useEffect(() => {
    handleQuickFilter('month');
  }, []);

  const handleQuickFilter = (type) => {
    setActiveFilter(type);
    const { startDate, endDate } = getDateRange(type);
    setCustomStart(startDate);
    setCustomEnd(endDate);
    onPeriodChange({ startDate, endDate, periodType: type });
  };

  const handleCustomFilter = () => {
    if (customStart && customEnd) {
      setActiveFilter('custom');
      onPeriodChange({ startDate: customStart, endDate: customEnd, periodType: 'custom' });
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Filtros de Relatório</h3>
        </div>
        
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex overflow-x-auto w-full md:w-auto">
          {[
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: 'Esta Semana' },
            { id: 'month', label: 'Este Mês' },
            { id: 'year', label: 'Este Ano' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleQuickFilter(btn.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === btn.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-slate-500" />
          <div className="flex flex-col">
             <label className="text-xs text-slate-500 font-medium">Data Inicial</label>
             <input 
               type="date" 
               value={customStart}
               onChange={(e) => setCustomStart(e.target.value)}
               className="bg-transparent text-white border-none outline-none focus:ring-0 p-0 text-sm"
             />
          </div>
        </div>
        <div className="hidden sm:block text-slate-700">até</div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-slate-500" />
          <div className="flex flex-col">
             <label className="text-xs text-slate-500 font-medium">Data Final</label>
             <input 
               type="date" 
               value={customEnd}
               onChange={(e) => setCustomEnd(e.target.value)}
               className="bg-transparent text-white border-none outline-none focus:ring-0 p-0 text-sm"
             />
          </div>
        </div>
        <button
          onClick={handleCustomFilter}
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors mt-2 sm:mt-0"
        >
          Aplicar Customizado
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-emerald-400/80 font-medium bg-emerald-500/10 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20">
          Período analisado: <span className="font-bold text-emerald-400">{formatDateDisplay(customStart)}</span> até <span className="font-bold text-emerald-400">{formatDateDisplay(customEnd)}</span>
        </p>
      </div>
    </div>
  );
};

export default ReportFilters;
