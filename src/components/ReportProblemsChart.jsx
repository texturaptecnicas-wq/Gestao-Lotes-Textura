import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { getClientColor } from '@/utils/clientColorPalette';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Filter out the invisible bar used for the total label
    const visiblePayloads = payload.filter(p => p.dataKey !== 'count');
    
    if (visiblePayloads.length === 0) return null;

    const data = visiblePayloads[0].payload; 

    const clients = visiblePayloads.map(p => ({
       name: p.name,
       value: p.value,
       color: p.color
    })).sort((a,b) => b.value - a.value);

    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl z-50 min-w-[200px]">
        <p className="text-slate-200 font-bold mb-1">{label}</p>
        <p className="text-sm mb-3 border-b border-slate-700 pb-2">
          <span className="text-slate-400">Total:</span> <span className="text-white font-bold">{data.count} ({data.percentage}%)</span>
        </p>
        <div className="space-y-1">
          {clients.map(c => (
            <div key={c.name} className="flex items-center justify-between text-xs gap-4">
              <span style={{ color: c.color }} className="font-semibold">{c.name}:</span>
              <span className="text-white">{c.value} ({((c.value / data.count) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomSegmentLabel = (props, clientName) => {
  const { x, y, width, height, value } = props;
  if (!value || width < 30) return null; // Hide if segment is too small
  
  return (
    <text 
      x={x + width / 2} 
      y={y + height / 2} 
      fill="#ffffff" 
      fontSize={10} 
      fontWeight="bold"
      textAnchor="middle" 
      dominantBaseline="central"
      style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.9)' }}
    >
      {width > 80 ? `${clientName}: ${value}` : value}
    </text>
  );
};

const renderTotalLabel = (props, chartData) => {
  const { x, y, width, height, value, index } = props;
  const item = chartData[index];
  return (
    <text x={x + width + 8} y={y + height / 2} fill="#e2e8f0" fontSize={12} fontWeight="bold" dominantBaseline="middle">
      {value} ({item?.percentage || 0}%)
    </text>
  );
};

const ReportProblemsChart = ({ data }) => {
  const { chartData, uniqueClients } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], uniqueClients: [] };
    
    const clientsSet = new Set();
    
    const formattedData = data.map(item => {
      const formattedItem = {
        name: item.sintoma,
        count: item.count,
        percentage: item.percentage
      };
      
      item.byClient.forEach(c => {
        formattedItem[c.client_name] = c.count;
        clientsSet.add(c.client_name);
      });
      
      return formattedItem;
    });

    return {
      chartData: formattedData,
      uniqueClients: Array.from(clientsSet)
    };
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="dashboard-card h-80 flex items-center justify-center">
        <p className="text-slate-500">Sem dados de problemas</p>
      </div>
    );
  }

  // Calculate dynamic height based on number of items to ensure readability
  const minHeight = 300;
  const calculatedHeight = Math.max(minHeight, chartData.length * 45);

  return (
    <div className="dashboard-card w-full h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6">Gráfico por Sintomas (Por Cliente)</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        <div style={{ height: calculatedHeight, width: '100%', paddingRight: '100px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} hide={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} tick={{ fill: '#e2e8f0' }} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              
              {/* Stacked Bars for Clients */}
              {uniqueClients.map(client => (
                <Bar key={client} dataKey={client} stackId="a" fill={getClientColor(client)} barSize={24}>
                  <LabelList dataKey={client} content={(props) => renderCustomSegmentLabel(props, client)} />
                </Bar>
              ))}

              {/* Invisible Bar for Total Label positioned exactly at the end of the stack */}
              <Bar dataKey="count" fill="transparent" barSize={24} isAnimationActive={false} style={{ pointerEvents: 'none' }}>
                <LabelList dataKey="count" content={(props) => renderTotalLabel(props, chartData)} />
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportProblemsChart;