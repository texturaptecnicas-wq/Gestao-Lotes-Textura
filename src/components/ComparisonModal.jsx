
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-white font-bold mb-1">{data.name}</p>
        <p className="text-slate-300 text-sm">Retrabalhos: <span className="font-bold">{data.count}</span></p>
        <p className="text-slate-300 text-sm">Porcentagem: <span className="font-bold">{data.percentage}%</span></p>
      </div>
    );
  }
  return null;
};

const ComparisonModal = ({ isOpen, onClose, type, data, loading, onSelect }) => {
  if (!isOpen) return null;

  const title = type === 'cabine' ? 'Ranking de Cabines' : 'Ranking de Pintores';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              {title}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 flex flex-col gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-sky-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Processando dados de comparação...</p>
              </div>
            ) : data && data.length > 0 ? (
              <>
                <div className="h-80 w-full bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} cursor="pointer" onClick={(entry) => onSelect && onSelect(entry)}>
                         {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-[400px]">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-300 text-sm border-b border-slate-700/50">
                        <th className="p-3 font-semibold w-16 text-center">Pos</th>
                        <th className="p-3 font-semibold">{type === 'cabine' ? 'Cabine' : 'Pintor'}</th>
                        <th className="p-3 font-semibold text-right">Retrabalhos</th>
                        <th className="p-3 font-semibold text-right">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr 
                          key={item.name} 
                          onClick={() => onSelect && onSelect(item)}
                          className="border-b border-slate-800/30 text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                          title={`Filtrar por ${item.name}`}
                        >
                          <td className="p-3 text-center text-slate-400 font-medium">{index + 1}º</td>
                          <td className="p-3 font-medium flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            <span className="group-hover:text-sky-400 transition-colors">{item.name}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-white">{item.count}</td>
                          <td className="p-3 text-right">
                            <span className="inline-block px-2 py-1 bg-slate-800 rounded-md text-xs font-medium border border-slate-700">
                              {item.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/30 border-dashed">
                <p>Nenhum dado encontrado para os filtros atuais.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end shrink-0">
            <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium">
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default ComparisonModal;
