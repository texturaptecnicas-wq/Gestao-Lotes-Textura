import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar, Package, Eye, Trash2 } from 'lucide-react';

const HistoricoModal = ({ isOpen, onClose, historico, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLote, setSelectedLote] = useState(null);

  const filteredHistorico = historico.filter(lote =>
    lote.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lote.cor.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const lotesAgrupados = useMemo(() => {
    return filteredHistorico.reduce((acc, lote) => {
      const date = new Date(lote.data_entrega);
      const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

      if (!acc[capitalizedMonth]) {
        acc[capitalizedMonth] = [];
      }
      acc[capitalizedMonth].push(lote);
      return acc;
    }, {});
  }, [filteredHistorico]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAdmin = userRole === 'administrador';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold gradient-text">Lotes Entregues</h2>
                  <p className="text-slate-300 mt-1">{historico.length} lotes no total</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700/60 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar em entregues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-effect pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {Object.keys(lotesAgrupados).length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                    <h3 className="text-xl font-bold mb-2">Nenhum lote encontrado</h3>
                    <p className="text-slate-400">
                      {searchTerm ? 'Tente ajustar sua busca' : 'Ainda não há lotes entregues'}
                    </p>
                  </div>
                ) : (
                  Object.entries(lotesAgrupados).map(([monthYear, lotesDoMes], idx) => (
                    <motion.div key={monthYear} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: idx * 0.1}}>
                      <h3 className="text-xl font-bold mb-4 text-sky-300 sticky top-0 bg-slate-900/50 backdrop-blur-sm py-2">{monthYear}</h3>
                       <div className="space-y-3">
                        {lotesDoMes.map((lote, index) => (
                          <motion.div
                            key={lote.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-effect rounded-xl p-4 hover:bg-slate-700/60 transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900/50">
                                {lote.foto ? <img src={lote.foto} alt={lote.cliente} className="w-full h-full object-contain" /> : <Package className="w-10 h-10 text-slate-600 m-auto"/>}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div>
                                    <h4 className="text-lg font-bold mb-1 text-slate-100">{lote.cliente}</h4>
                                    <p className="text-sm text-slate-300">
                                      {lote.cor} • {lote.quantidade} peças
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => setSelectedLote(lote)}
                                      className="p-2 glass-effect rounded-lg hover:bg-slate-700/60 transition-all"
                                    >
                                      <Eye className="w-5 h-5 text-sky-300" />
                                    </motion.button>
                                    {isAdmin && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => { if (window.confirm('Tem certeza que deseja excluir este lote do histórico?')) { onDelete(lote.id); } }}
                                        className="p-2 glass-effect rounded-lg hover:bg-red-500/20 transition-all"
                                      >
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <Calendar className="w-4 h-4" />
                                  <span>Entregue em {formatDate(lote.data_entrega)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {selectedLote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLote(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedLote(null)}
                  className="absolute -top-12 right-0 p-2 glass-effect rounded-lg hover:bg-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <img
                  src={selectedLote.foto}
                  alt={selectedLote.cliente}
                  className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                />
                <div className="glass-effect rounded-xl p-4 mt-4">
                  <h3 className="text-xl font-bold mb-2">{selectedLote.cliente}</h3>
                  <p className="text-slate-300">
                    {selectedLote.cor} • {selectedLote.quantidade} peças
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Entregue em {formatDate(selectedLote.data_entrega)}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoricoModal;