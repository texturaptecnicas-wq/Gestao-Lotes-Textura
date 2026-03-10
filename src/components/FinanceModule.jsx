
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, LogOut, Loader2, Plus, 
  RefreshCw, Clock, ArrowLeft, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import FinancePasswordModal from '@/components/FinancePasswordModal';
import EditPIXModal from '@/components/EditPIXModal';
import PendingPIXManager from '@/components/PendingPIXManager';

// Import New Report Components
import { getDateRange, getNextDay } from '@/utils/getDateRange';
import ReportFilters from '@/components/ReportFilters';
import ReportSummaryCards from '@/components/ReportSummaryCards';
import TransactionsTable from '@/components/TransactionsTable';
import ClientRanking from '@/components/ClientRanking';
import ReportChart from '@/components/ReportChart';
import ReportExport from '@/components/ReportExport';

const PIXRegistrationModal = React.lazy(() => import('@/components/PIXRegistrationModal'));

const FinanceModule = ({ onLogout, loteData, onReturn }) => {
  const [activeTab, setActiveTab] = useState('adicionar');
  
  // Data States
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [reportTransactions, setReportTransactions] = useState([]);
  const [lotes, setLotes] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Report Period State
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '',
    endDate: '',
    periodType: 'month'
  });

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedLoteForPayment, setSelectedLoteForPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPix, setEditingPix] = useState(null);

  // Form State
  const [newPix, setNewPix] = useState({
    cliente: '',
    valor: '',
    lote_id: '',
    data_registro: new Date().toISOString().split('T')[0]
  });

  // Load Lotes for dropdown and initial recent list
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle Entrance from Lote Confirmation
  useEffect(() => {
    if (loteData) {
      setShowPasswordModal(true);
    }
  }, [loteData]);

  // Fetch Report Data specifically when tab is 'relatorios' or period changes
  useEffect(() => {
    if (activeTab === 'relatorios' && reportPeriod.startDate && reportPeriod.endDate) {
      fetchReportData(reportPeriod);
    }
  }, [activeTab, reportPeriod]);

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    if (loteData) {
      setSelectedLoteForPayment(loteData);
      setShowPixModal(true);
    }
  };

  const handlePasswordClose = () => {
    setShowPasswordModal(false);
    if (onReturn) onReturn();
  };

  const handlePixModalClose = () => {
    setShowPixModal(false);
    setSelectedLoteForPayment(null);
    if (onReturn && loteData) {
        onReturn();
    } else {
        fetchInitialData();
    }
  };

  // Main data fetch for Lançamentos tab
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch Lot List for dropdown
      const { data: lotesData } = await supabase
        .from('lotes')
        .select('*') 
        .order('data_criacao', { ascending: false });
      setLotes(lotesData || []);

      // Fetch recent unified transactions limit 10
      const { data: records } = await supabase.from('pix_records').select('*').order('data_registro', { ascending: false }).limit(15);
      const { data: lancados } = await supabase.from('pix_lancados').select('*').order('data_lancamento', { ascending: false }).limit(15);

      const standard = (records || []).map(r => ({ ...r, source: 'standard', valor: Number(r.valor_recebido), data_lancamento: r.data_registro }));
      const launched = (lancados || []).map(r => ({ ...r, source: 'lancado', valor: Number(r.valor), data_lancamento: r.data_lancamento }));
      
      const merged = [...standard, ...launched].sort((a, b) => new Date(b.data_lancamento) - new Date(a.data_lancamento)).slice(0, 10);
      setRecentTransactions(merged);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Report Data Fetch
  const fetchReportData = async (period) => {
    setIsReportLoading(true);
    try {
      const nextDayStr = getNextDay(period.endDate);

      // Fetch from pix_lancados using precise date comparison
      const { data: lancadosData, error: e1 } = await supabase
        .from('pix_lancados')
        .select('*')
        .gte('data_lancamento', period.startDate)
        .lt('data_lancamento', nextDayStr)
        .order('data_lancamento', { ascending: false });

      if (e1) throw e1;

      // Fetch from pix_records (legacy table)
      const { data: recordsData, error: e2 } = await supabase
        .from('pix_records')
        .select('*')
        .gte('data_registro', period.startDate)
        .lt('data_registro', nextDayStr)
        .order('data_registro', { ascending: false });

      if (e2) throw e2;

      // Normalize and Merge
      const normalizedLancados = (lancadosData || []).map(r => ({ ...r, source: 'lancado', valor: Number(r.valor), data_lancamento: r.data_lancamento }));
      const normalizedRecords = (recordsData || []).map(r => ({ ...r, source: 'standard', valor: Number(r.valor_recebido), data_lancamento: r.data_registro }));
      
      const mergedData = [...normalizedLancados, ...normalizedRecords].sort((a, b) => new Date(b.data_lancamento) - new Date(a.data_lancamento));
      
      setReportTransactions(mergedData);
    } catch (error) {
      console.error("Error fetching report data", error);
      toast({ title: "Erro", description: "Falha ao buscar relatório.", variant: "destructive" });
    } finally {
      setIsReportLoading(false);
    }
  };

  const handlePeriodChange = useCallback((newPeriod) => {
    setReportPeriod(newPeriod);
  }, []);

  const handleAddPix = async (e) => {
    e.preventDefault();
    if (!newPix.cliente || !newPix.valor) return;

    setIsSubmitting(true);
    try {
      const payload = {
        cliente: newPix.cliente,
        valor_recebido: parseFloat(newPix.valor),
        data_registro: newPix.data_registro,
        lote_id: newPix.lote_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('pix_records').insert(payload);
      if (error) throw error;

      toast({ title: "Sucesso!", description: "PIX registrado com sucesso." });
      setNewPix({ cliente: '', valor: '', lote_id: '', data_registro: new Date().toISOString().split('T')[0] });
      fetchInitialData();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoteSelect = (loteId) => {
    const selected = lotes.find(l => l.id === loteId);
    setNewPix(prev => ({ ...prev, lote_id: loteId, cliente: selected ? selected.cliente : prev.cliente }));
  };

  const handleDeletePix = async (id, isLancado = false) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro financeiro?")) return;

    try {
      const table = isLancado ? 'pix_lancados' : 'pix_records';
      await supabase.from(table).delete().eq('id', id);
      toast({ title: "Excluído", description: "Registro removido com sucesso." });
      
      fetchInitialData();
      if (activeTab === 'relatorios') fetchReportData(reportPeriod);
    } catch (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-12">
      <Suspense fallback={null}>
        <FinancePasswordModal isOpen={showPasswordModal} onClose={handlePasswordClose} onSuccess={handlePasswordSuccess} />
        <PIXRegistrationModal isOpen={showPixModal} onClose={handlePixModalClose} lote={selectedLoteForPayment} onSuccess={() => { handlePixModalClose(); fetchInitialData(); }} />
        <EditPIXModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} pixRecord={editingPix} onSuccess={() => { fetchInitialData(); if(activeTab === 'relatorios') fetchReportData(reportPeriod); }} />
      </Suspense>

      {/* Navigation Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              {onReturn && (
                 <button onClick={onReturn} className="p-2 mr-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                   <ArrowLeft className="w-5 h-5 text-sky-400" />
                 </button>
              )}
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Financeiro
              </h1>
            </div>
            
            <nav className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/50 overflow-x-auto max-w-full">
              {[
                { id: 'adicionar', label: 'Lançamentos', icon: Plus },
                { id: 'pendentes', label: 'Pendentes', icon: Clock },
                { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <button onClick={onLogout} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <AnimatePresence mode="wait">
            
            {/* Lançamentos Tab */}
            {activeTab === 'adicionar' && (
                <motion.div key="add" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                           <div className="p-2 bg-emerald-500/20 rounded-lg"><Plus className="w-5 h-5 text-emerald-400" /></div>
                           Novo Lançamento Manual
                        </h2>
                        
                        <form onSubmit={handleAddPix} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Vincular Lote (Opcional)</label>
                                    <select value={newPix.lote_id} onChange={(e) => handleLoteSelect(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="">Selecione um lote...</option>
                                        {lotes.map(l => (
                                            <option key={l.id} value={l.id}>{l.cliente} - {l.quantidade}un</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Cliente</label>
                                    <input type="text" required value={newPix.cliente} onChange={e => setNewPix({...newPix, cliente: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500" placeholder="Nome do cliente"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Data</label>
                                    <input type="date" required value={newPix.data_registro} onChange={e => setNewPix({...newPix, data_registro: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Valor Recebido (R$)</label>
                                    <input type="number" step="0.01" required value={newPix.valor} onChange={e => setNewPix({...newPix, valor: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-xl font-bold text-white focus:ring-2 focus:ring-emerald-500" placeholder="0.00"/>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Lançamento'}
                            </button>
                        </form>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Lançamentos Recentes</h3>
                            <button onClick={fetchInitialData} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        <div className="space-y-3">
                            {recentTransactions.map((r) => (
                                <div key={r.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">{r.cliente.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p className="font-medium text-white flex items-center gap-2">
                                              {r.cliente}
                                              {r.source === 'lancado' && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">Lançado</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{new Date(r.data_lancamento).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-emerald-400 block">+ R$ {Number(r.valor).toFixed(2)}</span>
                                        <button onClick={() => handleDeletePix(r.id, r.source === 'lancado')} className="text-xs text-red-400 hover:underline">Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Pendentes Tab */}
            {activeTab === 'pendentes' && (
                <motion.div key="pendentes" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                    <PendingPIXManager onRefreshFinance={fetchInitialData} />
                </motion.div>
            )}

            {/* Relatórios Tab */}
            {activeTab === 'relatorios' && (
                <motion.div key="relatorios" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                    <ReportFilters onPeriodChange={handlePeriodChange} />
                    
                    {isReportLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Resumo do Período</h2>
                                <ReportExport transactions={reportTransactions} period={reportPeriod} />
                            </div>
                            
                            <ReportSummaryCards transactions={reportTransactions} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <ReportChart transactions={reportTransactions} />
                                    <TransactionsTable transactions={reportTransactions} />
                                </div>
                                <div className="lg:col-span-1">
                                    <ClientRanking transactions={reportTransactions} />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default FinanceModule;
