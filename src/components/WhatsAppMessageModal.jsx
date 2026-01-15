
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const WhatsAppMessageModal = ({ isOpen, onClose, onSave }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('whatsapp_message_default');
      setMessage(saved || 'Olá! Suas peças estão prontas para retirada. PIX: 95443354000117');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('whatsapp_message_default', message);
    onSave(message);
    toast({
      title: "✅ Mensagem salva!",
      description: "A mensagem padrão foi atualizada."
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-effect rounded-2xl p-6 w-full max-w-md relative"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          <h2 className="text-2xl font-bold mb-6 gradient-text flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Editar Mensagem WhatsApp
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Mensagem Padrão
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Digite a mensagem padrão..."
                className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white resize-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salvar Mensagem
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhatsAppMessageModal;
