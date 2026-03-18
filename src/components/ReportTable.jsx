
import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { getRecordWeight } from '@/services/qualityService';

const ReportTable = ({ records }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filter, setFilter] = useState('');

  const sortedAndFilteredRecords = useMemo(() => {
    let filtered = records;
    
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = records.filter(r => 
        (r.client_name || '').toLowerCase().includes(lowerFilter) ||
        (r.cor || '').toLowerCase().includes(lowerFilter) ||
        (r.pintor || '').toLowerCase().includes(lowerFilter) ||
        (r.problema || '').toLowerCase().includes(lowerFilter)
      );
    }

    return filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'quantidade') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      
      if (sortConfig.key === 'peso') {
        aValue = getRecordWeight(a.tamanho_peca);
        bValue = getRecordWeight(b.tamanho_peca);
      }

      if (sortConfig.key === 'ponderado') {
        aValue = (parseInt(a.quantidade) || 0) * getRecordWeight(a.tamanho_peca);
        bValue = (parseInt(b.quantidade) || 0) * getRecordWeight(b.tamanho_peca);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, sortConfig, filter]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const Th = ({ label, sortKey }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 text-slate-500" />
      </div>
    </th>
  );

  return (
    <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-bold text-white">Detalhamento de Registros</h3>
        <input 
          type="text" 
          placeholder="Filtrar tabela..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-sky-500/50 w-full md:w-64"
        />
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr>
              <Th label="Data" sortKey="date" />
              <Th label="Cabine" sortKey="cabine" />
              <Th label="Cliente" sortKey="client_name" />
              <Th label="Cor" sortKey="cor" />
              <Th label="Pintor" sortKey="pintor" />
              <Th label="Tamanho" sortKey="tamanho_peca" />
              <Th label="Problema" sortKey="problema" />
              <Th label="Qtd Real" sortKey="quantidade" />
              <Th label="Peso" sortKey="peso" />
              <Th label="Qtd Pond." sortKey="ponderado" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sortedAndFilteredRecords.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-slate-500 text-sm">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              sortedAndFilteredRecords.map((record) => {
                const weight = getRecordWeight(record.tamanho_peca);
                const rawQty = parseInt(record.quantidade) || 0;
                const weightedQty = rawQty * weight;

                return (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(record.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-bold">{record.cabine || '--'}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{record.client_name || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{record.cor || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{record.pintor || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {record.tamanho_peca ? record.tamanho_peca.replace('_', ' ').toUpperCase() : 'N/I'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 truncate max-w-[150px]" title={record.problema}>{record.problema || '--'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{rawQty}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">x{weight.toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm text-amber-400 font-bold">{weightedQty.toFixed(1)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
