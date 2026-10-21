import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Trash2, Calendar, Tag } from 'lucide-react';

const ClientDetailsModal = ({ isOpen, onClose, clientData, onEdit, onDelete }) => {
  if (!isOpen || !clientData) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

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
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50 shrink-0">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Detalhes - {clientData.clientName}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3">
              {clientData.transactions.map((record) => (
                <div key={record.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors">
                  <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 text-slate-300 min-w-[100px]">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium">{formatDate(record.data_lancamento)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-300 min-w-[120px]">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{record.categoria}</span>
                    </div>

                    <div className={`text-base font-bold ml-auto ${record.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {record.tipo === 'saida' ? '-' : '+'}{formatCurrency(record.valor)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:border-l border-slate-700 sm:pl-4 pt-4 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                    <button 
                      onClick={() => onEdit(record)} 
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-sky-400 transition-colors flex-1 flex justify-center"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(record.id)} 
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors flex-1 flex justify-center"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between shrink-0">
            <span className="text-slate-400 font-medium">Total de Lançamentos: {clientData.transactions.length}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Valor Total do Cliente:</span>
              <span className={`text-2xl font-black ${clientData.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(clientData.total)}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientDetailsModal;