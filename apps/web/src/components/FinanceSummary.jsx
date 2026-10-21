import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const FinanceSummary = ({ summary }) => {
  const { totalEntradas = 0, totalSaidas = 0, saldoLiquido = 0 } = summary || {};

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const cards = [
    {
      title: 'Total Entradas',
      value: formatCurrency(totalEntradas),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Total Saídas',
      value: formatCurrency(totalSaidas),
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      title: 'Saldo Líquido',
      value: formatCurrency(saldoLiquido),
      icon: DollarSign,
      color: saldoLiquido >= 0 ? 'text-sky-500' : 'text-rose-500',
      bg: saldoLiquido >= 0 ? 'bg-sky-500/10' : 'bg-rose-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-effect p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">{card.title}</h3>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default FinanceSummary;