
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, DollarSign } from 'lucide-react';

const FinanceConfirmationToast = ({ isVisible, onConfirm, onCancel, onDismiss }) => {
  useEffect(() => {
    let timeout;
    if (isVisible) {
      // Auto dismiss after 8 seconds if no action taken
      timeout = setTimeout(() => {
        if (onDismiss) {
          onDismiss();
        } else if (onCancel) {
          onCancel();
        }
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [isVisible, onCancel, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 left-4 z-[100] pointer-events-none flex flex-col items-start gap-2">
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="pointer-events-auto bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-900/20 p-4 max-w-sm w-full backdrop-blur-md"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg shadow-emerald-500/20 shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 mr-2">
                <h4 className="font-bold text-white text-sm mb-1">Registrar no financeiro?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deseja ser redirecionado para registrar o PIX deste lote?
                </p>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    Não
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    Sim
                  </button>
                </div>
              </div>
              
              <button 
                onClick={onDismiss || onCancel}
                className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/30 rounded-full"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FinanceConfirmationToast;
