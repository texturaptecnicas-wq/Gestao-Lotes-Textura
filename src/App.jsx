import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, QrCode, Truck, Building, CalendarCheck, CheckCircle } from 'lucide-react';
import { db } from '@/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import AddLoteModal from '@/components/AddLoteModal';
import LoteCard from '@/components/LoteCard';
import HistoricoModal from '@/components/HistoricoModal';
import QRScannerModal from '@/components/QRScannerModal';

function App() {
  const [lotes, setLotes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  useEffect(() => {
    const lotesRef = ref(db, 'lotes');
    const historicoRef = ref(db, 'historico');

    const unsubscribeLotes = onValue(lotesRef, snapshot => {
      const data = snapshot.val();
      const lotesArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)) : [];
      setLotes(lotesArray);
    });

    const unsubscribeHistorico = onValue(historicoRef, snapshot => {
      const data = snapshot.val();
      const historicoArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => new Date(b.dataEntrega) - new Date(a.dataEntrega)) : [];
      setHistorico(historicoArray);
    });

    return () => {
      unsubscribeLotes();
      unsubscribeHistorico();
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingLote(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (loteToEdit) => {
    setEditingLote(loteToEdit);
    setIsAddModalOpen(true);
  };

  const handleAddOrUpdateLote = (loteData, id) => {
    const loteId = id || Date.now().toString();
    const loteRef = ref(db, `lotes/${loteId}`);

    if (id) {
      update(loteRef, loteData).then(() => {
        toast({
          title: "✅ Lote atualizado!",
          description: `O lote de ${loteData.cliente} foi modificado com sucesso.`
        });
      });
    } else {
      const loteComId = {
        ...loteData,
        dataCriacao: new Date().toISOString(),
        pago: false,
        medida: false,
        programado: false,
        pintado: false
      };
      set(loteRef, loteComId).then(() => {
        toast({
          title: "✅ Lote registrado!",
          description: `Lote de ${loteData.cliente} adicionado com sucesso.`
        });
      });
    }
    setEditingLote(null);
  };

  const handleUpdateLoteStatus = (id, updates) => {
    const loteRef = ref(db, `lotes/${id}`);
    if (updates.pintado === true) {
      updates.programado = false;
    }
    update(loteRef, updates).then(() => {
      toast({
        title: "✅ Status atualizado!",
        description: "As informações foram atualizadas com sucesso."
      });
    });
  };

  const handleMarcarPintadoPorQR = (id) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (loteOriginal && loteOriginal.pintado) {
      toast({
        title: "ℹ️ Status inalterado",
        description: "Este lote já estava marcado como pronto."
      });
      return;
    }
    const loteRef = ref(db, `lotes/${id}`);
    update(loteRef, { pintado: true, programado: false }).then(() => {
      if (loteOriginal) {
        toast({
          title: "🎨 Lote marcado como pronto!",
          description: `O lote do cliente ${loteOriginal.cliente} foi atualizado.`
        });
      }
    });
  };

  const handleMarcarEntregue = (id) => {
    const loteToMove = lotes.find(l => l.id === id);
    if (loteToMove) {
      if (!loteToMove.pago || !loteToMove.medida || !loteToMove.pintado) {
        toast({
          title: "⚠️ Ação bloqueada",
          description: "Marque todos os status (Pago, Medida, Pronto) antes de entregar.",
          variant: "destructive"
        });
        return;
      }

      const loteEntregue = { ...loteToMove, dataEntrega: new Date().toISOString() };
      const newHistoricoRef = ref(db, `historico/${id}`);
      set(newHistoricoRef, loteEntregue).then(() => {
        const oldLoteRef = ref(db, `lotes/${id}`);
        remove(oldLoteRef).then(() => {
          toast({
            title: "📦 Lote entregue!",
            description: `Lote de ${loteToMove.cliente} movido para o histórico.`
          });
        });
      });
    }
  };

  const handleDeleteLote = (id) => {
    const loteRef = ref(db, `lotes/${id}`);
    remove(loteRef).then(() => {
      toast({
        title: "🗑️ Lote removido",
        description: "O lote foi excluído com sucesso."
      });
    });
  };

  const filteredLotes = lotes.filter(currentLote => {
    const matchesSearch = (currentLote.cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (currentLote.cor?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'todos':
        return true;
      case 'recebido':
        return !currentLote.programado && !currentLote.pintado;
      case 'programado':
        return currentLote.programado && !currentLote.pintado;
      case 'pronto':
        return currentLote.pintado;
      default:
        return true;
    }
  });

  const stats = {
    total: lotes.length,
    recebido: lotes.filter(l => !l.programado && !l.pintado).length,
    programado: lotes.filter(l => l.programado && !l.pintado).length,
    pronto: lotes.filter(l => l.pintado).length,
  };

  const filterOptions = [
    { id: 'todos', label: 'Todos', icon: Package },
    { id: 'recebido', label: 'Recebidos', icon: Building },
    { id: 'programado', label: 'Programado p/ Hoje', icon: CalendarCheck },
    { id: 'pronto', label: 'Prontos', icon: CheckCircle },
  ];

  return (
    <>
      <Helmet>
        <title>Sistema de Gestão de Lotes - Controle Industrial</title>
        <meta name="description" content="Sistema completo para gestão de lotes industriais com controle de pagamento, medidas, pintura e entregas." />
      </Helmet>

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">Gestão de Lotes </h1>
                <p className="text-slate-300"></p>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsQRScannerOpen(true)}
                  className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition-all"
                >
                  <QrCode className="w-5 h-5 text-sky-300" />
                  <span className="hidden sm:inline">Escanear QR</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsHistoricoOpen(true)}
                  className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition-all"
                >
                  <Truck className="w-5 h-5 text-sky-300" />
                  <span className="hidden sm:inline">Entregues</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenAddModal}
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Novo Lote</span>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="glass-effect p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-blue-500/20 rounded-lg"><Package className="w-5 h-5 md:w-6 md:h-6 text-blue-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Total</p><p className="text-xl md:text-2xl font-bold">{stats.total}</p></div></div>
                </div>
                <div className="glass-effect p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-slate-500/20 rounded-lg"><Building className="w-5 h-5 md:w-6 md:h-6 text-slate-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Recebidos</p><p className="text-xl md:text-2xl font-bold">{stats.recebido}</p></div></div>
                </div>
                <div className="glass-effect p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg"><CalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Programado p/ Hoje</p><p className="text-xl md:text-2xl font-bold">{stats.programado}</p></div></div>
                </div>
                <div className="glass-effect p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-green-500/20 rounded-lg"><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Prontos</p><p className="text-xl md:text-2xl font-bold">{stats.pronto}</p></div></div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou cor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-effect pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex gap-2">
                {filterOptions.map((status) => (
                  <motion.button
                    key={status.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterStatus(status.id)}
                    className={`w-full md:w-auto px-3 py-3 md:px-4 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-2 text-sm ${
                      filterStatus === status.id
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/30'
                        : 'glass-effect hover:bg-slate-700/60'
                    }`}
                  >
                    <status.icon className="w-5 h-5" />
                    <span>{status.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredLotes.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-effect p-12 rounded-2xl text-center"
              >
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-2xl font-bold mb-2">Nenhum lote encontrado</h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || filterStatus !== 'todos'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece adicionando um novo lote'}
                </p>
                {!searchTerm && filterStatus === 'todos' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenAddModal}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Primeiro Lote
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence>
                  {filteredLotes.map((currentLote, index) => (
                    <LoteCard
                      key={currentLote.id}
                      lote={currentLote}
                      index={index}
                      onUpdateStatus={handleUpdateLoteStatus}
                      onMarcarEntregue={handleMarcarEntregue}
                      onDelete={handleDeleteLote}
                      onEdit={handleOpenEditModal}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        <AddLoteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddOrUpdateLote}
          loteToEdit={editingLote}
        />

        <HistoricoModal
          isOpen={isHistoricoOpen}
          onClose={() => setIsHistoricoOpen(false)}
          historico={historico}
        />

        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScan={handleMarcarPintadoPorQR}
          lotes={lotes}
        />

        <Toaster />
      </div>
    </>
  );
}

export default App;