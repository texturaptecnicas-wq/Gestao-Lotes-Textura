
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { transformLogToAlert } from '@/services/qualityService';
import { toast } from '@/components/ui/use-toast';

const ConvertToAlertModal = ({ isOpen, onClose, logData }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !logData) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await transformLogToAlert(logData.id);
      toast({ title: "🚨 Alerta Criado", description: "Registro convertido em alerta de qualidade permanentemente." });
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: error.message || "Falha ao criar o alerta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Criar Alerta de Qualidade?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Este registro do cliente <strong className="text-white">{logData.client_name || 'Desconhecido'}</strong> será convertido em um alerta permanente no sistema, visível na aba de Alertas.
            </p>

            <div className="flex w-full gap-3">
              <button 
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConvertToAlertModal;
