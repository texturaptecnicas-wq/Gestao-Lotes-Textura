
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Calendar, CreditCard, MessageSquare, Loader2, Lock, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AddLoteModal = ({ isOpen, onClose, onSave, loteToEdit, userRole }) => {
  const getInitialState = () => ({
    cliente: '',
    cor: '',
    quantidade: '',
    foto: null,
    prazoEntrega: '',
    metodoPagamento: '',
    observacao: '',
    precisaNotaFiscal: false,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!loteToEdit;
  const isAdmin = userRole === 'administrador';
  const canEditRestrictedFields = !isEditing || isAdmin;

  useEffect(() => {
    if (isOpen) {
      if (loteToEdit) {
        setFormData({
          cliente: loteToEdit.cliente || '',
          cor: loteToEdit.cor || '',
          quantidade: loteToEdit.quantidade || '',
          foto: loteToEdit.foto || null,
          prazoEntrega: loteToEdit.prazo_entrega ? loteToEdit.prazo_entrega.split('T')[0] : '',
          metodoPagamento: loteToEdit.metodo_pagamento || '',
          observacao: loteToEdit.observacao || '',
          precisaNotaFiscal: loteToEdit.precisa_nota_fiscal || false,
        });
        setFotoPreview(loteToEdit.foto ? `${supabase.storage.from('fotos-lotes').getPublicUrl(loteToEdit.foto).data.publicUrl}?t=${new Date().getTime()}` : null);
        setFileToUpload(null);
      } else {
        setFormData(getInitialState());
        setFotoPreview(null);
        setFileToUpload(null);
      }
    }
  }, [loteToEdit, isOpen]);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Compressão de imagem falhou.'));
              }
            },
            'image/jpeg',
            0.7 // 70% quality
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
        toast({ title: "❌ Arquivo muito grande", description: "A imagem deve ter no máximo 10MB.", variant: "destructive" });
        return;
      }
      try {
        const compressedBlob = await compressImage(file);
        setFileToUpload(compressedBlob);
        setFotoPreview(URL.createObjectURL(compressedBlob));
      } catch (error) {
        toast({ title: "❌ Erro ao processar imagem", description: "Não foi possível comprimir a imagem. Tente outra.", variant: "destructive" });
        setFileToUpload(null);
        setFotoPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente || !formData.cor) {
      toast({ title: "⚠️ Campos obrigatórios", description: "Preencha Cliente e Cor.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let imagePath = loteToEdit?.foto || null;

    if (fileToUpload) {
      const fileExtension = fileToUpload.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}_compressed.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('fotos-lotes').upload(fileName, fileToUpload, { cacheControl: '3600', upsert: true });
      if (uploadError) {
        toast({ title: "❌ Erro no upload", description: uploadError.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      imagePath = uploadData.path;
    }
    
    const dataToSave = {
      cliente: formData.cliente,
      cor: formData.cor,
      quantidade: parseInt(formData.quantidade) || 0,
      foto: imagePath,
      prazoEntrega: formData.prazoEntrega || null,
      metodoPagamento: formData.metodoPagamento,
      observacao: formData.observacao,
      precisaNotaFiscal: formData.precisaNotaFiscal,
    };
    
    await onSave(dataToSave, loteToEdit?.id);
    setIsUploading(false);
    handleClose();
  };

  const handleClose = () => onClose();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold gradient-text">{isEditing ? 'Editar Lote' : 'Novo Lote'}</h2>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="p-2 hover:bg-slate-700/60 rounded-lg"><X className="w-6 h-6" /></motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">Foto do Papel</label>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="foto-upload" disabled={isUploading} />
                    <label htmlFor="foto-upload" className="block glass-effect border-2 border-dashed border-slate-600 rounded-xl p-4 cursor-pointer hover:border-sky-500 group">
                      {fotoPreview ? (
                        <div className="relative h-64 bg-slate-900/50 rounded-lg flex items-center justify-center">
                          <img src={fotoPreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center"><p className="text-white font-semibold">Clique para alterar</p></div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 group-hover:scale-110 group-hover:text-sky-400" />
                          <p className="text-lg font-semibold mb-2">Clique para fazer upload</p>
                          <p className="text-sm text-slate-400">PNG, JPG (até 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-200">Nome do Cliente *</label>
                    <input type="text" value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} placeholder="Ex: João Silva" className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={isUploading} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-200">Cor *</label>
                    <input type="text" value={formData.cor} onChange={(e) => setFormData({ ...formData, cor: e.target.value })} placeholder="Ex: Azul Marinho" className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={isUploading} />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 glass-effect rounded-xl">
                    <Checkbox id="precisa-nf" checked={formData.precisaNotaFiscal} onCheckedChange={(checked) => setFormData({ ...formData, precisaNotaFiscal: checked })} disabled={isUploading || !canEditRestrictedFields} />
                    <Label htmlFor="precisa-nf" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-300" />
                        Precisa de Nota Fiscal?
                    </Label>
                    {!canEditRestrictedFields && <Lock className="w-4 h-4 text-slate-300" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-200">Quantidade de Peças</label>
                      <input type="number" min="0" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} placeholder="Ex: 50" className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={isUploading} />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold mb-2 text-slate-200">Prazo de Entrega</label>
                       <div className="relative">
                        <input type="date" value={formData.prazoEntrega} onChange={(e) => setFormData({ ...formData, prazoEntrega: e.target.value })} className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" style={{ colorScheme: 'dark' }} disabled={isUploading || !canEditRestrictedFields} />
                         <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                      {!canEditRestrictedFields && <Lock className="absolute top-1 right-1 w-4 h-4 text-slate-300" />}
                    </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-slate-200"><CreditCard className="inline w-4 h-4 mr-2" />Método de Pagamento</label>
                  <input type="text" value={formData.metodoPagamento} onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })} placeholder="Ex: PIX, Cartão, Boleto" className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={isUploading || !canEditRestrictedFields} />
                  {!canEditRestrictedFields && <Lock className="absolute top-1 right-1 w-4 h-4 text-slate-300" />}
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-slate-200"><MessageSquare className="inline w-4 h-4 mr-2" />Observação</label>
                  <textarea value={formData.observacao} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} placeholder="Adicione uma observação sobre o lote..." rows="3" className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={isUploading || !canEditRestrictedFields} />
                  {!canEditRestrictedFields && <Lock className="absolute top-1 right-1 w-4 h-4 text-slate-300" />}
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleClose} className="flex-1 glass-effect px-6 py-3 rounded-xl font-semibold hover:bg-slate-700/60" disabled={isUploading}>Cancelar</motion.button>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2" disabled={isUploading}>
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isUploading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Lote'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddLoteModal;
