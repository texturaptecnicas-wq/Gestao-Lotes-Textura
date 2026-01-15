
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Calendar, User, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AddPendingPIXModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    valor_pendente: '',
    prazo_pagamento: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('pix_pendentes').insert({
        cliente: formData.cliente,
        valor_pendente: parseFloat(formData.valor_pendente),
        prazo_pagamento: formData.prazo_pagamento || null,
        data_criacao: new Date().toISOString(),
        status: 'pendente'
      });

      if (error) throw error;

      toast({
        title: "✅ Sucesso!",
        description: "PIX pendente registrado."
      });
      
      setFormData({ cliente: '', valor_pendente: '', prazo_pagamento: '' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-effect rounded-2xl p-6 shadow-2xl border border-slate-700 bg-[#0F172A]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              Novo PIX Pendente
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente
              </label>
              <input
                type="text"
                required
                value={formData.cliente}
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Valor Pendente (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.valor_pendente}
                onChange={(e) => setFormData({...formData, valor_pendente: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Prazo de Pagamento
              </label>
              <input
                type="date"
                value={formData.prazo_pagamento}
                onChange={(e) => setFormData({...formData, prazo_pagamento: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Pendência
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddPendingPIXModal;
