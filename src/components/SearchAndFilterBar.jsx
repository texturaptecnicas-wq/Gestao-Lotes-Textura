
import React from 'react';
import { Search, FilterX } from 'lucide-react';
import { PIECE_SIZES } from '@/utils/pieceSizeConfig';

const SearchAndFilterBar = ({ 
  onSearch, 
  onFilterCabine, 
  onFilterSize,
  cabineFilter, 
  searchTerm,
  sizeFilter,
  dateRange,
  onDateRangeChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full items-center">
      <div className="relative flex-1 w-full min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar cliente, cor, pintor..." 
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/50 focus:outline-none transition-all placeholder:text-slate-500"
        />
      </div>
      
      <div className="flex gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
        {onDateRangeChange && (
          <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 h-[42px]">
            <span className="text-xs font-medium text-slate-500">De:</span>
            <input 
              type="date" 
              style={{ colorScheme: 'dark' }}
              value={dateRange?.start || ''}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-none text-sm text-white focus:ring-0 p-0 w-[110px]"
            />
            <span className="text-xs font-medium text-slate-500 ml-1">Até:</span>
            <input 
              type="date" 
              style={{ colorScheme: 'dark' }}
              value={dateRange?.end || ''}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-none text-sm text-white focus:ring-0 p-0 w-[110px]"
            />
          </div>
        )}

        <select 
          value={cabineFilter}
          onChange={(e) => onFilterCabine(e.target.value)}
          className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/50 focus:outline-none min-w-[130px] appearance-none"
        >
          <option value="all">Todas Cabines</option>
          <option value="1">Cabine 1</option>
          <option value="2">Cabine 2</option>
          <option value="3">Cabine 3</option>
          <option value="4">Cabine 4</option>
        </select>

        <select 
          value={sizeFilter || 'all'}
          onChange={(e) => onFilterSize(e.target.value)}
          className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/50 focus:outline-none min-w-[150px] appearance-none"
        >
          <option value="all">Todos Tamanhos</option>
          {PIECE_SIZES.map(size => (
            <option key={size.id} value={size.value}>{size.label}</option>
          ))}
        </select>
        
        {(searchTerm || cabineFilter !== 'all' || sizeFilter !== 'all' || (dateRange && (dateRange.start || dateRange.end))) && (
          <button 
            onClick={() => { 
              onSearch(''); 
              onFilterCabine('all'); 
              onFilterSize('all'); 
              if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Limpar Filtros"
          >
            <FilterX className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
