import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard } from 'lucide-react';
import LoteCard from '@/components/LoteCard';

// Modal que exibe os cards completos dos lotes de um cliente programado,
// dando acesso a todas as funcionalidades do card (ver foto, status,
// editar, entregar, etc.) — reutilizando o LoteCard existente.
const ProgramacaoCardsModal = ({
  isOpen,
  onClose,
  cliente,
  lotes,
  now,
  userRole,
  onUpdateStatus,
  onMarcarEntregue,
  onDelete,
  onEdit,
  onProgramar,
  onOpenFinanceIntegration,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      // Esc fecha apenas este modal quando não há outro diálogo aberto por
      // cima (editar, foto, QR, financeiro…).
      if (e.key !== 'Escape') return;
      const top = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (top && !top.closest('[data-programacao-cards]')) return;
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Renderizado direto no <body> e com z-index abaixo dos demais modais
  // (z-50+) e dos toasts (z-100): assim editar, ver foto, QR, agendar,
  // lançamento financeiro e avisos de "Pago" abrem por cima deste modal,
  // com o mesmo comportamento do card na tela principal.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-programacao-cards
          className="fixed inset-0 z-[45] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700/60 sticky top-0 bg-slate-900 rounded-t-xl z-10">
              <h3 className="font-bold text-lg gradient-text flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-300" />
                {lotes.length > 1 ? `${lotes.length} lotes — ${cliente}` : `Lote — ${cliente}`}
              </h3>
              <button
                onClick={onClose}
                className="p-2 bg-slate-800/50 hover:bg-red-500/20 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-4">
              {lotes.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum lote encontrado para este cliente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
                  {lotes.map((lote) => (
                    <LoteCard
                      key={lote.id}
                      lote={lote}
                      now={now}
                      userRole={userRole}
                      onUpdateStatus={onUpdateStatus}
                      onMarcarEntregue={onMarcarEntregue}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onProgramar={onProgramar}
                      onOpenFinanceIntegration={onOpenFinanceIntegration}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ProgramacaoCardsModal;
