
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronDown, ChevronRight, GripHorizontal } from 'lucide-react';

export const ComparisonDetailCard = ({ cabin, onClose, onExpand, dragConstraintsRef }) => {
  const [expandedPainters, setExpandedPainters] = useState({});
  const [expandedClients, setExpandedClients] = useState({});

  if (!cabin) return null;

  const togglePainter = (painterName) => {
    setExpandedPainters(prev => ({
      ...prev,
      [painterName]: !prev[painterName]
    }));
  };

  const toggleClient = (painterName, clientName) => {
    const key = `${painterName}-${clientName}`;
    setExpandedClients(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <motion.div
      drag
      dragConstraints={dragConstraintsRef}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl w-[400px] max-h-[75vh] flex flex-col z-[200] absolute"
    >
      {/* Drag Handle & Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/80 bg-slate-800/50 cursor-move rounded-t-xl group shrink-0">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          <h3 className="font-bold text-white tracking-wide uppercase text-sm">
            {cabin.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-bold text-slate-200">
            Total: {cabin.total}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content: Painters -> Clients -> Details */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {cabin.pintoresDetails?.map((painter, pIndex) => {
          const isPainterExpanded = expandedPainters[painter.name];

          return (
            <div key={pIndex} className="bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden">
              {/* Painter Header */}
              <button 
                onClick={() => togglePainter(painter.name)}
                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {isPainterExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: painter.color }} />
                  <span className="text-slate-100 font-bold text-sm truncate" title={painter.name}>
                    {painter.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className="font-bold text-white text-sm">{painter.count}</span>
                  <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                    {painter.percentage}% da cabine
                  </span>
                </div>
              </button>

              {/* Painter Content (Clients) */}
              <AnimatePresence>
                {isPainterExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-2 pb-2 space-y-1.5 bg-slate-900/40 pt-1 border-t border-slate-700/30">
                      {painter.byClient?.map((client, cIndex) => {
                        const clientKey = `${painter.name}-${client.client_name}`;
                        const isClientExpanded = expandedClients[clientKey];

                        return (
                          <div key={cIndex} className="bg-slate-800/60 rounded border border-slate-700/40 overflow-hidden">
                            {/* Client Header */}
                            <button
                              onClick={() => toggleClient(painter.name, client.client_name)}
                              className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-700/50 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                {isClientExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                                <span className="text-slate-300 font-medium text-xs truncate" title={client.client_name}>
                                  {client.client_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-slate-200 text-xs">{client.count}</span>
                                <span className="text-slate-500 text-[10px]">({client.percentage}%)</span>
                              </div>
                            </button>

                            {/* Client Details */}
                            <AnimatePresence>
                              {isClientExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="px-2 pb-2 pt-1 space-y-1.5">
                                    {client.details?.map((detail, dIdx) => (
                                      <div key={dIdx} className="text-[11px] text-slate-300 bg-slate-900/50 p-1.5 rounded border border-slate-700/30 flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <span>📅</span> <span>{detail.formattedDate || 'N/A'}</span>
                                          </div>
                                          <div className="font-bold text-indigo-300 bg-indigo-500/10 px-1 rounded">
                                            {detail.occurrences} {detail.occurrences === 1 ? 'pç' : 'pçs'}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 truncate" title="Cor">
                                          <span>🎨</span> <span>{detail.color}</span>
                                        </div>
                                        <div className="flex items-start gap-1.5 text-amber-200/90 leading-tight">
                                          <span className="shrink-0">⚠️</span> <span>{detail.symptom}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        
        {(!cabin.pintoresDetails || cabin.pintoresDetails.length === 0) && (
          <p className="text-center text-slate-500 text-sm py-4">Sem dados disponíveis.</p>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-3 border-t border-slate-700/80 bg-slate-800/50 rounded-b-xl flex justify-between items-center shrink-0">
        <button 
          onClick={onExpand}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Maximize2 className="w-4 h-4" />
          Ampliar
        </button>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
        >
          Fechar
        </button>
      </div>
    </motion.div>
  );
};
