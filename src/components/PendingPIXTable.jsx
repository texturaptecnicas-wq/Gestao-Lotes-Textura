import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, DollarSign, CalendarClock, User, Box } from 'lucide-react';

const PendingPIXTable = ({ lotes, onPay }) => {
  // Filter for pending lotes (pago status is 'pending' which is the Red state)
  const pendingLotes = lotes.filter(l => l.pago === 'pending');

  const formatDate = (dateString) => {
    if (!dateString) return 'Data N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (pendingLotes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed"
      >
        <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
          <DollarSign className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Tudo em dia!</h3>
        <p className="text-slate-400 max-w-sm">
          Nenhum pagamento pendente encontrado nos lotes atuais.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-white">
          Pagamentos Pendentes ({pendingLotes.length})
        </h3>
      </div>

      <div className="grid gap-3">
        {pendingLotes.map((lote) => (
          <motion.div
            key={lote.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/30 p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-white text-lg">{lote.cliente}</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20 font-medium">
                  Pendente
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" />
                  <span>{lote.quantidade ? `${lote.quantidade} un.` : 'Qtd N/A'} • {lote.cor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Criado em: {formatDate(lote.data_criacao)}</span>
                </div>
              </div>
              
              {lote.prazo_entrega && (
                <div className="text-xs text-red-400 font-medium flex items-center gap-1">
                  ! Prazo: {formatDate(lote.prazo_entrega)}
                </div>
              )}
            </div>

            <button
              onClick={() => onPay(lote)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto min-w-[140px]"
            >
              <DollarSign className="w-4 h-4" />
              <span>Receber</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PendingPIXTable;