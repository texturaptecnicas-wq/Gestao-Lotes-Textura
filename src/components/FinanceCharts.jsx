import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const FinanceCharts = ({ records }) => {
  const chartData = useMemo(() => {
    if (!records) return { barData: [], pieData: [] };

    // Bar Chart Data (Entradas vs Saídas por Categoria ou Mês - using Categoria here for simplicity)
    const grouped = records.reduce((acc, curr) => {
      if (curr.status === 'cancelado') return acc;
      
      const cat = curr.categoria;
      if (!acc[cat]) acc[cat] = { name: cat, entrada: 0, saida: 0 };
      
      if (curr.tipo === 'entrada') acc[cat].entrada += parseFloat(curr.valor);
      if (curr.tipo === 'saida') acc[cat].saida += parseFloat(curr.valor);
      
      return acc;
    }, {});

    const barData = Object.values(grouped);

    // Pie Chart Data (Distribution of Saídas)
    const saidas = records.filter(r => r.tipo === 'saida' && r.status !== 'cancelado');
    const saidasGrouped = saidas.reduce((acc, curr) => {
      const cat = curr.categoria;
      acc[cat] = (acc[cat] || 0) + parseFloat(curr.valor);
      return acc;
    }, {});
    
    const pieData = Object.entries(saidasGrouped).map(([name, value]) => ({ name, value }));

    return { barData, pieData };
  }, [records]);

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  if (!records || records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="glass-effect p-6 rounded-2xl border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6">Fluxo por Categoria</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                formatter={(value) => [`R$ ${value}`, '']}
              />
              <Legend />
              <Bar dataKey="entrada" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saida" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-effect p-6 rounded-2xl border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6">Distribuição de Saídas</h3>
        <div className="h-[300px]">
          {chartData.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value) => [`R$ ${value}`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-500">Sem dados de saída para exibir.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceCharts;