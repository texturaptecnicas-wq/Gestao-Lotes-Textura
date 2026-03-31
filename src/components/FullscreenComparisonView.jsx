import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';

export const FullscreenComparisonView = ({ cabin, onClose, onBack }) => {
  if (!cabin) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[250] bg-slate-900 flex flex-col"
    >
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{cabin.name}</h2>
          <p className="text-slate-400 mt-1">Detalhamento Completo - Total de Retrabalhos: <span className="text-white font-bold">{cabin.total}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button 
            onClick={onClose} 
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
          {cabin.pintoresDetails?.map((painter, pIdx) => (
            <div key={pIdx} className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
              
              {/* Painter Header */}
              <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: painter.color }} />
                  <h3 className="text-xl font-bold text-white">{painter.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-slate-300">
                    Retrabalhos: <span className="text-xl font-black text-white ml-1">{painter.count}</span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-md text-slate-400 font-medium border border-slate-700">
                    {painter.percentage}% da {cabin.name}
                  </div>
                </div>
              </div>

              {/* Clients Grid */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {painter.byClient?.map((client, cIdx) => (
                  <div key={cIdx} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                      <h4 className="text-slate-200 font-semibold text-base truncate pr-2" title={client.client_name}>
                        {client.client_name}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-lg font-bold text-white">{client.count}</span>
                        <span className="text-xs text-slate-500 font-medium w-[4ch] text-right">({client.percentage}%)</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {client.details?.map((detail, dIdx) => (
                        <div key={dIdx} className="bg-slate-800/60 p-2.5 rounded border border-slate-700/30 flex flex-col gap-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-300">
                              <span>📅</span> <span>{detail.formattedDate || 'N/A'}</span>
                            </div>
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-500/30">
                              {detail.occurrences} {detail.occurrences === 1 ? 'peça' : 'peças'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <span>🎨</span> <span className="truncate">{detail.color}</span>
                          </div>
                          <div className="flex items-start gap-2 text-amber-200/90 bg-amber-500/5 p-1.5 rounded border border-amber-500/10 mt-0.5">
                            <span className="shrink-0 -mt-0.5">⚠️</span> 
                            <span>{detail.symptom}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
          
          {(!cabin.pintoresDetails || cabin.pintoresDetails.length === 0) && (
            <div className="text-center text-slate-500 py-10 text-lg">Nenhum detalhe de pintor disponível.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};