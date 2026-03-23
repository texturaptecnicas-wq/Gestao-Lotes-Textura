import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Palette } from 'lucide-react';

const AlertDetailsModal = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;

  return (
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
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
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

          <div className="p-6 space-y-4">
            <div>
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Cliente
              </span>
              <p className="text-base font-semibold text-slate-200">
                {alert.client_name}
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Cor
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-slate-800 border border-slate-700 text-slate-300">
                <Palette className="w-4 h-4" />
                {alert.cor ? alert.cor : 'Qualquer cor'}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Descrição Completa
              </span>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                {alert.description || 'Sem descrição fornecida.'}
              </div>
            </div>
            
            {alert.created_at && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  Criado em: {new Date(alert.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
             <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Fechar
              </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertDetailsModal;