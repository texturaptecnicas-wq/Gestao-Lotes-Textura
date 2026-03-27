
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';

const CustomTooltip = ({
  active,
  payload,
  label
}) => {
  if (active && payload && payload.length) {
    // Use UTC to avoid off-by-one day errors due to local timezone shifts when parsing 'YYYY-MM-DD'
    const formattedDate = new Date(label).toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    });
    return <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl">
        <p className="text-slate-300 font-bold mb-2 pb-2 border-b border-slate-800">{formattedDate}</p>
        {payload.map((entry, index) => <div key={index} className="flex flex-col gap-1 text-sm mt-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{
            backgroundColor: entry.color
          }}></div>
              <span className="text-slate-400">Retrabalho:</span>
              <span className="font-bold text-white">
                {entry.value === 0 ? '0 retrabalhos (Dia Limpo)' : `${entry.value} peças`}
              </span>
            </div>
          </div>)}
      </div>;
  }
  return null;
};

const ReportEvolutionChart = ({
  data
}) => {
  // Include dates with actual rework OR days explicitly marked as zero-rework
  const filteredData = data?.filter(item => item.totalRework > 0 || item.isZeroRework) || [];
  
  if (!filteredData || filteredData.length === 0) {
    return <div className="dashboard-card flex items-center justify-center h-80">
        <p className="text-slate-500">Nenhum dado de retrabalho para o período selecionado.</p>
      </div>;
  }

  return <div className="dashboard-card w-full mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Evolução do Retrabalho</h3>
      <div className="chart-container relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 10
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={val => new Date(val).toLocaleDateString('pt-BR', {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit'
          })} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{
            paddingTop: '20px'
          }} />
            <Line type="monotone" dataKey="totalRework" name="Qtd. Retrabalho" stroke="#3b82f6" strokeWidth={3} dot={{
            r: 4,
            fill: "#1e293b",
            strokeWidth: 2
          }} activeDot={{
            r: 6,
            fill: "#3b82f6",
            stroke: "#fff"
          }}>
              <LabelList dataKey="totalRework" position="top" fill="#cbd5e1" fontSize={12} offset={10} fontWeight="bold" />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>;
};

export default ReportEvolutionChart;
