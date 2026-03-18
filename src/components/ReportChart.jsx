import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        <p className="text-emerald-400 font-bold">
          {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    );
  }
  return null;
};

const ReportChart = ({ transactions }) => {
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const dateMap = {};
    
    // Reverse logic to map from oldest to newest for chronological chart display
    const sorted = [...transactions].sort((a, b) => new Date(a.data_lancamento) - new Date(b.data_lancamento));

    sorted.forEach(t => {
      const dateParts = t.data_lancamento.split('T')[0].split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}`; // DD/MM
      
      if (!dateMap[formattedDate]) {
        dateMap[formattedDate] = { data: formattedDate, total: 0 };
      }
      dateMap[formattedDate].total += Number(t.valor);
    });

    return Object.values(dateMap);
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center justify-center h-80">
        <p className="text-slate-500">Nenhum dado para exibir no gráfico.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 h-[400px]">
      <h3 className="text-lg font-bold text-white mb-6">Evolução de Receita</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="data" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportChart;