
import React, { useState } from 'react';
import { Edit, Trash2, AlertCircle, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ClientDetailsModal from './ClientDetailsModal';

const FinanceReportTable = ({ groupedData, onEdit, onDelete }) => {
  const [selectedClientName, setSelectedClientName] = useState(null);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };
  
  if (!groupedData || groupedData.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-700/50">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhum registro encontrado</h3>
        <p className="text-slate-400">Ajuste os filtros ou crie um novo lançamento.</p>
      </div>
    );
  }

  const activeClientData = selectedClientName 
    ? groupedData.find(g => g.clientName === selectedClientName) 
    : null;

  return (
    <>
      <div className="glass-effect rounded-2xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-300 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {groupedData.map((group, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={group.clientName} 
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-bold whitespace-nowrap">
                    {group.clientName}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {group.categories}
                  </td>
                  <td className={`px-6 py-4 font-bold whitespace-nowrap ${group.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(group.total)}
                  </td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                    {formatDate(group.latestDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {group.transactions.length === 1 ? (
                        <>
                          <button 
                            onClick={() => onEdit(group.transactions[0])} 
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(group.transactions[0].id)} 
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setSelectedClientName(group.clientName)} 
                          className="px-4 py-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-sky-500/20"
                        >
                          <Maximize2 className="w-4 h-4" /> 
                          <span className="hidden sm:inline">Ver Detalhes</span>
                          <span className="sm:hidden">Detalhes</span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailsModal 
        isOpen={!!selectedClientName && !!activeClientData}
        onClose={() => setSelectedClientName(null)}
        clientData={activeClientData}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

export default FinanceReportTable;
