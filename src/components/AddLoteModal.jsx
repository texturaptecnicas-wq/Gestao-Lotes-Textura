import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Calendar, CreditCard, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AddLoteModal = ({ isOpen, onClose, onSave, loteToEdit }) => {
  const getInitialState = () => ({
    cliente: '',
    cor: '',
    quantidade: '',
    foto: null,
    prazoEntrega: '',
    metodoPagamento: '',
    observacao: '',
  });

  const [formData, setFormData] = useState(getInitialState());
  const [fotoPreview, setFotoPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (loteToEdit) {
        setFormData({
          cliente: loteToEdit.cliente || '',
          cor: loteToEdit.cor || '',
          quantidade: loteToEdit.quantidade || '',
          foto: loteToEdit.foto || null,
          prazoEntrega: loteToEdit.prazoEntrega || '',
          metodoPagamento: loteToEdit.metodoPagamento || '',
          observacao: loteToEdit.observacao || '',
        });
        setFotoPreview(loteToEdit.foto || null);
      } else {
        setFormData(getInitialState());
        setFotoPreview(null);
      }
    }
  }, [loteToEdit, isOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "❌ Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto: reader.result });
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cliente || !formData.cor) {
      toast({
        title: "⚠️ Campos obrigatórios",
        description: "Preencha Cliente e Cor.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      ...formData,
      quantidade: parseInt(formData.quantidade) || 0,
    };
    
    onSave(dataToSave, loteToEdit?.id);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };
  
  const isEditing = !!loteToEdit;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold gradient-text">{isEditing ? 'Editar Lote' : 'Novo Lote'}</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-700/60 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">
                    Foto do Papel
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="foto-upload"
                    />
                    <label
                      htmlFor="foto-upload"
                      className="block glass-effect border-2 border-dashed border-slate-600 rounded-xl p-4 cursor-pointer hover:border-sky-500 transition-all group"
                    >
                      {fotoPreview ? (
                        <div className="relative h-64 bg-slate-900/50 rounded-lg flex items-center justify-center">
                          <img
                            src={fotoPreview}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <p className="text-white font-semibold">Clique para alterar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 group-hover:scale-110 group-hover:text-sky-400 transition-all" />
                          <p className="text-lg font-semibold mb-2">Clique para fazer upload</p>
                          <p className="text-sm text-slate-400">PNG, JPG até 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-200">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-200">
                      Cor *
                    </label>
                    <input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="Ex: Azul Marinho"
                      className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-200">
                        Quantidade de Peças
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                        placeholder="Ex: 50"
                        className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-200">
                        Prazo de Entrega
                      </label>
                       <div className="relative">
                        <input
                          type="date"
                          value={formData.prazoEntrega}
                          onChange={(e) => setFormData({ ...formData, prazoEntrega: e.target.value })}
                          className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          style={{ colorScheme: 'dark' }}
                        />
                         <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-200">
                        <CreditCard className="inline w-4 h-4 mr-2" />
                        Método de Pagamento
                      </label>
                      <input
                        type="text"
                        value={formData.metodoPagamento}
                        onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })}
                        placeholder="Ex: PIX, Cartão, Boleto"
                        className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">
                    <MessageSquare className="inline w-4 h-4 mr-2" />
                    Observação
                  </label>
                  <textarea
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    placeholder="Adicione uma observação sobre o lote..."
                    rows="3"
                    className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="flex-1 glass-effect px-6 py-3 rounded-xl font-semibold hover:bg-slate-700/60 transition-all"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Adicionar Lote'}
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