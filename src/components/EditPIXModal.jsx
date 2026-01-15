
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Calendar, User, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const EditPIXModal = ({ isOpen, onClose, pixRecord, onSuccess }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    valor_recebido: '',
    data_registro: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pixRecord) {
      setFormData({
        cliente: pixRecord.cliente,
        valor_recebido: pixRecord.valor_recebido,
        data_registro: pixRecord.data_registro
      });
    }
  }, [pixRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pix_records')
        .update({
          cliente: formData.cliente,
          valor_recebido: parseFloat(formData.valor_recebido),
          data_registro: formData.data_registro,
          updated_at: new Date().toISOString()
        })
        .eq('id', pixRecord.id);

      if (error) throw error;

      toast({
        title: "✅ Registro atualizado!",
        description: "As informações do PIX foram salvas."
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "❌ Erro ao atualizar",
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
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Save className="w-5 h-5 text-indigo-400" />
              </div>
              Editar Registro
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
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Valor Recebido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.valor_recebido}
                onChange={(e) => setFormData({...formData, valor_recebido: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data do Registro
              </label>
              <input
                type="date"
                required
                value={formData.data_registro}
                onChange={(e) => setFormData({...formData, data_registro: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
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

export default EditPIXModal;
