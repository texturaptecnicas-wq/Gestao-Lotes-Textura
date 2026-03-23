import React from 'react';
import { Filter, Calendar, Tag, Activity } from 'lucide-react';

const FinanceFilters = ({ filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="glass-effect p-5 rounded-2xl border border-slate-700/50 mb-6 flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1.5">
          <Calendar className="w-4 h-4" /> Período
        </label>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
          />
          <span className="text-slate-500">até</span>
          <input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="w-full md:w-auto">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1.5">
          <Filter className="w-4 h-4" /> Tipo
        </label>
        <select 
          value={filters.tipo} 
          onChange={(e) => handleChange('tipo', e.target.value)}
          className="w-full md:w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="todos">Todos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </div>

      <div className="w-full md:w-auto">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1.5">
          <Activity className="w-4 h-4" /> Status
        </label>
        <select 
          value={filters.status} 
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full md:w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="todos">Todos</option>
          <option value="confirmado">Confirmado</option>
          <option value="pendente">Pendente</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
    </div>
  );
};

export default FinanceFilters;