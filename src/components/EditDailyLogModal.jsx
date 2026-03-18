
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, Calendar } from 'lucide-react';
import { updateDailyLogEntry, createDailyLogEntry } from '@/services/qualityService';
import { toast } from '@/components/ui/use-toast';
import PieceSizeSelector from './PieceSizeSelector';

const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const EditDailyLogModal = ({ isOpen, onClose, logData, onSaved }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const today = getLocalToday();

  useEffect(() => {
    if (logData) {
      setFormData({
        isNew: logData.isNew || false,
        date: logData.date || today,
        client_name: logData.client_name || '',
        cor: logData.cor || '',
        pintor: logData.pintor || '',
        quantidade: logData.quantidade || '',
        problema: logData.problema || '',
        analysis_conclusion: logData.analysis_conclusion || '',
        cabine: logData.cabine || 1,
        tamanho_peca: logData.tamanho_peca || null
      });
    }
  }, [logData, today]);

  if (!isOpen || !logData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (sizeValue) => {
    setFormData(prev => ({ ...prev, tamanho_peca: sizeValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate future dates
    if (formData.date > today) {
      toast({ 
        title: "Data Inválida", 
        description: "Não é permitido usar datas futuras para registros diários.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      let savedLog;
      if (formData.isNew) {
        const { isNew, ...submitData } = formData;
        savedLog = await createDailyLogEntry(submitData);
        toast({ title: "Sucesso", description: "Registro criado com sucesso." });
      } else {
        const { isNew, ...submitData } = formData;
        savedLog = await updateDailyLogEntry(logData.id, submitData);
        toast({ title: "Sucesso", description: "Registro atualizado com sucesso." });
      }
      onSaved(savedLog, formData.isNew);
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar o registro.", variant: "destructive" });
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
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50 shrink-0">
            <h3 className="text-lg font-bold text-white">
              {formData.isNew ? 'Novo Registro Diário' : 'Editar Registro'}
            </h3>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            
            {/* Dynamic Date Selection prominent in the form */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${formData.date > today ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" /> Data do Retrabalho
                </label>
                <input 
                  type="date" 
                  name="date" 
                  max={today}
                  style={{ colorScheme: 'dark' }}
                  value={formData.date || today} 
                  onChange={handleChange} 
                  className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-sky-400 font-bold focus:ring-2 focus:ring-sky-500" 
                />
              </div>
              {formData.date > today && (
                <span className="text-xs text-red-400 font-bold max-w-[120px] text-right leading-tight">
                  Data futura não permitida
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cliente</label>
                <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cabine</label>
                <select name="cabine" value={formData.cabine} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500">
                  {[1,2,3,4].map(c => <option key={c} value={c}>Cabine {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
                <input type="text" name="cor" value={formData.cor} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pintor</label>
                <input type="text" name="pintor" value={formData.pintor} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Quantidade</label>
                <input type="number" name="quantidade" min="1" value={formData.quantidade} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500" />
              </div>
            </div>

            <PieceSizeSelector 
              selectedSize={formData.tamanho_peca} 
              onSizeChange={handleSizeChange} 
            />

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Problema / Sintoma</label>
              <input type="text" name="problema" value={formData.problema} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Conclusão / Ação</label>
              <textarea name="analysis_conclusion" value={formData.analysis_conclusion} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 min-h-[80px] resize-y" />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancelar</button>
              <button 
                type="submit" 
                disabled={loading || formData.date > today} 
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {formData.isNew ? 'Salvar Novo Registro' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditDailyLogModal;
