
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#EC4899'];

const formatDataForChart = (dict, maxItems = 5) => {
  return Object.entries(dict)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold text-sm mb-1">{label || payload[0].name}</p>
        <p className="text-sky-400 font-bold text-sm">
          {Number(payload[0].value).toFixed(1)} peças pond.
        </p>
      </div>
    );
  }
  return null;
};

const ReportCharts = ({ aggregations }) => {
  const clientsData = useMemo(() => formatDataForChart(aggregations.clients, 7), [aggregations.clients]);
  const problemsData = useMemo(() => formatDataForChart(aggregations.problems, 7), [aggregations.problems]);
  const paintersData = useMemo(() => formatDataForChart(aggregations.painters, 7), [aggregations.painters]);
  const colorsData = useMemo(() => formatDataForChart(aggregations.colors, 5), [aggregations.colors]);
  const sizesData = useMemo(() => formatDataForChart(aggregations.sizes, 5), [aggregations.sizes]);

  const ChartContainer = ({ title, children, className = "" }) => (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-xl p-5 ${className}`}>
      <h4 className="text-slate-300 font-bold text-sm mb-6 uppercase tracking-wider">{title} <span className="text-xs text-slate-500 font-normal lowercase ml-1">(ponderado)</span></h4>
      <div className="w-full h-[250px]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <ChartContainer title="Top Clientes c/ Retrabalho">
        {clientsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-center text-sm pt-20">Sem dados suficientes</p>}
      </ChartContainer>

      <ChartContainer title="Principais Problemas">
        {problemsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-center text-sm pt-20">Sem dados suficientes</p>}
      </ChartContainer>

      <ChartContainer title="Cores mais Problemáticas">
        {colorsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={colorsData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {colorsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-center text-sm pt-20">Sem dados suficientes</p>}
      </ChartContainer>

      <ChartContainer title="Retrabalho por Pintor">
        {paintersData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paintersData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-center text-sm pt-20">Sem dados suficientes</p>}
      </ChartContainer>
      
      <ChartContainer title="Retrabalho por Tamanho" className="lg:col-span-2">
        {sizesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-center text-sm pt-20">Sem dados suficientes</p>}
      </ChartContainer>
    </div>
  );
};

export default ReportCharts;
