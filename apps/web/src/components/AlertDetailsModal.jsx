import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Palette, User, Image as ImageIcon } from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';

const AlertDetailsModal = ({ isOpen, onClose, alert }) => {
  const [showZoomImage, setShowZoomImage] = useState(false);

  if (!isOpen || !alert) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Detalhes do Alerta
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Cliente
                  </span>
                  <p className="text-sm font-semibold text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    {alert.client_name || 'Alerta Global (Sem Cliente)'}
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Cor
                  </span>
                  <p className="text-sm font-semibold text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    {alert.cor || 'Qualquer cor'}
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Descrição Completa
                </span>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar">
                  {alert.description || 'Sem descrição fornecida.'}
                </div>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Evidência Visual
                </span>
                {alert.image_url ? (
                  <div 
                    className="mt-1 border border-slate-700 rounded-xl overflow-hidden bg-slate-950 flex justify-center cursor-pointer group relative"
                    onClick={() => setShowZoomImage(true)}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-opacity pointer-events-none">
                        Clique para Ampliar
                      </span>
                    </div>
                    <img 
                      src={alert.image_url} 
                      alt="Evidência Visual" 
                      className="max-w-full h-auto max-h-[250px] object-contain bg-black/50 transition-transform duration-300 group-hover:scale-105" 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/600x400/1e293b/a8a29e?text=Imagem+Indisponível' 
                      }} 
                    />
                  </div>
                ) : (
                  <div className="mt-1 border border-slate-800 border-dashed rounded-xl p-6 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500">
                     <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                     <span className="text-sm font-medium">Nenhuma imagem disponível</span>
                  </div>
                )}
              </div>
              
              {alert.created_at && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500">
                    Criado em: {new Date(alert.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end shrink-0">
               <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  Fechar
                </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showZoomImage && alert?.image_url && (
        <ImageZoomModal 
          imageUrl={alert.image_url} 
          onClose={() => setShowZoomImage(false)} 
        />
      )}
    </>
  );
};

export default AlertDetailsModal;