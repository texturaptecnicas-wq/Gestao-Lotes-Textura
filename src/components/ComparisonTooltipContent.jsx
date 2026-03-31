import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const ComparisonTooltipContent = ({ active, payload, label }) => {
  const [expandedClients, setExpandedClients] = useState({});

  // Reset expanded state when the hovered cabin changes
  useEffect(() => {
    setExpandedClients({});
  }, [label]);

  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const byClient = data.byClient || [];

  const toggleClient = (clientName) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientName]: !prev[clientName]
    }));
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl min-w-[320px] max-w-[400px] z-[200] pointer-events-auto">
      <div className="mb-4 pb-3 border-b border-slate-700/80">
        <h3 className="text-white font-bold text-lg tracking-wide uppercase">
          {data.name} <span className="text-slate-400 font-medium ml-1">- Total: {data.total}</span>
        </h3>
      </div>
      
      {/* Pintores Summary (Optional, keeping it brief if users need context) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {byClient.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detalhamento por Cliente</p>
          <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
            {byClient.map((client, index) => {
              const isExpanded = expandedClients[client.client_name];
              
              return (
                <div key={index} className="bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden transition-colors hover:border-slate-600/50">
                  <button 
                    onClick={() => toggleClient(client.client_name)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className="text-slate-200 font-medium text-sm truncate" title={client.client_name}>
                        {client.client_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-2 shrink-0">
                      <span className="font-bold text-white text-sm">{client.count}</span>
                      <span className="text-slate-500 text-xs w-[4ch] text-right">({client.percentage}%)</span>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-3 pb-3 pt-1 space-y-2 bg-slate-900/30">
                          {client.details && client.details.length > 0 ? (
                            client.details.map((detail, dIdx) => (
                              <div key={dIdx} className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700/30 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5" title="Data do Retrabalho">
                                    <span>📅</span> <span className="text-slate-400">{detail.formattedDate || 'N/A'}</span>
                                  </div>
                                  <div className="font-medium text-indigo-300">
                                    {detail.occurrences} {detail.occurrences === 1 ? 'peça' : 'peças'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 truncate" title="Cor">
                                  <span>🎨</span> <span>{detail.color}</span>
                                </div>
                                <div className="flex items-start gap-1.5 text-amber-200/90 line-clamp-2" title="Sintoma/Problema">
                                  <span className="shrink-0 mt-0.5">⚠️</span> <span>{detail.symptom}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-500 italic p-2 text-center">Sem detalhes adicionais</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};