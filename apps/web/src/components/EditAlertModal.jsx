import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { updateQualityAlert } from '@/services/qualityService';

const EditAlertModal = ({ isOpen, onClose, alert, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    description: '',
    cor: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && alert) {
      setFormData({
        client_name: alert.client_name || '',
        description: alert.description || '',
        cor: alert.cor || ''
      });
    }
  }, [isOpen, alert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name.trim()) {
      toast({ title: "Aviso", description: "O nome do cliente é obrigatório.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateQualityAlert(alert.id, formData);
      toast({ title: "✅ Alerta Atualizado", description: "As informações foram salvas com sucesso." });
      onUpdateSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o alerta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Editar Alerta
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente *</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cor Específica (Opcional)</label>
              <input
                type="text"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                placeholder="Ex: Branco, Preto (Deixe em branco para todas as cores)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">Se não informado, aplica-se a todas as cores do cliente.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm min-h-[100px]"
              />
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Salvar
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditAlertModal;