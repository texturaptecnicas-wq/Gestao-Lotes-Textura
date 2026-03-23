import React from 'react';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FinanceReportTable = ({ records, onEdit, onDelete }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (!records || records.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhum registro encontrado</h3>
        <p className="text-slate-400">Ajuste os filtros ou crie um novo lançamento.</p>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl overflow-hidden border border-slate-700/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-300 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium">Descrição</th>
              <th className="px-6 py-4 font-medium">Tipo</th>
              <th className="px-6 py-4 font-medium">Categoria</th>
              <th className="px-6 py-4 font-medium">Valor</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {records.map((record) => (
              <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={record.id} 
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{formatDate(record.data_lancamento)}</td>
                <td className="px-6 py-4 text-white font-medium">{record.descricao}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    record.tipo === 'entrada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {record.tipo.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">{record.categoria}</td>
                <td className={`px-6 py-4 font-bold whitespace-nowrap ${record.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {record.tipo === 'saida' ? '-' : '+'}{formatCurrency(record.valor)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    record.status === 'confirmado' ? 'text-emerald-300 bg-emerald-500/10' :
                    record.status === 'pendente' ? 'text-amber-300 bg-amber-500/10' :
                    'text-slate-400 bg-slate-500/10'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => onEdit(record)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(record.id)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceReportTable;