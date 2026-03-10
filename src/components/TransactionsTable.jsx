
import React from 'react';

const TransactionsTable = ({ transactions }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Handle specific date string avoiding timezone shift
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <h3 className="text-lg font-bold text-white">Histórico de Transações</h3>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.length > 0 ? (
              transactions.map((t, index) => (
                <tr key={t.id || index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3 text-slate-300 whitespace-nowrap text-sm">
                    {formatDate(t.data_lancamento)}
                  </td>
                  <td className="px-6 py-3 font-medium text-white text-sm">
                    {t.cliente}
                    {t.source === 'lancado' && (
                        <span className="ml-2 text-[10px] uppercase bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">Lançado</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-400 text-sm whitespace-nowrap">
                    {formatCurrency(t.valor)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                  Nenhuma transação encontrada no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
