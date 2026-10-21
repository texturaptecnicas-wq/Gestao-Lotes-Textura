import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createDailyLogEntry, updateDailyLogEntry } from '@/services/qualityService';

const EditDailyLogModal = ({ isOpen, onClose, logData, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    cabine: 1,
    client_name: '',
    cor: '',
    pintor: '',
    problema: '',
    quantidade: 1,
    tamanho_peca: 'media',
    observacoes: '',
    isZeroRework: false
  });

  useEffect(() => {
    if (isOpen && logData) {
      const isZero = logData.isZeroRework || logData.quantidade === 0 || logData.client_name === 'SEM RETRABALHO';
      setFormData({
        date: logData.date || '',
        cabine: logData.cabine || 1,
        client_name: isZero ? 'SEM RETRABALHO' : (logData.client_name || logData.cliente || ''),
        cor: logData.cor || '',
        pintor: logData.pintor || '',
        problema: isZero ? 'Nenhum' : (logData.problema || logData.sintoma || ''),
        quantidade: isZero ? 0 : (logData.quantidade || 1),
        tamanho_peca: logData.tamanho_peca || 'media',
        observacoes: logData.observacoes || '',
        isZeroRework: isZero
      });
    }
  }, [isOpen, logData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleZeroReworkToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      isZeroRework: checked,
      client_name: checked ? 'SEM RETRABALHO' : '',
      quantidade: checked ? 0 : 1,
      problema: checked ? 'Nenhum' : '',
      cabine: checked ? '' : prev.cabine,
      cor: checked ? '' : prev.cor,
      pintor: checked ? '' : prev.pintor,
      tamanho_peca: checked ? '' : prev.tamanho_peca
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.isZeroRework) {
        payload.client_name = 'SEM RETRABALHO';
        payload.quantidade = 0;
        payload.problema = 'Nenhum';
        payload.cabine = null;
        payload.cor = null;
        payload.pintor = null;
        payload.tamanho_peca = null;
      }
      
      let saved;
      if (logData.isNew) {
        saved = await createDailyLogEntry(payload);
        toast({ title: 'Sucesso', description: payload.isZeroRework ? 'Dia sem retrabalho registrado.' : 'Registro salvo com sucesso.' });
      } else {
        saved = await updateDailyLogEntry(logData.id, payload);
        toast({ title: 'Sucesso', description: 'Registro atualizado.' });
      }
      onSaved(saved, logData.isNew);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao salvar. Verifique se preencheu todos os campos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {logData?.isNew ? 'Novo Registro' : 'Editar Registro'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="editDailyLogForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-5">
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-emerald-500/20">
            <input 
              type="checkbox" 
              id="zeroRework"
              className="w-5 h-5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              checked={formData.isZeroRework}
              onChange={(e) => handleZeroReworkToggle(e.target.checked)}
            />
            <label htmlFor="zeroRework" className="text-emerald-400 font-bold text-base cursor-pointer flex-1 select-none flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Nenhum retrabalho hoje (Dia Limpo)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Data *</label>
              <input type="date" name="date" required value={formData.date} onChange={handleChange} style={{ colorScheme: 'dark' }} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
            </div>

            {!formData.isZeroRework && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300">Quantidade de Peças *</label>
                <input type="number" min="1" name="quantidade" required value={formData.quantidade} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
              </div>
            )}
          </div>

          {!formData.isZeroRework && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Cliente *</label>
                  <input type="text" name="client_name" required={!formData.isZeroRework} value={formData.client_name} onChange={handleChange} placeholder="Nome do cliente" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Cor</label>
                  <input type="text" name="cor" value={formData.cor} onChange={handleChange} placeholder="Ex: Preto Ninja" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Problema / Sintoma *</label>
                  <input type="text" name="problema" required={!formData.isZeroRework} value={formData.problema} onChange={handleChange} placeholder="Ex: Fervura, Contaminação" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Tamanho da Peça</label>
                  <select name="tamanho_peca" value={formData.tamanho_peca} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all">
                    <option value="">Selecione...</option>
                    <option value="muito_pequena">Muito Pequena (Peso 0.5x)</option>
                    <option value="pequena">Pequena (Peso 1.0x)</option>
                    <option value="media">Média (Peso 1.5x)</option>
                    <option value="grande">Grande (Peso 2.0x)</option>
                    <option value="muito_grande">Muito Grande (Peso 3.0x)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Pintor</label>
                  <input type="text" name="pintor" value={formData.pintor} onChange={handleChange} placeholder="Nome do pintor" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Cabine</label>
                  <input type="number" min="1" name="cabine" value={formData.cabine} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Observações {formData.isZeroRework ? '(Opcional)' : ''}</label>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" placeholder="Detalhes adicionais..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all resize-none"></textarea>
          </div>

        </form>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium">
            Cancelar
          </button>
          <button type="submit" form="editDailyLogForm" disabled={loading} className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-sky-500/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDailyLogModal;