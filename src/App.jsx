
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, QrCode, Truck, Building, CalendarCheck, CheckCircle, Info, LogOut, DollarSign, Ruler, FileText, FilterX } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import LoteCard from '@/components/LoteCard';

const AddLoteModal = React.lazy(() => import('@/components/AddLoteModal'));
const HistoricoModal = React.lazy(() => import('@/components/HistoricoModal'));
const QRScannerModal = React.lazy(() => import('@/components/QRScannerModal'));
const LoginScreen = React.lazy(() => import('@/components/LoginScreen'));
const CabineSelectModal = React.lazy(() => import('@/components/CabineSelectModal'));

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
  const [isCabineModalOpen, setIsCabineModalOpen] = useState(false);
  const [loteToProgram, setLoteToProgram] = useState(null);
  const [editingLote, setEditingLote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('recebido');
  const [statusFilters, setStatusFilters] = useState({ pago: 'any', medida: 'any', nota_fiscal: 'any' });
  const [cabineFilter, setCabineFilter] = useState('1');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const fetchLotes = useCallback(async () => {
    const { data, error } = await supabase.from('lotes').select('*').order('data_criacao', { ascending: true });
    if (error) {
      toast({ title: "❌ Erro ao buscar lotes", description: error.message, variant: "destructive" });
    } else {
      setLotes(data);
    }
  }, []);

  const fetchHistorico = useCallback(async () => {
    const { data, error } = await supabase.from('historico').select('*').order('data_entrega', { ascending: false });
    if (error) {
      toast({ title: "❌ Erro ao buscar histórico", description: error.message, variant: "destructive" });
    } else {
      setHistorico(data);
    }
  }, []);

  useEffect(() => {
    if (!userRole) return;
    fetchLotes();
    fetchHistorico();
    const lotesSubscription = supabase.channel('public:lotes').on('postgres_changes', { event: '*', schema: 'public', table: 'lotes' }, fetchLotes).subscribe();
    const historicoSubscription = supabase.channel('public:historico').on('postgres_changes', { event: '*', schema: 'public', table: 'historico' }, fetchHistorico).subscribe();
    return () => {
      supabase.removeChannel(lotesSubscription);
      supabase.removeChannel(historicoSubscription);
    };
  }, [userRole, fetchLotes, fetchHistorico]);
  
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
    setEditingLote(loteToEdit);
    setIsAddModalOpen(true);
  }, []);

  const handleAddOrUpdateLote = useCallback(async (loteData, id) => {
    const dataToSave = {
        cliente: loteData.cliente,
        cor: loteData.cor,
        quantidade: loteData.quantidade,
        foto: loteData.foto,
        prazo_entrega: loteData.prazoEntrega || null,
        metodo_pagamento: loteData.metodoPagamento,
        observacao: loteData.observacao,
        precisa_nota_fiscal: loteData.precisaNotaFiscal,
        updated_at: new Date().toISOString()
    };
    
    if (id) {
      const { error } = await supabase.from('lotes').update(dataToSave).eq('id', id);
      if (error) { toast({ title: "❌ Erro ao atualizar", description: error.message, variant: "destructive" }); } 
      else { toast({ title: "✅ Lote atualizado!", description: `O lote de ${loteData.cliente} foi modificado.` }); }
    } else {
       const newLote = { ...dataToSave, pago: 'unanalysed', medida: 'unanalysed', nota_fiscal: 'unanalysed', programado: false, pintado: false, promessa: false, data_criacao: new Date().toISOString() };
      const { error } = await supabase.from('lotes').insert(newLote);
      if (error) { toast({ title: "❌ Erro ao adicionar", description: error.message, variant: "destructive" }); } 
      else { toast({ title: "✅ Lote registrado!", description: `Lote de ${loteData.cliente} adicionado.` }); }
    }
    setEditingLote(null);
  }, []);

  const handleUpdateLoteStatus = useCallback(async (id, updates) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (!loteOriginal) return;

    let finalUpdates = { ...updates };
    if (finalUpdates.pintado === true) { finalUpdates.data_pintura = new Date().toISOString(); }
    if (finalUpdates.pintado === false && loteOriginal.pintado) { finalUpdates.data_pintura = null; }
    if (finalUpdates.programado === true) {
      setLoteToProgram(id);
      setIsCabineModalOpen(true);
      return;
    }
    if (finalUpdates.programado === false && loteOriginal.programado) { finalUpdates = { ...finalUpdates, promessa: false, programado: false, cabine: null, ordem_pintura: null }; }
    
    finalUpdates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('lotes').update(finalUpdates).eq('id', id);
    if (error) { toast({ title: "❌ Erro ao atualizar status", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "✅ Status atualizado!", description: "Informações atualizadas." }); }
  }, [lotes]);

  const handleSetCabine = async (loteId, cabine) => {
    const { error } = await supabase.from('lotes').update({ programado: true, pintado: false, cabine: cabine, updated_at: new Date().toISOString() }).eq('id', loteId);
    if (error) { toast({ title: "❌ Erro ao programar", description: error.message, variant: "destructive" }); }
    else { toast({ title: `✅ Programado para Cabine ${cabine}!`, description: "O lote está pronto para a pintura." }); }
    setIsCabineModalOpen(false);
    setLoteToProgram(null);
  };

  const handleMarcarPintadoPorQR = useCallback(async (id) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (!loteOriginal) return;
    if (loteOriginal.pintado) { toast({ title: "ℹ️ Status inalterado", description: "Este lote já estava pintado." }); return; }
    const { error } = await supabase.from('lotes').update({ pintado: true, programado: false, updated_at: new Date().toISOString(), data_pintura: new Date().toISOString() }).eq('id', id);
    if (error) { toast({ title: "❌ Erro", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "🎨 Lote pintado!", description: `Lote de ${loteOriginal.cliente} atualizado.` }); }
  }, [lotes]);

  const handleMarcarEntregue = useCallback(async (id) => {
    const loteToMove = lotes.find(l => l.id === id);
    if (!loteToMove) return;
    if (!(loteToMove.pago === 'ok' && loteToMove.medida === 'ok' && loteToMove.pintado)) {
      toast({ title: "⚠️ Ação bloqueada", description: "Status 'Pago', 'Medida' e 'Pintado' devem estar OK.", variant: "destructive" });
      return;
    }
    const loteEntregue = { ...loteToMove, data_entrega: new Date().toISOString() };
    const { error: insertError } = await supabase.from('historico').insert(loteEntregue);
    if (insertError) { toast({ title: "❌ Erro ao mover", description: insertError.message, variant: "destructive" }); return; }
    const { error: deleteError } = await supabase.from('lotes').delete().eq('id', id);
    if (deleteError) { toast({ title: "❌ Erro ao remover", description: deleteError.message, variant: "destructive" }); } 
    else { toast({ title: "📦 Lote entregue!", description: `Lote de ${loteToMove.cliente} movido para o histórico.` }); }
  }, [lotes]);

  const handleDeleteLote = useCallback(async (id) => {
    if (userRole !== 'administrador') { toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para excluir.", variant: "destructive" }); return; }
    const loteToDelete = lotes.find(l => l.id === id);
    if (loteToDelete?.foto) {
      const { error: storageError } = await supabase.storage.from('fotos-lotes').remove([loteToDelete.foto]);
      if (storageError) { toast({ title: "⚠️ Erro ao apagar foto", description: storageError.message, variant: "destructive" }); }
    }
    const { error } = await supabase.from('lotes').delete().eq('id', id);
    if (error) { toast({ title: "❌ Erro ao remover", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "🗑️ Lote removido", description: "Lote excluído com sucesso." }); }
  }, [userRole, lotes]);

  const handleDeleteHistoricoLote = useCallback(async (id) => {
    if (userRole !== 'administrador') { toast({ title: "🚫 Acesso Negado", description: "Permissão para excluir do histórico negada.", variant: "destructive" }); return; }
    const loteToDelete = historico.find(l => l.id === id);
    if (loteToDelete?.foto) {
      const { error: storageError } = await supabase.storage.from('fotos-lotes').remove([loteToDelete.foto]);
      if (storageError) { toast({ title: "⚠️ Erro ao apagar foto", description: storageError.message, variant: "destructive" }); }
    }
    const { error } = await supabase.from('historico').delete().eq('id', id);
    if (error) { toast({ title: "❌ Erro ao remover", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "🗑️ Lote removido do histórico", description: "Lote excluído." }); }
  }, [userRole, historico]);
  
  const resetAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilters({ pago: 'any', medida: 'any', nota_fiscal: 'any' });
  }, []);
  
  const handleFilterChange = useCallback((newFilter) => {
    setFilterStatus(newFilter);
    if (newFilter === 'programado') {
        setCabineFilter('1');
    }
    window.scrollTo(0, 0);
  }, []);

  const handleStatusFilterChange = useCallback((filterName, value) => {
      setStatusFilters(prev => ({...prev, [filterName]: value}));
      window.scrollTo(0, 0);
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const cabine = parseInt(source.droppableId.split('-')[1]);
    const lotesNaCabine = filteredLotes.programado.filter(l => l.cabine === cabine);
    const [reorderedItem] = lotesNaCabine.splice(source.index, 1);
    lotesNaCabine.splice(destination.index, 0, reorderedItem);

    const updates = lotesNaCabine.map((lote, index) => ({
        id: lote.id,
        ordem_pintura: index
    }));

    const { error } = await supabase.from('lotes').upsert(updates);
    if (error) {
        toast({ title: "❌ Erro ao reordenar", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "✅ Ordem salva!", description: "A nova ordem de pintura foi registrada." });
        fetchLotes(); // Re-fetch to confirm order
    }
  };

  const filteredLotes = useMemo(() => {
    const applyFilters = (lote) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      if (lowerSearchTerm && !lote.cliente?.toLowerCase().includes(lowerSearchTerm) && !lote.cor?.toLowerCase().includes(lowerSearchTerm)) return false;
      if (statusFilters.pago !== 'any' && lote.pago !== statusFilters.pago) return false;
      if (statusFilters.medida !== 'any' && lote.medida !== statusFilters.medida) return false;
      if (statusFilters.nota_fiscal !== 'any' && lote.nota_fiscal !== statusFilters.nota_fiscal) return false;
      return true;
    };
    
    const recebido = lotes.filter(l => !l.programado && !l.pintado && applyFilters(l));
    const programadoRaw = lotes.filter(l => l.programado && !l.pintado && applyFilters(l));
    const pintado = lotes.filter(l => l.pintado && applyFilters(l));

    const programado = cabineFilter === 'all' 
      ? programadoRaw 
      : programadoRaw.filter(l => l.cabine === parseInt(cabineFilter));

    return { recebido, programado, pintado };
  }, [lotes, searchTerm, statusFilters, cabineFilter]);

  const stats = useMemo(() => ({
    total: lotes.length,
    recebido: lotes.filter(l => !l.programado && !l.pintado).length,
    programado: lotes.filter(l => l.programado && !l.pintado).length,
    pintado: lotes.filter(l => l.pintado).length,
  }), [lotes]);

  const filterOptions = [
    { id: 'recebido', label: 'Recebidos', icon: Building, count: stats.recebido },
    { id: 'programado', label: 'Programado p/ Pintura', icon: CalendarCheck, count: stats.programado },
    { id: 'pintado', label: 'Pintados', icon: CheckCircle, count: stats.pintado },
  ];
  
  const cabineFilterOptions = ['1', '2', '3', '4', 'all'];

  if (!userRole) return <Suspense fallback={<LoadingFallback />}><LoginScreen onLogin={handleLogin} /></Suspense>;

  const currentLotes = filteredLotes[filterStatus] || [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Helmet>
        <title>Sistema de Gestão de Lotes - Textura Técnicas</title>
        <meta name="description" content="Sistema otimizado para gestão de lotes industriais com controle em tempo real." />
      </Helmet>

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">Gestão de Lotes</h1>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-semibold glass-effect px-3 py-2 rounded-lg">{userRole === 'administrador' ? '👑 Admin' : '👤 Usuário'}</span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="glass-effect p-3 rounded-xl hover:bg-red-500/20" aria-label="Sair"><LogOut className="w-5 h-5 text-red-400" /></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsQRScannerOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60"><QrCode className="w-5 h-5 text-sky-300" /><span className="hidden sm:inline">Escanear</span></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsHistoricoOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60"><Truck className="w-5 h-5 text-sky-300" /><span className="hidden sm:inline">Entregues</span></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30"><Plus className="w-5 h-5" /><span className="hidden sm:inline">Novo Lote</span></motion.button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar por cliente ou cor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-effect pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
                <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-300"/><select value={statusFilters.pago} onChange={e => handleStatusFilterChange('pago', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm"><option value="any">Pago</option><option value="ok">OK</option><option value="pending">Pendente</option><option value="unanalysed">N/A</option></select></div>
                <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-cyan-300"/><select value={statusFilters.medida} onChange={e => handleStatusFilterChange('medida', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm"><option value="any">Medida</option><option value="ok">OK</option><option value="pending">Pendente</option><option value="unanalysed">N/A</option></select></div>
                <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-300"/><select value={statusFilters.nota_fiscal} onChange={e => handleStatusFilterChange('nota_fiscal', e.target.value)} className="glass-effect rounded-lg px-3 py-1.5 text-sm"><option value="any">NF</option><option value="ok">OK</option><option value="pending">Pendente</option><option value="unanalysed">N/A</option></select></div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetAllFilters} className="glass-effect px-4 py-1.5 rounded-lg text-sm flex items-center gap-2"><FilterX className="w-4 h-4" />Limpar</motion.button>
                <div className="glass-effect px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 font-semibold">
                    <Package className="w-4 h-4 text-slate-300" />
                    <span>Total: {stats.total}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 glass-effect rounded-xl p-1">
              {filterOptions.map((status, index) => (
                <motion.button 
                  key={status.id} 
                  layout 
                  onClick={() => handleFilterChange(status.id)} 
                  className={`relative w-full px-2 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-2 text-xs md:text-sm ${filterStatus === status.id ? '' : 'text-slate-300 hover:text-white'} ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
                >
                  {filterStatus === status.id && <motion.div layoutId="active-pill" className="absolute inset-0 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg z-0" />}
                  <div className="relative z-10 flex items-center gap-1.5 md:gap-2">
                    <status.icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="truncate">{status.label}</span>
                    <span className="bg-slate-900/50 text-white text-xs md:text-base font-bold px-2 py-0.5 rounded-full">{status.count}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {filterStatus === 'programado' && (
              <div className="mt-4 glass-effect rounded-xl p-1 flex items-center gap-1 flex-wrap">
                {cabineFilterOptions.map(cab => (
                   <motion.button key={cab} layout onClick={() => setCabineFilter(cab)} className={`relative flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm min-w-[80px] ${cabineFilter === cab ? '' : 'text-slate-300 hover:text-white'}`}>
                    {cabineFilter === cab && <motion.div layoutId="active-cabine-pill" className="absolute inset-0 bg-slate-700/80 rounded-lg z-0" />}
                    <span className="relative z-10">{cab === 'all' ? 'Todas' : `Cab. ${cab}`}</span>
                   </motion.button>
                ))}
              </div>
            )}
          </motion.header>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <AnimatePresence mode="wait">
              <motion.div key={filterStatus}>
                {lotes.length === 0 && searchTerm === '' ? (
                  <div className="text-center p-12 glass-effect rounded-2xl"><Package className="w-16 h-16 mx-auto mb-4 text-slate-500 animate-pulse" /><h3 className="text-2xl font-bold mb-2">Carregando lotes...</h3><p className="text-slate-400">Só um momento, estamos buscando os dados.</p></div>
                ) : currentLotes.length === 0 ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-effect p-12 rounded-2xl text-center"><Package className="w-16 h-16 mx-auto mb-4 text-slate-500" /><h3 className="text-2xl font-bold mb-2">Nenhum lote encontrado</h3><p className="text-slate-400 mb-6">Tente ajustar os filtros ou adicione um novo lote.</p><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-sky-500/30"><Plus className="w-5 h-5" />Adicionar Lote</motion.button></motion.div>
                ) : (
                  <Droppable droppableId={`cabine-${cabineFilter}`} isDropDisabled={filterStatus !== 'programado' || cabineFilter === 'all'}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                          {currentLotes.sort((a,b) => (a.ordem_pintura ?? 999) - (b.ordem_pintura ?? 999)).map((lote, index) => (
                            <Draggable key={lote.id} draggableId={lote.id.toString()} index={index} isDragDisabled={filterStatus !== 'programado' || cabineFilter === 'all'}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                  <LoteCard lote={lote} userRole={userRole} onUpdateStatus={handleUpdateLoteStatus} onMarcarEntregue={handleMarcarEntregue} onDelete={handleDeleteLote} onEdit={handleOpenEditModal} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <AddLoteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddOrUpdateLote} loteToEdit={editingLote} userRole={userRole} />
          <HistoricoModal isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} historico={historico} onDelete={handleDeleteHistoricoLote} userRole={userRole} />
          <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleMarcarPintadoPorQR} lotes={lotes} />
          <CabineSelectModal isOpen={isCabineModalOpen} onClose={() => setIsCabineModalOpen(false)} onSelectCabine={(cabine) => handleSetCabine(loteToProgram, cabine)} />
        </Suspense>
        
        <Toaster />
      </div>
    </DragDropContext>
  );
}

export default App;
