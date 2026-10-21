import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Palette, X } from 'lucide-react';
import { createQualityAlert } from '@/services/qualityService';
import { toast } from '@/components/ui/use-toast';

const ConvertToAlertModal = ({ isOpen, onClose, logData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    cor: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen && logData) {
      setFormData({
        client_name: logData.client_name || logData.cliente || '',
        cor: '',
        description: `Problema: ${logData.problema || 'N/A'}\nConclusão: ${logData.analysis_conclusion || 'Sem conclusão'}`
      });
    }
  }, [isOpen, logData]);

  if (!isOpen || !logData) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!formData.client_name.trim()) {
      toast({ title: "Aviso", description: "O nome do cliente é obrigatório.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      await createQualityAlert({
        client_name: formData.client_name,
        cor: formData.cor,
        description: formData.description,
        image_url: logData.image_url,
        created_by: logData.pintor || 'Sistema'
      });
      
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
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Converter em Alerta
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleConfirm} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cliente *</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                Cor Específica (Opcional)
              </label>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Alerta'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConvertToAlertModal;