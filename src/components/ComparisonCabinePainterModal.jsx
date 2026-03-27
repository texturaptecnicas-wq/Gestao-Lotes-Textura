
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getComparisonCabinePainter } from '@/utils/comparisonCabinePainter';
import { ComparisonDetailCard } from './ComparisonDetailCard';
import { FullscreenComparisonView } from './FullscreenComparisonView';

const SimpleTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-white backdrop-blur-sm pointer-events-none z-[160]">
        <p className="font-bold text-sm text-indigo-300">{data.name}</p>
        <p className="text-slate-200 text-sm mt-1">Total de Retrabalhos: <span className="font-bold text-white">{data.total}</span></p>
      </div>
    );
  }
  return null;
};

const ComparisonCabinePainterModal = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const [data, setData] = useState({ chartData: [], pintores: [] });
  const [loading, setLoading] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragConstraintsRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !currentFilters?.startDate || !currentFilters?.endDate) return;

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getComparisonCabinePainter(currentFilters);
        if (isMounted) setData(result);
      } catch (err) {
        console.error("Failed to load comparison data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();

    // Reset states when modal opens/closes
    setSelectedCabin(null);
    setIsFullscreen(false);

    return () => { isMounted = false; };
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setSelectedCabin(state.activePayload[0].payload);
      setIsFullscreen(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCabin(null);
    setIsFullscreen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" ref={dragConstraintsRef}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
        >
          {/* Main Modal Header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              COMPARAÇÃO: CABINES E PINTORES
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Modal Content - Chart Only */}
          <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-indigo-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-slate-300 font-medium animate-pulse">Processando comparativos cruzados...</p>
              </div>
            ) : data.chartData.length > 0 ? (
              <div className="w-full h-full bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Volume por Cabine e Composição de Pintores
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-3 py-1 rounded-full">
                    Clique em uma barra para ver detalhes
                  </p>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.chartData} 
                      layout="vertical" 
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      onClick={handleChartClick}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#e2e8f0" 
                        fontSize={13} 
                        fontWeight={500}
                        width={120} 
                      />
                      <Tooltip 
                        content={<SimpleTooltip />} 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                        isAnimationActive={false}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      
                      {data.pintores.map((p) => (
                         <Bar 
                           key={p.name} 
                           dataKey={p.name} 
                           stackId="a" 
                           fill={p.color} 
                           radius={[0, 0, 0, 0]}
                           cursor="pointer"
                         />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/30 border-dashed">
                <p>Nenhum dado encontrado para gerar a comparação.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end shrink-0">
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium">
              Fechar Comparação
            </button>
          </div>

          {/* Fullscreen Overlay */}
          <AnimatePresence>
            {selectedCabin && isFullscreen && (
              <FullscreenComparisonView 
                cabin={selectedCabin} 
                onClose={handleCloseDetail}
                onBack={() => setIsFullscreen(false)}
              />
            )}
          </AnimatePresence>

        </motion.div>

        {/* Floating Fixed Card (Draggable) */}
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <AnimatePresence>
            {selectedCabin && !isFullscreen && (
              <ComparisonDetailCard 
                cabin={selectedCabin} 
                onClose={handleCloseDetail} 
                onExpand={() => setIsFullscreen(true)}
                dragConstraintsRef={dragConstraintsRef}
              />
            )}
          </AnimatePresence>
        </div>

      </div>
    </AnimatePresence>
  );
};

export default ComparisonCabinePainterModal;
