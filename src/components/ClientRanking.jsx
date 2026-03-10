
import React, { useMemo } from 'react';

const ClientRanking = ({ transactions }) => {
  const ranking = useMemo(() => {
    const clientMap = {};
    
    transactions.forEach(t => {
      if (!clientMap[t.cliente]) {
        clientMap[t.cliente] = {
          cliente: t.cliente,
          total: 0,
          count: 0
        };
      }
      clientMap[t.cliente].total += Number(t.valor);
      clientMap[t.cliente].count += 1;
    });

    return Object.values(clientMap).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden h-full">
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <h3 className="text-lg font-bold text-white">Ranking de Clientes</h3>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
        {ranking.length > 0 ? (
          ranking.map((client, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold truncate max-w-[150px] sm:max-w-full">{client.cliente}</h4>
                  <p className="text-xs text-slate-500">{client.count} transações</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold">{formatCurrency(client.total)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            Sem dados para ranking.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRanking;
