import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];
const CustomTooltip = ({
  active,
  payload
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
        <p className="text-slate-200 font-bold mb-1">{data.name}</p>
        <p className="text-sm"><span className="text-slate-400">Frequência:</span> <span className="text-white font-bold">{data.count}</span></p>
        <p className="text-sm"><span className="text-slate-400">Impacto:</span> <span className="text-white font-bold">{data.percentage}%</span></p>
      </div>;
  }
  return null;
};
const ReportProblemsChart = ({
  data
}) => {
  if (!data || data.length === 0) {
    return <div className="dashboard-card h-80 flex items-center justify-center"><p className="text-slate-500">Sem dados de problemas</p></div>;
  }

  // Display ALL problems ordered by frequency
  const chartData = [...data].sort((a, b) => b.count - a.count);

  // Calculate dynamic height based on number of items to ensure readability
  const minHeight = 300;
  const calculatedHeight = Math.max(minHeight, chartData.length * 45);
  const renderCustomBarLabel = props => {
    const {
      x,
      y,
      width,
      height,
      value,
      index
    } = props;
    const item = chartData[index];
    return <text x={x + width + 8} y={y + height / 2} fill="#e2e8f0" fontSize={12} fontWeight="bold" dominantBaseline="middle">
        {value} ({item.percentage}%)
      </text>;
  };
  return <div className="dashboard-card w-full h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6">Gráfico por Sintomas</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        <div style={{
        height: calculatedHeight,
        width: '100%',
        paddingRight: '60px'
      }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{
            top: 5,
            right: 50,
            left: 10,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} hide={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} tick={{
              fill: '#e2e8f0'
            }} />
              <Tooltip content={<CustomTooltip />} cursor={{
              fill: 'rgba(255,255,255,0.05)'
            }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                <LabelList content={renderCustomBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>;
};
export default ReportProblemsChart;