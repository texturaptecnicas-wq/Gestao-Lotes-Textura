import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Hash, Target } from 'lucide-react';

const ReportSummaryCards = ({ transactions }) => {
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        count: 0,
        avg: 0,
        max: 0,
        min: 0
      };
    }

    const values = transactions.map(t => Number(t.valor) || 0);
    const total = values.reduce((acc, val) => acc + val, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      total,
      count: transactions.length,
      avg: total / transactions.length,
      max,
      min
    };
  }, [transactions]);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cards = [
    { label: 'Total do Período', value: formatCurrency(stats.total), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Transações', value: stats.count, icon: Hash, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Valor Médio', value: formatCurrency(stats.avg), icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Maior Transação', value: formatCurrency(stats.max), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Menor Transação', value: formatCurrency(stats.min), icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
             <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
             <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
             </div>
          </div>
          <h4 className={`text-xl font-bold ${card.color} truncate`}>
            {card.value}
          </h4>
        </motion.div>
      ))}
    </div>
  );
};

export default ReportSummaryCards;