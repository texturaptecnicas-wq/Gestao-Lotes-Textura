import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X, BarChart3 } from 'lucide-react';
import { getDateRange } from '@/utils/getDateRange';

const ReportFilters = ({ onFilterChange, filterOptions, onCompareOpen, currentFilters }) => {
  const [activePeriod, setActivePeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [selectedCabines, setSelectedCabines] = useState([]);
  const [selectedPintores, setSelectedPintores] = useState([]);

  useEffect(() => {
    handlePeriodSelect('month');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local state with currentFilters passed from parent
  useEffect(() => {
    if (currentFilters) {
      if (currentFilters.cabines) setSelectedCabines(currentFilters.cabines);
      if (currentFilters.pintores) setSelectedPintores(currentFilters.pintores);
      if (currentFilters.startDate) setCustomStart(currentFilters.startDate);
      if (currentFilters.endDate) setCustomEnd(currentFilters.endDate);
    }
  }, [currentFilters]);

  const handlePeriodSelect = (type) => {
    setActivePeriod(type);
    const { startDate, endDate } = getDateRange(type);
    setCustomStart(startDate);
    setCustomEnd(endDate);
  };

  const applyFilters = () => {
    onFilterChange({
      startDate: customStart,
      endDate: customEnd,
      cabines: selectedCabines,
      pintores: selectedPintores,
      clientes: [], 
      cores: []
    });
  };

  const clearFilters = () => {
    setSelectedCabines([]);
    setSelectedPintores([]);
    handlePeriodSelect('month');
    setTimeout(() => {
       onFilterChange({
        startDate: getDateRange('month').startDate,
        endDate: getDateRange('month').endDate,
        cabines: [], pintores: [], clientes: [], cores: []
      });
    }, 100);
  };

  const toggleSelection = (setter, current, item) => {
    if (current.includes(item)) {
      setter(current.filter(i => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  return (
    <div className="dashboard-card mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Selection */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-white">Período</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['today', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodSelect(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePeriod === p ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana (Seg-Sex)' : p === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => {setCustomStart(e.target.value); setActivePeriod('custom');}}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 w-full" 
            />
            <span className="text-slate-500">até</span>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => {setCustomEnd(e.target.value); setActivePeriod('custom');}}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 w-full" 
            />
          </div>
        </div>

        {/* Categorical Filters */}
        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-slate-200">Cabine</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {filterOptions?.cabines?.map(c => (
                  <button key={c} onClick={() => toggleSelection(setSelectedCabines, selectedCabines, c)}
                    className={`px-2 py-1 text-xs rounded-md border ${selectedCabines.includes(c) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    Cabine {c}
                  </button>
                ))}
              </div>
           </div>
           <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-200">Pintor</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {filterOptions?.pintores?.map(p => (
                  <button key={p} onClick={() => toggleSelection(setSelectedPintores, selectedPintores, p)}
                    className={`px-2 py-1 text-xs rounded-md border ${selectedPintores.includes(p) ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-end gap-2 min-w-[140px]">
          {onCompareOpen && (
            <button 
              onClick={onCompareOpen} 
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-4 h-4" /> Comparar
            </button>
          )}
          <div className="flex gap-2 w-full">
            <button onClick={clearFilters} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1">
              <X className="w-4 h-4" /> Limpar
            </button>
            <button onClick={applyFilters} className="flex-[2] py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-sky-500/20">
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;