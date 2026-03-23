import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FinanceModal = ({ isOpen, onClose, onSave, recordToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    tipo: 'entrada',
    valor: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    categoria: 'PIX',
    status: 'confirmado',
    observacoes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (recordToEdit) {
        setFormData({
          ...recordToEdit,
          data_lancamento: recordToEdit.data_lancamento
        });
      } else {
        setFormData({
          descricao: '',
          tipo: 'entrada',
          valor: '',
          data_lancamento: new Date().toISOString().split('T')[0],
          categoria: 'Outros',
          status: 'confirmado',
          observacoes: ''
        });
      }
    }
  }, [isOpen, recordToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, recordToEdit?.id);
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              {recordToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${formData.tipo === 'entrada' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <input type="radio" name="tipo" value="entrada" checked={formData.tipo === 'entrada'} onChange={() => setFormData({...formData, tipo: 'entrada'})} className="hidden" />
                Entrada
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${formData.tipo === 'saida' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <input type="radio" name="tipo" value="saida" checked={formData.tipo === 'saida'} onChange={() => setFormData({...formData, tipo: 'saida'})} className="hidden" />
                Saída
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição *</label>
              <input type="text" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" required min="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Data *</label>
                <input type="date" required value={formData.data_lancamento} onChange={e => setFormData({...formData, data_lancamento: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria *</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500">
                  <option value="PIX">PIX</option>
                  <option value="Pagamento">Pagamento</option>
                  <option value="Despesa">Despesa Operacional</option>
                  <option value="Salário">Salário</option>
                  <option value="Imposto">Imposto</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status *</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500">
                  <option value="confirmado">Confirmado</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FinanceModal;