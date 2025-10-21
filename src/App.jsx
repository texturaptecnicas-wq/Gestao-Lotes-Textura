
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, QrCode, Truck, Building, CalendarCheck, CheckCircle, Info, LogOut, DollarSign, Ruler, FileText, FilterX } from 'lucide-react';
import { db } from '@/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import LoteCard from '@/components/LoteCard';

const AddLoteModal = React.lazy(() => import('@/components/AddLoteModal'));
const HistoricoModal = React.lazy(() => import('@/components/HistoricoModal'));
const QRScannerModal = React.lazy(() => import('@/components/QRScannerModal'));
const LoginScreen = React.lazy(() => import('@/components/LoginScreen'));

const LoadingFallback = () => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div className="text-white font-semibold">Carregando...</div>
  </div>
);

function App() {
  const [lotes, setLotes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [statusFilters, setStatusFilters] = useState({ pago: 'any', medida: 'any', notaFiscal: 'any' });
  const [userRole, setUserRole] = useState(null);
  const bufferRef = useRef({ data: [], timeout: null });

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (!userRole) return;

    const lotesRef = ref(db, 'lotes');
    const historicoRef = ref(db, 'historico');

    const unsubscribeLotes = onValue(lotesRef, snapshot => {
      const data = snapshot.val();
      const lotesArray = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      
      bufferRef.current.data = lotesArray;
      if (!bufferRef.current.timeout) {
        bufferRef.current.timeout = setTimeout(() => {
          setLotes(bufferRef.current.data);
          bufferRef.current.timeout = null;
        }, 250);
      }
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
      if (bufferRef.current.timeout) clearTimeout(bufferRef.current.timeout);
      unsubscribeLotes();
      unsubscribeHistorico();
    };
  }, [userRole]);
  
  const handleLogin = useCallback((role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userRole');
    setUserRole(null);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingLote(null);
    setIsAddModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((loteToEdit) => {
    if (userRole !== 'administrador') {
      toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para editar lotes.", variant: "destructive" });
      return;
    }
    setEditingLote(loteToEdit);
    setIsAddModalOpen(true);
  }, [userRole]);

  const handleAddOrUpdateLote = useCallback((loteData, id) => {
    const loteId = id || Date.now().toString();
    const loteRef = ref(db, `lotes/${loteId}`);
    const timestamp = new Date().toISOString();

    if (id) {
      update(loteRef, { ...loteData, updatedAt: timestamp }).then(() => {
        toast({
          title: "✅ Lote atualizado!",
          description: `O lote de ${loteData.cliente} foi modificado com sucesso.`
        });
      });
    } else {
      const loteComId = {
        ...loteData,
        dataCriacao: timestamp,
        updatedAt: timestamp,
        pago: 'unanalysed',
        medida: 'unanalysed',
        notaFiscal: 'unanalysed',
        programado: false,
        pintado: false,
        promessa: false,
      };
      set(loteRef, loteComId).then(() => {
        toast({
          title: "✅ Lote registrado!",
          description: `Lote de ${loteData.cliente} adicionado com sucesso.`
        });
      });
    }
    setEditingLote(null);
  }, []);

  const handleUpdateLoteStatus = useCallback((id, updates) => {
    const loteRef = ref(db, `lotes/${id}`);
    const loteOriginal = lotes.find(l => l.id === id);

    if (!loteOriginal) return;

    const finalUpdates = { ...updates, updatedAt: new Date().toISOString() };

    if (finalUpdates.programado === true) finalUpdates.pintado = false;
    if (finalUpdates.programado === false && loteOriginal.programado) finalUpdates.promessa = false;
    if (finalUpdates.pintado === true) finalUpdates.programado = false;

    if(finalUpdates.promessa === true && !loteOriginal.programado) {
      toast({
        title: "⚠️ Ação inválida",
        description: "Marque o lote como 'Programado p/ Hoje' antes de definir como promessa.",
        variant: "destructive"
      });
      return;
    }

    update(loteRef, finalUpdates).then(() => {
      toast({
        title: "✅ Status atualizado!",
        description: "As informações foram atualizadas com sucesso."
      });
    });
  }, [lotes]);

  const handleMarcarPintadoPorQR = useCallback((id) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (loteOriginal && loteOriginal.pintado) {
      toast({ title: "ℹ️ Status inalterado", description: "Este lote já estava marcado como pintado." });
      return;
    }
    const loteRef = ref(db, `lotes/${id}`);
    update(loteRef, { pintado: true, programado: false, updatedAt: new Date().toISOString() }).then(() => {
      if (loteOriginal) {
        toast({ title: "🎨 Lote marcado como pintado!", description: `O lote do cliente ${loteOriginal.cliente} foi atualizado.` });
      }
    });
  }, [lotes]);

  const handleMarcarEntregue = useCallback((id) => {
    const loteToMove = lotes.find(l => l.id === id);
    if (loteToMove) {
      if (!(loteToMove.pago === 'ok' && loteToMove.medida === 'ok' && loteToMove.pintado)) {
        toast({ title: "⚠️ Ação bloqueada", description: "Status 'Pago', 'Medida' devem estar verdes e o lote 'Pintado' para entregar.", variant: "destructive" });
        return;
      }
      const loteEntregue = { ...loteToMove, dataEntrega: new Date().toISOString() };
      const newHistoricoRef = ref(db, `historico/${id}`);
      set(newHistoricoRef, loteEntregue).then(() => {
        remove(ref(db, `lotes/${id}`)).then(() => {
          toast({ title: "📦 Lote entregue!", description: `Lote de ${loteToMove.cliente} movido para o histórico.` });
        });
      });
    }
  }, [lotes]);

  const handleDeleteLote = useCallback((id) => {
    if (userRole !== 'administrador') {
      toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para excluir lotes.", variant: "destructive" });
      return;
    }
    remove(ref(db, `lotes/${id}`)).then(() => {
      toast({ title: "🗑️ Lote removido", description: "O lote foi excluído com sucesso." });
    });
  }, [userRole]);

  const handleDeleteHistoricoLote = useCallback((id) => {
    if (userRole !== 'administrador') {
      toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para excluir lotes do histórico.", variant: "destructive" });
      return;
    }
    remove(ref(db, `historico/${id}`)).then(() => {
      toast({ title: "🗑️ Lote removido do histórico", description: "O lote entregue foi excluído com sucesso." });
    });
  }, [userRole]);
  
  const resetAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('todos');
    setStatusFilters({ pago: 'any', medida: 'any', notaFiscal: 'any' });
  }, []);
  
  const handleFilterChange = useCallback((newFilter) => {
    setFilterStatus(newFilter);
    window.scrollTo(0, 0);
  }, []);

  const handleStatusFilterChange = useCallback((filterName, value) => {
      setStatusFilters(prev => ({...prev, [filterName]: value}));
      window.scrollTo(0, 0);
  }, []);

  const filteredLotes = useMemo(() => {
    return lotes
      .filter(lote => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (lowerSearchTerm && !lote.cliente?.toLowerCase().includes(lowerSearchTerm) && !lote.cor?.toLowerCase().includes(lowerSearchTerm)) return false;
        if (statusFilters.pago !== 'any' && lote.pago !== statusFilters.pago) return false;
        if (statusFilters.medida !== 'any' && lote.medida !== statusFilters.medida) return false;
        if (statusFilters.notaFiscal !== 'any' && lote.notaFiscal !== statusFilters.notaFiscal) return false;
        switch (filterStatus) {
          case 'recebido': return !lote.programado && !lote.pintado;
          case 'programado': return lote.programado && !lote.pintado;
          case 'pintado': return lote.pintado;
          default: return true;
        }
      })
      .sort((a, b) => {
        if (a.promessa && !b.promessa) return -1;
        if (!a.promessa && b.promessa) return 1;
        return new Date(b.dataCriacao) - new Date(a.dataCriacao);
      });
  }, [lotes, searchTerm, filterStatus, statusFilters]);

  const stats = useMemo(() => ({
    total: lotes.length,
    recebido: lotes.filter(l => !l.programado && !l.pintado).length,
    programado: lotes.filter(l => l.programado && !l.pintado).length,
    pintado: lotes.filter(l => l.pintado).length,
  }), [lotes]);

  const filterOptions = [
    { id: 'todos', label: 'Todos', icon: Package },
    { id: 'recebido', label: 'Recebidos', icon: Building },
    { id: 'programado', label: 'Programado p/ Hoje', icon: CalendarCheck },
    { id: 'pintado', label: 'Pintados', icon: CheckCircle },
  ];

  if (!userRole) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sistema de Gestão de Lotes - Controle Industrial</title>
        <meta name="description" content="Sistema otimizado para gestão de lotes industriais com controle em tempo real." />
      </Helmet>

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">Gestão de Lotes</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-semibold glass-effect px-3 py-2 rounded-lg">
                  {userRole === 'administrador' ? '👑 Admin' : '👤 Usuário'}
                </span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="glass-effect p-3 rounded-xl hover:bg-red-500/20 transition-colors" aria-label="Sair"><LogOut className="w-5 h-5 text-red-400" /></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsQRScannerOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition-all"><QrCode className="w-5 h-5 text-sky-300" /><span className="hidden sm:inline">Escanear QR</span></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsHistoricoOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition-all"><Truck className="w-5 h-5 text-sky-300" /><span className="hidden sm:inline">Entregues</span></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30"><Plus className="w-5 h-5" /><span className="hidden sm:inline">Novo Lote</span></motion.button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="glass-effect p-3 md:p-4 rounded-xl"><div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-blue-500/20 rounded-lg"><Package className="w-5 h-5 md:w-6 md:h-6 text-blue-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Total</p><p className="text-xl md:text-2xl font-bold">{stats.total}</p></div></div></div>
              <div className="glass-effect p-3 md:p-4 rounded-xl"><div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-slate-500/20 rounded-lg"><Building className="w-5 h-5 md:w-6 md:h-6 text-slate-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Recebidos</p><p className="text-xl md:text-2xl font-bold">{stats.recebido}</p></div></div></div>
              <div className="glass-effect p-3 md:p-4 rounded-xl"><div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-orange-500/20 rounded-lg"><CalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-orange-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Programado p/ Hoje</p><p className="text-xl md:text-2xl font-bold">{stats.programado}</p></div></div></div>
              <div className="glass-effect p-3 md:p-4 rounded-xl"><div className="flex items-center gap-2 md:gap-3"><div className="p-2 md:p-3 bg-green-500/20 rounded-lg"><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-300" /></div><div><p className="text-xs md:text-sm text-slate-300">Pintados</p><p className="text-xl md:text-2xl font-bold">{stats.pintado}</p></div></div></div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar por cliente ou cor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-effect pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex gap-2">
                {filterOptions.map((status) => (
                  <motion.button key={status.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleFilterChange(status.id)} className={`w-full md:w-auto px-3 py-3 md:px-4 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-2 text-sm ${filterStatus === status.id ? 'bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/30' : 'glass-effect hover:bg-slate-700/60'}`}><status.icon className="w-5 h-5" /><span>{status.label}</span></motion.button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-300 flex-shrink-0" /><select value={statusFilters.pago} onChange={e => handleStatusFilterChange('pago', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="any">Pago (Todos)</option><option value="ok">Pago (OK)</option><option value="pending">Pago (Pendente)</option><option value="unanalysed">Pago (Não Analisado)</option></select></div>
              <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-cyan-300 flex-shrink-0" /><select value={statusFilters.medida} onChange={e => handleStatusFilterChange('medida', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="any">Medida (Todos)</option><option value="ok">Medida (OK)</option><option value="pending">Medida (Pendente)</option><option value="unanalysed">Medida (Não Analisado)</option></select></div>
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-300 flex-shrink-0" /><select value={statusFilters.notaFiscal} onChange={e => handleStatusFilterChange('notaFiscal', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="any">NF (Todos)</option><option value="ok">NF (OK)</option><option value="pending">NF (Pendente)</option><option value="unanalysed">NF (Não Analisado)</option></select></div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetAllFilters} className="glass-effect px-4 py-1.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition-all text-sm"><FilterX className="w-4 h-4" />Limpar</motion.button>
            </div>
          </motion.header>
          <div className="glass-effect rounded-xl p-3 mb-6 flex items-center gap-3 text-sm text-slate-300"><Info className="w-5 h-5 text-sky-300 flex-shrink-0" /><p><span className="font-bold text-white">Legenda:</span> Cinza: não analisado. Vermelho: pendente. Verde: OK.</p></div>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {filteredLotes.length === 0 ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-effect p-12 rounded-2xl text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-2xl font-bold mb-2">Nenhum lote encontrado</h3>
                <p className="text-slate-400 mb-6">Tente ajustar os filtros de busca ou adicione um novo lote.</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-lg shadow-sky-500/30"><Plus className="w-5 h-5" />Adicionar Lote</motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence>
                  {filteredLotes.map((lote, index) => (
                    <LoteCard
                      key={lote.id}
                      lote={lote}
                      index={index}
                      userRole={userRole}
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

        <Suspense fallback={<LoadingFallback />}>
          <AddLoteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddOrUpdateLote} loteToEdit={editingLote} />
          <HistoricoModal isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} historico={historico} onDelete={handleDeleteHistoricoLote} userRole={userRole} />
          <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleMarcarPintadoPorQR} lotes={lotes} />
        </Suspense>
        
        <Toaster />
      </div>
    </>
  );
}

export default App;
