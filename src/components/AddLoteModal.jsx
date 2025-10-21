
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Camera, UploadCloud } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AddLoteModal = ({ isOpen, onClose, onSave, loteToEdit }) => {
  const initialState = {
    cliente: '',
    cor: '',
    quantidade: '',
    prazoEntrega: '',
    metodoPagamento: '',
    observacao: '',
    foto: ''
  };

  const [loteData, setLoteData] = useState(initialState);
  const [imagePreview, setImagePreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (loteToEdit) {
      setLoteData({
        cliente: loteToEdit.cliente || '',
        cor: loteToEdit.cor || '',
        quantidade: loteToEdit.quantidade || '',
        prazoEntrega: loteToEdit.prazoEntrega ? new Date(loteToEdit.prazoEntrega).toISOString().split('T')[0] : '',
        metodoPagamento: loteToEdit.metodoPagamento || '',
        observacao: loteToEdit.observacao || '',
        foto: loteToEdit.foto || ''
      });
      setImagePreview(loteToEdit.foto || '');
    } else {
      setLoteData(initialState);
      setImagePreview('');
    }
  }, [loteToEdit, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoteData({ ...loteData, [name]: value });
  };
  
  const handleImageUpload = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
              title: "❌ Arquivo muito grande!",
              description: "Por favor, selecione uma imagem com menos de 5MB.",
              variant: "destructive",
          });
          return;
      }
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get the data-URL with quality of 80%
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setLoteData(prev => ({ ...prev, foto: dataUrl }));
          setImagePreview(dataUrl);
          setIsProcessing(false);
          toast({
              title: "✅ Imagem carregada!",
              description: "A imagem foi otimizada e está pronta.",
          });
        };
        img.onerror = () => {
            setIsProcessing(false);
            toast({
                title: "❌ Erro na imagem",
                description: "Não foi possível processar o arquivo de imagem.",
                variant: "destructive",
            });
        };
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loteData.cliente || !loteData.cor) {
      toast({
        title: '⚠️ Campos obrigatórios',
        description: 'Cliente e Cor são necessários.',
        variant: 'destructive',
      });
      return;
    }
    const dataToSave = {
      ...loteData,
      prazoEntrega: loteData.prazoEntrega ? new Date(loteData.prazoEntrega).toISOString() : '',
    };
    onSave(dataToSave, loteToEdit ? loteToEdit.id : null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">{loteToEdit ? 'Editar Lote' : 'Adicionar Novo Lote'}</h2>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full"><X /></motion.button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="cliente" value={loteData.cliente} onChange={handleInputChange} placeholder="Nome do Cliente" required className="w-full glass-effect-input" />
                <input type="text" name="cor" value={loteData.cor} onChange={handleInputChange} placeholder="Cor" required className="w-full glass-effect-input" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" name="quantidade" value={loteData.quantidade} onChange={handleInputChange} placeholder="Quantidade de Peças" className="w-full glass-effect-input" />
                 <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Prazo:</span>
                  <input type="date" name="prazoEntrega" value={loteData.prazoEntrega} onChange={handleInputChange} className="w-full glass-effect-input pl-14" />
                </div>
              </div>
              
              <select name="metodoPagamento" value={loteData.metodoPagamento} onChange={handleInputChange} className="w-full glass-effect-input">
                <option value="">Método de Pagamento (Opcional)</option>
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>

              <textarea name="observacao" value={loteData.observacao} onChange={handleInputChange} placeholder="Observações (opcional)" rows="2" className="w-full glass-effect-input"></textarea>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="mt-2 relative group">
                    <img class="w-full h-48 object-cover rounded-lg" alt="Preview do lote" src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => { setImagePreview(''); setLoteData({ ...loteData, foto: '' }); }} className="p-2 bg-red-500/80 rounded-full text-white"><Trash2 /></motion.button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current.click()} disabled={isProcessing} className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-700/50 hover:border-sky-500 transition-all disabled:opacity-50 disabled:cursor-wait">
                    {isProcessing ? (
                        <>
                            <UploadCloud className="w-8 h-8 animate-pulse" />
                            <span className="mt-2 text-sm font-semibold">Otimizando imagem...</span>
                        </>
                    ) : (
                        <>
                            <Camera className="w-8 h-8" />
                            <span className="mt-2 text-sm font-semibold">Adicionar Foto</span>
                        </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Plus /> {loteToEdit ? 'Salvar Alterações' : 'Criar Lote'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddLoteModal;
