
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, LogOut, TrendingUp, FileText, Loader2, Plus, 
  RefreshCw, Calendar, ChevronDown, ChevronUp, Download, 
  BarChart3, PieChart, Wallet, ArrowLeft, Clock, Pencil, Trash2, AlertTriangle, Layers
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import FinancePasswordModal from '@/components/FinancePasswordModal';
import EditPIXModal from '@/components/EditPIXModal';
import PendingPIXManager from '@/components/PendingPIXManager';

// Dynamically import PIX Modal to avoid circular dependency issues if any
const PIXRegistrationModal = React.lazy(() => import('@/components/PIXRegistrationModal'));

const FinanceModule = ({ onLogout, loteData, onReturn }) => {
  const [activeTab, setActiveTab] = useState('adicionar');
  
  // Data States
  const [pixRecords, setPixRecords] = useState([]);
  const [pixLancados, setPixLancados] = useState([]); // New state for pix_lancados
  const [lotes, setLotes] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Specific State for Lote Flow
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Modal States
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

  // Client Detail Expansion State
  const [expandedClient, setExpandedClient] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Entrance from Lote Confirmation
  useEffect(() => {
    if (loteData) {
      // When entering with lote data, trigger the password flow immediately
      setShowPasswordModal(true);
    }
  }, [loteData]);

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
        onReturn(); // If we were in the forced flow, go back
    } else {
        fetchData(); // Refresh if just normal usage
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch PIX Records (Standard/Legacy)
      const { data: records, error: recordsError } = await supabase
        .from('pix_records')
        .select('*')
        .order('data_registro', { ascending: false });
      
      if (recordsError) throw recordsError;
      setPixRecords(records || []);

      // 2. Fetch PIX Lancados (New table from pending conversions)
      const { data: lancados, error: lancadosError } = await supabase
        .from('pix_lancados')
        .select('*')
        .order('data_lancamento', { ascending: false });
        
      if (lancadosError) throw lancadosError;
      setPixLancados(lancados || []);

      // 3. Fetch Lotes (for Dropdown)
      const { data: lotesData, error: lotesError } = await supabase
        .from('lotes')
        .select('*') 
        .order('data_criacao', { ascending: false });

      if (lotesError) throw lotesError;
      setLotes(lotesData || []);

    } catch (error) {
      console.error("FinanceModule: Error fetching data", error);
      toast({
        title: "Erro de conexão",
        description: "Falha ao carregar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleAddPix = async (e) => {
    e.preventDefault();
    if (!newPix.cliente || !newPix.valor) {
        toast({ title: "Campos obrigatórios", description: "Preencha cliente e valor.", variant: "destructive" });
        return;
    }

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
      setNewPix({
        cliente: '',
        valor: '',
        lote_id: '',
        data_registro: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoteSelect = (loteId) => {
    const selected = lotes.find(l => l.id === loteId);
    setNewPix(prev => ({
      ...prev,
      lote_id: loteId,
      cliente: selected ? selected.cliente : prev.cliente
    }));
  };

  const handleDeletePix = async (id, isLancado = false) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro financeiro?")) return;

    try {
      const table = isLancado ? 'pix_lancados' : 'pix_records';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Excluído", description: "Registro removido com sucesso." });
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleEditPix = (record) => {
    setEditingPix(record);
    setShowEditModal(true);
  };

  const onPaymentSuccess = async () => {
     // If paying a pending lote, update its status
     if (selectedLoteForPayment) {
        try {
            await supabase.from('lotes').update({ pago: 'ok' }).eq('id', selectedLoteForPayment.id);
        } catch (e) {
            console.error("Error updating lote status", e);
        }
     }
     handlePixModalClose();
     fetchData();
  };

  // --- REPORT LOGIC & DATA MERGING ---
  
  // Combine records for unified reporting
  const allRecords = useMemo(() => {
    const standard = pixRecords.map(r => ({
      ...r,
      source: 'standard', // from pix_records
      valor: Number(r.valor_recebido),
      data: r.data_registro
    }));
    
    const lancados = pixLancados.map(r => ({
      ...r,
      source: 'lancado', // from pix_lancados
      valor: Number(r.valor),
      valor_recebido: Number(r.valor), // normalize for existing report logic
      data: r.data_lancamento,
      data_registro: r.data_lancamento // normalize
    }));
    
    return [...standard, ...lancados].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [pixRecords, pixLancados]);

  const getFilteredRecords = (days) => {
    if (days === 'all') return allRecords;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allRecords.filter(r => new Date(r.data_registro) >= cutoff);
  };

  const generateReport = (days) => {
    const records = getFilteredRecords(days);
    const totalReceived = records.reduce((acc, r) => acc + (r.valor || 0), 0);
    
    const clientMap = {};
    records.forEach(r => {
      if (!clientMap[r.cliente]) {
        clientMap[r.cliente] = {
          cliente: r.cliente,
          total: 0,
          count: 0,
          transactions: []
        };
      }
      clientMap[r.cliente].total += Number(r.valor);
      clientMap[r.cliente].count += 1;
      clientMap[r.cliente].transactions.push(r);
    });

    const ranking = Object.values(clientMap).sort((a, b) => b.total - a.total);
    
    return { totalReceived, ranking, count: records.length, records };
  };

  const downloadCSV = (reportData, periodName) => {
    const headers = ["Cliente", "Total Recebido", "Qtd Transações"];
    const rows = reportData.ranking.map(c => [
        `"${c.cliente}"`, 
        c.total.toFixed(2), 
        c.count
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${periodName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const total = allRecords.reduce((acc, r) => acc + (r.valor || 0), 0);
    
    // Current period calculation based on active tab
    let periodDays = 7;
    if (activeTab === 'mensal') periodDays = 30;
    if (activeTab === 'anual') periodDays = 365;
    
    const currentPeriodRecords = getFilteredRecords(periodDays);
    const currentPeriodTotal = currentPeriodRecords.reduce((acc, r) => acc + (r.valor || 0), 0);
    
    return {
      totalGeral: total,
      periodoAtual: currentPeriodTotal,
      lastTransactions: allRecords.slice(0, 5)
    };
  }, [allRecords, activeTab]);

  const activeReport = useMemo(() => {
    switch(activeTab) {
      case 'semanal': return generateReport(7);
      case 'mensal': return generateReport(30);
      case 'anual': return generateReport(365);
      default: return null;
    }
  }, [activeTab, allRecords]);

  // --- RENDER HELPERS ---

  const renderRankingTable = (report, periodName) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Ranking de Clientes ({periodName})</h3>
          <p className="text-slate-400 text-sm">Top clientes por volume financeiro</p>
        </div>
        <button 
          onClick={() => downloadCSV(report, periodName)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-400 font-medium transition-colors border border-slate-700"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-center">Transações</th>
              <th className="px-6 py-4 text-right">Total (R$)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {report.ranking.map((client, index) => (
              <React.Fragment key={client.cliente}>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono">#{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-white">{client.cliente}</td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    <span className="inline-block bg-slate-800 px-2 py-1 rounded text-xs">
                      {client.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    {client.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setExpandedClient(expandedClient === client.cliente ? null : client.cliente)}
                      className="text-slate-500 hover:text-sky-400 transition-colors"
                    >
                      {expandedClient === client.cliente ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
                {expandedClient === client.cliente && (
                  <tr className="bg-slate-900/80">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-400 mb-3">Histórico de Transações - {client.cliente}</h4>
                        <div className="space-y-2">
                          {client.transactions.map((t, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2 last:border-0 last:pb-0 px-2 hover:bg-slate-900/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-4 py-2">
                                    <span className="text-slate-300 w-24">{new Date(t.data_registro).toLocaleDateString()}</span>
                                    <span className="text-emerald-500 font-medium font-mono">
                                    {Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    {t.source === 'lancado' && (
                                      <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">
                                        Lançado
                                      </span>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                    {t.source !== 'lancado' && (
                                        <button 
                                            onClick={() => handleEditPix(t)}
                                            className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDeletePix(t.id, t.source === 'lancado')}
                                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {report.ranking.length === 0 && (
                <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        Nenhum registro encontrado neste período.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-12">
      <Suspense fallback={null}>
        <FinancePasswordModal 
          isOpen={showPasswordModal}
          onClose={handlePasswordClose}
          onSuccess={handlePasswordSuccess}
        />
        <PIXRegistrationModal
          isOpen={showPixModal}
          onClose={handlePixModalClose}
          lote={selectedLoteForPayment}
          onSuccess={onPaymentSuccess}
        />
        <EditPIXModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          pixRecord={editingPix}
          onSuccess={fetchData}
        />
      </Suspense>

      {/* Top Navigation Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              {onReturn ? (
                 <button 
                   onClick={onReturn}
                   className="p-2 mr-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                   title="Voltar aos Lotes"
                 >
                   <ArrowLeft className="w-5 h-5 text-sky-400" />
                 </button>
              ) : null}
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
                { id: 'semanal', label: 'Relatório Semanal', icon: BarChart3 },
                { id: 'mensal', label: 'Relatório Mensal', icon: Calendar },
                { id: 'anual', label: 'Relatório Anual', icon: PieChart },
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

            <button 
              onClick={onLogout}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-24 h-24 text-emerald-500" />
            </div>
            <p className="text-slate-400 font-medium mb-1">Total Geral (Recebido)</p>
            <h2 className="text-4xl font-bold text-emerald-400">
              {stats.totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500/80">
              <TrendingUp className="w-4 h-4" /> <span>Acumulado histórico</span>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
            <p className="text-slate-400 font-medium mb-1">
              {['adicionar', 'pendentes'].includes(activeTab) ? 'Registros Totais' : `Período Atual (${activeTab})`}
            </p>
            <h2 className="text-4xl font-bold text-sky-400">
                {['adicionar', 'pendentes'].includes(activeTab) 
                    ? allRecords.length 
                    : stats.periodoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            </h2>
            <p className="mt-4 text-sm text-slate-500">
                {['adicionar', 'pendentes'].includes(activeTab) ? 'transações registradas' : 'arrecadado no período'}
            </p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
               <RefreshCw className="w-4 h-4 text-indigo-400" /> Últimas Transações
             </h3>
             <div className="space-y-3">
               {stats.lastTransactions.map((t, i) => (
                 <div key={i} className="flex justify-between items-center text-sm">
                   <span className="text-slate-300 truncate max-w-[120px]">{t.cliente}</span>
                   <span className="text-emerald-500 font-mono">
                     +{Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                   </span>
                 </div>
               ))}
               {stats.lastTransactions.length === 0 && <p className="text-slate-500 text-sm">Sem registros recentes.</p>}
             </div>
          </motion.div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
            
            {/* ADICIONAR PIX TAB */}
            {activeTab === 'adicionar' && (
                <motion.div 
                    key="add"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                           <div className="p-2 bg-emerald-500/20 rounded-lg"><Plus className="w-5 h-5 text-emerald-400" /></div>
                           Novo Lançamento Manual
                        </h2>
                        
                        <form onSubmit={handleAddPix} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Vincular Lote (Opcional)</label>
                                    <div className="relative">
                                        <select 
                                            value={newPix.lote_id}
                                            onChange={(e) => handleLoteSelect(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        >
                                            <option value="">Selecione um lote...</option>
                                            {lotes.map(l => (
                                                <option key={l.id} value={l.id}>{l.cliente} - {l.quantidade}un ({l.cor})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPix.cliente}
                                        onChange={e => setNewPix({...newPix, cliente: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Nome do cliente"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={newPix.data_registro}
                                        onChange={e => setNewPix({...newPix, data_registro: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Valor Recebido (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={newPix.valor}
                                            onChange={e => setNewPix({...newPix, valor: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Lançamento'}
                            </button>
                        </form>
                    </div>
                    
                    {/* Recent List (Combined standard + lancados) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Lançamentos Recentes</h3>
                            <button onClick={fetchData} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        <div className="space-y-3">
                            {allRecords.slice(0, 8).map((r) => (
                                <div key={r.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                                            {r.cliente.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white flex items-center gap-2">
                                              {r.cliente}
                                              {r.source === 'lancado' && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold tracking-wider">Lançado</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{new Date(r.data_registro || r.data_lancamento).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-emerald-400 block">+ R$ {Number(r.valor).toFixed(2)}</span>
                                        <button onClick={() => handleDeletePix(r.id, r.source === 'lancado')} className="text-xs text-red-400 hover:underline opacity-50 hover:opacity-100">Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* PENDENTES TAB */}
            {activeTab === 'pendentes' && (
                <motion.div
                    key="pendentes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800"
                >
                    <PendingPIXManager onRefreshFinance={fetchData} />
                </motion.div>
            )}

            {/* RELATÓRIOS TABS */}
            {['semanal', 'mensal', 'anual'].includes(activeTab) && activeReport && (
                <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <div className="bg-slate-900/30 p-1 rounded-2xl">
                        {renderRankingTable(activeReport, activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default FinanceModule;
