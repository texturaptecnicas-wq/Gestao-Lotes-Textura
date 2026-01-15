
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Building, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const ScheduleModal = ({ isOpen, onClose, loteId, currentCabine }) => {
  const [isUnscheduling, setIsUnscheduling] = useState(false);
  const [showCabineChange, setShowCabineChange] = useState(false);
  const [selectedCabine, setSelectedCabine] = useState(currentCabine || 1);
  const [ordemPintura, setOrdemPintura] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [availableCabines, setAvailableCabines] = useState([1, 2, 3, 4]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCabines();
    }
  }, [isOpen]);

  const fetchAvailableCabines = async () => {
    const { data, error } = await supabase
      .from('lotes')
      .select('cabine')
      .eq('programado', true)
      .not('cabine', 'is', null);

    if (!error && data) {
      const uniqueCabines = [...new Set(data.map(l => l.cabine))].sort();
      if (uniqueCabines.length > 0) {
        setAvailableCabines([1, 2, 3, 4]);
      }
    }
  };

  const handleUnschedule = async () => {
    setIsUnscheduling(true);
    const { error } = await supabase
      .from('lotes')
      .update({ 
        programado: false, 
        cabine: null, 
        ordem_pintura: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', loteId);

    setIsUnscheduling(false);

    if (error) {
      toast({
        title: "❌ Erro ao desagendar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ Lote desagendado!",
        description: "O lote foi removido da programação."
      });
      onClose();
    }
  };

  const handleChangeCabine = async () => {
    if (!ordemPintura || ordemPintura < 0) {
      toast({
        title: "⚠️ Ordem inválida",
        description: "Informe uma ordem de pintura válida.",
        variant: "destructive"
      });
      return;
    }

    setIsChanging(true);
    const { error } = await supabase
      .from('lotes')
      .update({ 
        cabine: parseInt(selectedCabine),
        ordem_pintura: parseInt(ordemPintura),
        updated_at: new Date().toISOString()
      })
      .eq('id', loteId);

    setIsChanging(false);

    if (error) {
      toast({
        title: "❌ Erro ao mudar cabine",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ Cabine atualizada!",
        description: `Lote movido para Cabine ${selectedCabine} na posição ${ordemPintura}.`
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-effect rounded-2xl p-6 w-full max-w-md relative"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          <h2 className="text-2xl font-bold mb-6 gradient-text">Gerenciar Programação</h2>

          {!showCabineChange ? (
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUnschedule()}
                disabled={isUnscheduling}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                {isUnscheduling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Desagendar Lote
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCabineChange(true)}
                className="w-full bg-sky-500/20 hover:bg-sky-500/30 border-2 border-sky-500/50 text-sky-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <Building className="w-5 h-5" />
                Mudar Cabine
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-300">
                  Selecione a Cabine
                </label>
                <select
                  value={selectedCabine}
                  onChange={(e) => setSelectedCabine(e.target.value)}
                  className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {availableCabines.map(cab => (
                    <option key={cab} value={cab}>Cabine {cab}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-300">
                  Ordem de Pintura
                </label>
                <input
                  type="number"
                  min="0"
                  value={ordemPintura}
                  onChange={(e) => setOrdemPintura(e.target.value)}
                  placeholder="Ex: 1, 2, 3..."
                  className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCabineChange(false)}
                  className="flex-1 glass-effect px-4 py-3 rounded-xl font-semibold hover:bg-slate-700/60"
                >
                  Voltar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChangeCabine}
                  disabled={isChanging}
                  className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2"
                >
                  {isChanging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleModal;
