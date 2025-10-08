import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const QRScannerModal = ({ isOpen, onClose, onScan, lotes }) => {
  const [manualInput, setManualInput] = useState('');

  const handleManualScan = () => {
    if (!manualInput.trim()) {
      toast({
        title: "⚠️ Campo vazio",
        description: "Digite o ID do lote para continuar.",
        variant: "destructive",
      });
      return;
    }

    const loteId = manualInput.replace('LOTE:', '').trim();
    const lote = lotes.find(l => l.id === loteId);

    if (!lote) {
      toast({
        title: "❌ Lote não encontrado",
        description: "Verifique o ID e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    if (lote.pintado) {
      toast({
        title: "ℹ️ Lote já pintado",
        description: "Este lote já está marcado como pintado.",
      });
      setManualInput('');
      return;
    }

    onScan(loteId);
    setManualInput('');
    onClose();
  };

  const handleClose = () => {
    setManualInput('');
    onClose();
  };

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
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Escanear QR Code</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="glass-effect border-2 border-dashed border-purple-400/50 rounded-xl p-8 mb-6">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-center text-purple-200">
                  Escaneie o QR Code do lote para marcá-lo como pintado automaticamente
                </p>
              </div>

              <div className="glass-effect rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-200">
                  <strong className="text-white">Modo de demonstração:</strong> Digite o ID do lote manualmente para simular a leitura do QR Code.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-200">
                    ID do Lote
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    placeholder="Ex: 1234567890"
                    className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="flex-1 glass-effect px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManualScan}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
                  >
                    Confirmar
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QRScannerModal;