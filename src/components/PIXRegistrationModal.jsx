
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Loader2, Package, User, Calendar, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const PIXRegistrationModal = ({ isOpen, onClose, lote, onSuccess }) => {
  const [formData, setFormData] = useState({
    valor_recebido: '',
    cliente: '',
    lote_id: '',
    data_registro: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update state when lote prop changes
  useEffect(() => {
    if (lote) {
      setFormData(prev => ({
        ...prev,
        cliente: lote.cliente || '',
        lote_id: lote.id || '',
        valor_recebido: '', // Reset value
        data_registro: new Date().toISOString().split('T')[0]
      }));
    } else {
        // Reset if no lote
        setFormData({
            valor_recebido: '',
            cliente: '',
            lote_id: '',
            data_registro: new Date().toISOString().split('T')[0]
        });
    }
  }, [lote, isOpen]);

  const handleSubmit = async () => {
    if (!formData.valor_recebido || parseFloat(formData.valor_recebido) <= 0) {
      toast({ title: "⚠️ Valor inválido", description: "Informe um valor positivo.", variant: "destructive" });
      return;
    }
    if (!formData.cliente) {
      toast({ title: "⚠️ Cliente obrigatório", description: "Informe o nome do cliente.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        cliente: formData.cliente,
        valor_recebido: parseFloat(formData.valor_recebido),
        data_registro: formData.data_registro,
        lote_id: formData.lote_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('pix_records').insert(payload);

      if (error) throw error;

      toast({
        title: "✅ PIX registrado!",
        description: `Pagamento de R$ ${parseFloat(formData.valor_recebido).toFixed(2)} registrado com sucesso.`
      });
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      toast({
        title: "❌ Erro ao registrar",
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
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-effect rounded-2xl p-6 shadow-2xl border border-emerald-500/30 bg-[#0F172A]"
        >
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-bold gradient-text flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              Confirmar Recebimento
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Context Info */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm text-slate-400 mb-2">
               Você está registrando um pagamento para o lote de <strong>{lote?.cliente}</strong>.
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente (Editável)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Nome do Cliente"
                />
                <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Valor Recebido (R$)
              </label>
              <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_recebido}
                    onChange={(e) => setFormData({...formData, valor_recebido: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xl font-bold text-emerald-400 placeholder-slate-600"
                    placeholder="0.00"
                    autoFocus
                  />
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data do Registro
              </label>
              <input
                type="date"
                value={formData.data_registro}
                onChange={(e) => setFormData({...formData, data_registro: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 rounded-xl font-semibold text-white hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                    <>
                        <DollarSign className="w-5 h-5" />
                        Confirmar
                    </>
                    )}
                </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PIXRegistrationModal;
