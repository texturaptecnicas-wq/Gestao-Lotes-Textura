import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { buildStatusUpdates, isPickupPending } from '@/utils/paintedPending';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import { Package, Plus, Search, QrCode, Truck, Building, CalendarCheck, CheckCircle, LogOut, DollarSign, Ruler, FileText, FilterX, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { createFinancialRecord } from '@/services/financeService';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import LoteCard from '@/components/LoteCard';
import { cleanupStorage } from '@/utils/cleanupStorage';
import { todayISO, firstDayOfMonthISO } from '@/utils/dateUtils';

// Lazy loaded components
const AddLoteModal = React.lazy(() => import('@/components/AddLoteModal'));
const HistoricoModal = React.lazy(() => import('@/components/HistoricoModal'));
const QRScannerModal = React.lazy(() => import('@/components/QRScannerModal'));
const LoginScreen = React.lazy(() => import('@/components/LoginScreen'));
const FinanceLogin = React.lazy(() => import('@/components/FinanceLogin'));
import ComercialLogin from '@/components/ComercialLogin';
const FinanceModal = React.lazy(() => import('@/components/FinanceModal'));
const FinanceModule = React.lazy(() => import('@/components/FinanceModule'));
const CabineSelectModal = React.lazy(() => import('@/components/CabineSelectModal'));
const QualityModal = React.lazy(() => import('@/components/QualityModal'));
const PixLancamentoPage = React.lazy(() => import('@/pages/PixLancamentoPage'));
const ProgramacaoModule = React.lazy(() => import('@/components/ProgramacaoModule'));
const ProgramarLoteModal = React.lazy(() => import('@/components/ProgramarLoteModal'));

const LoadingFallback = () => (
  <div className="fixed inset-0 bg-slate-900 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div className="flex flex-col items-center gap-3">
       <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
       <div className="text-white font-semibold animate-pulse">Carregando...</div>
    </div>
  </div>
);

function LotesManager() {
  const [lotes, setLotes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [lotesError, setLotesError] = useState('');
  const [showOnlyPickupPending, setShowOnlyPickupPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const statusLocks = useRef(new Set());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCabineModalOpen, setIsCabineModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [loteToProgram, setLoteToProgram] = useState(null);
  const [editingLote, setEditingLote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('recebido');
  const [statusFilters, setStatusFilters] = useState({ pago: 'any', medida: 'any', nota_fiscal: 'any' });
  const [cabineFilter, setCabineFilter] = useState('1');
  const [isProgramarModalOpen, setIsProgramarModalOpen] = useState(false);
  const [loteToProgramar, setLoteToProgramar] = useState(null);
  const [programacaoHojeCount, setProgramacaoHojeCount] = useState(0);
  
  // App Navigation State
  const [activeModule, setActiveModule] = useState('lotes'); 

  // Auth State
  const [userRole, setUserRole] = useState(null);
  const [loginType, setLoginType] = useState(null);
  const [showFinanceLogin, setShowFinanceLogin] = useState(false);
  const [showComercialLogin, setShowComercialLogin] = useState(false);
  const [financeIntegration, setFinanceIntegration] = useState({ isOpen: false, lote: null });


  // Initial Auth Check & Cleanup
  useEffect(() => {
    cleanupStorage(); // Clean up unused storage keys
    
    const storedRole = localStorage.getItem('userRole');
    const storedType = localStorage.getItem('loginType');
    
    if (storedRole) {
      setUserRole(storedRole);
      setLoginType(storedType || 'usuario');
      if (storedType === 'financeiro') setActiveModule('financeiro');
    }
  }, []);

  // Data Fetching
  const fetchLotes = useCallback(async () => {
    const { data, error } = await supabase.from('lotes').select('*').order('data_criacao', { ascending: true });
    if (error) {
      setLotesError('Não foi possível atualizar os lotes. Os últimos dados disponíveis foram mantidos.');
      toast({ title: "Erro ao buscar lotes", description: error.message, variant: "destructive" });
    } else {
      setLotesError('');
      setLotes(data || []);
    }
    setLoadingLotes(false);
  }, []);

  const fetchHistorico = useCallback(async () => {
    setHistoricoLoading(true);
    const records = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('historico').select('*').order('data_entrega', { ascending: false }).order('id').range(offset, offset + 999);
      if (error) {
        toast({ title: 'Erro ao buscar histórico', description: error.message, variant: 'destructive' });
        setHistoricoLoading(false);
        return;
      }
      records.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    setHistorico(records);
    setHistoricoLoading(false);
  }, []);

  // Subscriptions & Data Load triggers
  useEffect(() => {
    if (!userRole || activeModule === 'financeiro') return;
    
    fetchLotes();
    
    // Realtime: apply the payload directly to local state instead of re-fetching
    // every lot on each change, so status updates sync instantly across devices.
    const lotesSubscription = supabase.channel('public:lotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes' }, (payload) => {
        setLotes(prev => {
          if (payload.eventType === 'DELETE') {
            return prev.filter(l => l.id !== payload.old.id);
          }
          const newRow = payload.new;
          if (!newRow) return prev;
          const idx = prev.findIndex(l => l.id === newRow.id);
          if (idx === -1) return [newRow, ...prev];
          const next = prev.slice();
          next[idx] = newRow;
          return next;
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(lotesSubscription);
    };
  }, [userRole, activeModule, fetchLotes]);

  // Histórico is heavy: load it lazily only when the modal opens, and refresh
  // it via realtime while the modal is open instead of keeping it always loaded.
  useEffect(() => {
    if (!isHistoricoOpen) return;
    fetchHistorico();
  }, [isHistoricoOpen, fetchHistorico]);

  useEffect(() => {
    if (!isHistoricoOpen) return;
    // Realtime: apply the payload directly to local state instead of re-fetching
    // every delivered lote on each change, so the Entregues tab stays light.
    const historicoSubscription = supabase.channel('public:historico')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico' }, (payload) => {
        setHistorico(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(h => h.id !== payload.old.id);
          const newRow = payload.new;
          if (!newRow) return prev;
          const idx = prev.findIndex(h => h.id === newRow.id);
          if (idx === -1) return [newRow, ...prev];
          const next = prev.slice();
          next[idx] = newRow;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(historicoSubscription);
  }, [isHistoricoOpen]);

  // Free memory when the Entregues tab closes so the app stays light afterwards.
  useEffect(() => {
    if (isHistoricoOpen) return;
    setHistorico([]);
  }, [isHistoricoOpen]);

  // Contagem de programação ativa do dia (badge da aba Programação).
  // Atualizada por assinatura em tempo real da tabela programacao, sem depender
  // de recarregar lotes a cada mudança.
  useEffect(() => {
    if (!userRole || activeModule === 'financeiro') return;
    const loadCount = async () => {
      const today = todayISO();
      const { data } = await supabase
        .from('programacao')
        .select('cliente')
        .eq('data', today)
        .eq('ativo', true);
      if (!data) { setProgramacaoHojeCount(0); return; }
      const unique = new Set(data.map(r => (r.cliente || '').trim().toLowerCase()).filter(Boolean));
      setProgramacaoHojeCount(unique.size);
    };
    loadCount();
    const channel = supabase.channel('programacao-count-today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programacao' }, loadCount)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userRole, activeModule]);

  // Retenção mensal: ao iniciar um novo mês, apaga programações de meses
  // anteriores para liberar espaço. Seguro — afeta apenas a tabela programacao,
  // nunca os lotes. Executado uma vez por mês por navegador.
  useEffect(() => {
    if (!userRole) return;
    const currentMonth = todayISO().slice(0, 7);
    if (localStorage.getItem('programacao_cleanup_month') === currentMonth) return;
    const firstDay = firstDayOfMonthISO();
    supabase.from('programacao').delete().lt('data', firstDay).then(({ error }) => {
      if (!error) localStorage.setItem('programacao_cleanup_month', currentMonth);
    });
  }, [userRole]);
  
  // Handlers
  const handleLogin = useCallback((role) => {
    if (role === 'financeiro') {
      setShowFinanceLogin(true);
      return;
    }
    if (role === 'comercial') {
      setShowComercialLogin(true);
      return;
    }
    localStorage.setItem('userRole', role);
    localStorage.setItem('loginType', role === 'administrador' ? 'admin' : 'usuario');
    setUserRole(role);
    setLoginType(role === 'administrador' ? 'admin' : 'usuario');
    setActiveModule('lotes');
  }, []);

  const handleComercialLogin = useCallback(() => {
    localStorage.setItem('userRole', 'comercial');
    localStorage.setItem('loginType', 'comercial');
    setUserRole('comercial');
    setLoginType('comercial');
    setShowComercialLogin(false);
    setActiveModule('lotes');
  }, []);

  const handleFinanceLogin = useCallback((type) => {
    const roleType = type || 'financeiro';
    localStorage.setItem('userRole', roleType);
    localStorage.setItem('loginType', roleType);
    setUserRole(roleType);
    setLoginType(roleType);
    setShowFinanceLogin(false);
    setActiveModule('financeiro');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginType');
    setUserRole(null);
    setLoginType(null);
    setShowFinanceLogin(false);
    setShowComercialLogin(false);
    setFinanceIntegration({ isOpen: false, lote: null });
    setActiveModule('lotes');
  }, []);

  // Integração Comercial <-> Financeiro: ao marcar um lote como pago, abre o
  // formulário "Novo lançamento" sem sair do módulo de lotes. O vínculo com o
  // lote é registrado em `observacoes` (Ref. Lote: <id>) e usado para evitar
  // lançamentos duplicados para o mesmo lote.
  const handleOpenFinanceIntegration = useCallback(async (lote) => {
    if (!lote?.id) return;
    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .ilike('observacoes', `%Ref. Lote: ${lote.id}%`)
      .neq('status', 'cancelado')
      .maybeSingle();
    if (existing) {
      toast({ title: 'Lançamento já existe', description: 'Já existe um lançamento financeiro vinculado a este lote.', variant: 'destructive' });
      return;
    }
    setFinanceIntegration({ isOpen: true, lote });
  }, []);

  const handleSaveFinanceIntegration = useCallback(async (data) => {
    const lote = financeIntegration?.lote;
    const observacoes = [
      data.observacoes?.trim(),
      `Ref. Lote: ${lote?.id || ''}`,
    ].filter(Boolean).join(' · ');
    await createFinancialRecord({ ...data, observacoes });
    toast({ title: 'Lançamento criado!', description: 'Registro financeiro vinculado ao lote.' });
    setFinanceIntegration({ isOpen: false, lote: null });
  }, [financeIntegration]);

  const financeIntegrationInitialData = useMemo(() => {
    const lote = financeIntegration.lote;
    if (!lote) return {};
    return {
      descricao: lote.cliente,
      tipo: 'entrada',
      valor: '',
      data_lancamento: new Date().toISOString().split('T')[0],
      categoria: 'PIX',
      status: 'confirmado',
      observacoes: `Lote: ${lote.cor || ''}${lote.quantidade ? ` · ${lote.quantidade} peças` : ''}`.trim(),
    };
  }, [financeIntegration.lote]);

  const handleOpenAddModal = useCallback(() => { setEditingLote(null); setIsAddModalOpen(true); }, []);
  const handleOpenEditModal = useCallback((loteToEdit) => { setEditingLote(loteToEdit); setIsAddModalOpen(true); }, []);

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
      const original = editingLote;
      if (!original || original.id !== id) return false;
      const { data, error } = await supabase.from('lotes').update(dataToSave).eq('id', id).eq('updated_at', original.updated_at).select('id').maybeSingle();
      if (error || !data) {
        toast({ title: 'Alterações não salvas', description: error?.message || 'Este lote foi alterado por outra pessoa. Reabra a edição após atualizar a lista.', variant: 'destructive' });
        await fetchLotes();
        return false;
      }
      toast({ title: 'Lote atualizado!', description: `O lote de ${loteData.cliente} foi modificado.` });
    } else {
       const newLote = { ...dataToSave, pago: 'unanalysed', medida: 'unanalysed', nota_fiscal: 'unanalysed', programado: false, pintado: false, promessa: false, data_criacao: new Date().toISOString() };
      const { data, error } = await supabase.from('lotes').insert(newLote).select('id').single();
      if (error || !data) { toast({ title: 'Erro ao adicionar', description: error?.message || 'Gravação não confirmada.', variant: 'destructive' }); return false; }
      toast({ title: 'Lote registrado!', description: `Lote de ${loteData.cliente} adicionado.` });
    }
    await fetchLotes();
    setEditingLote(null);
    return true;
  }, [editingLote, fetchLotes]);

  const handleUpdateLoteStatus = useCallback(async (id, updates) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (!loteOriginal || statusLocks.current.has(id)) return false;
    let finalUpdates = buildStatusUpdates(loteOriginal, updates);
    if (finalUpdates.programado === true && !finalUpdates.cabine) { setLoteToProgram(id); setIsCabineModalOpen(true); return false; }
    if (finalUpdates.programado === false && loteOriginal.programado) { finalUpdates = { ...finalUpdates, promessa: false, programado: false, cabine: null, ordem_pintura: null }; }
    statusLocks.current.add(id);
    try {
      const { data, error } = await supabase.from('lotes').update(finalUpdates).eq('id', id).eq('updated_at', loteOriginal.updated_at).select('*').maybeSingle();
      if (error || !data) {
        toast({ title: 'Status não salvo', description: error?.message || 'O lote foi alterado em outro dispositivo. Confira os dados atualizados e tente novamente.', variant: 'destructive' });
        await fetchLotes();
        return false;
      }
      setLotes(previous => previous.map(lote => lote.id === id ? data : lote));
      // Pintar via card mantém a entrada de programação do dia (destaque verde).
      toast({ title: 'Status atualizado!', description: 'Gravação confirmada.' });
      return true;
    } catch {
      toast({ title: 'Gravação não confirmada', description: 'Verifique sua conexão e atualize a lista antes de tentar novamente.', variant: 'destructive' });
      return false;
    } finally { statusLocks.current.delete(id); }
  }, [lotes, fetchLotes]);

  const handleSetCabine = async (loteId, cabine) => {
    const saved = await handleUpdateLoteStatus(loteId, { programado: true, cabine });
    if (saved) {
      setIsCabineModalOpen(false);
      setLoteToProgram(null);
    }
    return saved;
  };

  const handleProgramarLote = useCallback(async (lote, { data, cabine, cor, mode = 'join', targetOrdemCor = null }) => {
    const cabineNum = Number(cabine);
    const corTrim = (cor || '').trim();
    if (!corTrim) { toast({ title: 'Cor obrigatória', variant: 'destructive' }); return false; }
    // Normaliza a cor para comparar ignorando maiúsculas/minúsculas e espaços
    // extras, de modo que um novo cliente entre no grupo da cor já existente
    // (ex: "preto tx" == "Preto TX") em vez de criar um subconjunto separado.
    const normCor = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const corNorm = normCor(corTrim);
    const { data: existing, error: fetchErr } = await supabase
      .from('programacao')
      .select('cor, ordem_cor, ordem_cliente, cliente')
      .eq('data', data)
      .eq('cabine', cabineNum);
    if (fetchErr) { toast({ title: 'Erro ao programar', description: fetchErr.message, variant: 'destructive' }); return false; }
    const rows = existing || [];
    const sameColor = rows.filter(r => normCor(r.cor) === corNorm);
    // Usa a forma canônica já armazenada da cor quando ela existe, garantindo
    // agrupamento consistente no quadro de programação.
    const canonicalCor = sameColor.length > 0 ? sameColor[0].cor : corTrim;
    let ordem_cor; let ordem_cliente;
    if (mode === 'sequence') {
      // "Seguir sequência": ignora subconjuntos existentes dessa cor e cria um
      // novo subconjunto no final da sequência da cabine.
      ordem_cor = (rows.reduce((m, r) => Math.max(m, r.ordem_cor), -1)) + 1;
      ordem_cliente = 0;
    } else if (targetOrdemCor !== null && targetOrdemCor !== undefined) {
      // Entrar em um subconjunto específico escolhido manualmente.
      const subsetRows = sameColor.filter(r => r.ordem_cor === targetOrdemCor);
      const targetRows = subsetRows.length > 0 ? subsetRows : sameColor;
      ordem_cor = targetRows[0].ordem_cor;
      const sameClient = targetRows.filter(r => r.cliente === lote.cliente);
      if (sameClient.length > 0) {
        ordem_cliente = sameClient[0].ordem_cliente;
      } else {
        ordem_cliente = (targetRows.reduce((m, r) => Math.max(m, r.ordem_cliente), -1)) + 1;
      }
    } else if (sameColor.length > 0) {
      // Comportamento padrão: agrupa no subconjunto existente da cor.
      ordem_cor = sameColor[0].ordem_cor;
      const sameClient = sameColor.filter(r => r.cliente === lote.cliente);
      if (sameClient.length > 0) {
        ordem_cliente = sameClient[0].ordem_cliente;
      } else {
        ordem_cliente = (rows.reduce((m, r) => Math.max(m, r.ordem_cliente), -1)) + 1;
      }
    } else {
      ordem_cor = (rows.reduce((m, r) => Math.max(m, r.ordem_cor), -1)) + 1;
      ordem_cliente = 0;
    }
    const { error: insertErr } = await supabase.from('programacao').insert({
      data, lote_id: lote.id, cabine: cabineNum, cor: canonicalCor, ordem_cor, ordem_cliente, cliente: lote.cliente, ativo: true,
    });
    if (insertErr) {
      if (insertErr.code === '23505') toast({ title: 'Lote já programado', description: 'Este lote já está programado nesta data.', variant: 'destructive' });
      else toast({ title: 'Erro ao programar', description: insertErr.message, variant: 'destructive' });
      return false;
    }
    // Marca o lote como programado para que saia da área de Recebidos.
    await supabase.from('lotes').update({ programado: true, cabine: cabineNum, updated_at: new Date().toISOString() }).eq('id', lote.id);
    toast({ title: 'Lote programado!', description: `${lote.cliente} → Cabine ${cabineNum} · ${corTrim}` });
    await fetchLotes();
    return true;
  }, [fetchLotes]);

  const handleOpenProgramar = useCallback((lote) => {
    setLoteToProgramar(lote);
    setIsProgramarModalOpen(true);
  }, []);

  const handlePaintFromProgramacao = useCallback(async (loteId) => {
    const loteOriginal = lotes.find(l => l.id === loteId);
    if (!loteOriginal) { toast({ title: 'Lote não encontrado', variant: 'destructive' }); return false; }
    const nowIso = new Date().toISOString();
    const updates = { pintado: true, programado: false, data_pintura: nowIso, updated_at: nowIso };
    const { data, error } = await supabase.from('lotes').update(updates).eq('id', loteId).eq('updated_at', loteOriginal.updated_at).select('*').maybeSingle();
    if (error || !data) {
      toast({ title: 'Pintura não confirmada', description: error?.message || 'O lote foi alterado em outro dispositivo. Atualize e tente novamente.', variant: 'destructive' });
      await fetchLotes();
      return false;
    }
    setLotes(prev => prev.map(l => l.id === loteId ? data : l));
    // A entrada de programação NÃO é desativada: ela permanece como registro
    // do dia e o cliente é destacado em verde no quadro de programação.
    toast({ title: 'Lote pintado!', description: `${loteOriginal.cliente} movido para Pintados.` });
    return true;
  }, [lotes, fetchLotes]);

  const handleRemoveFromProgramacao = useCallback(async (loteId) => {
    const loteOriginal = lotes.find(l => l.id === loteId);
    if (!loteOriginal) { toast({ title: 'Lote não encontrado', variant: 'destructive' }); return false; }
    const nowIso = new Date().toISOString();
    const updates = { programado: false, cabine: null, ordem_pintura: null, updated_at: nowIso };
    const { data, error } = await supabase.from('lotes').update(updates).eq('id', loteId).eq('updated_at', loteOriginal.updated_at).select('*').maybeSingle();
    if (error || !data) {
      toast({ title: 'Remoção não confirmada', description: error?.message || 'O lote foi alterado em outro dispositivo. Atualize e tente novamente.', variant: 'destructive' });
      await fetchLotes();
      return false;
    }
    setLotes(prev => prev.map(l => l.id === loteId ? data : l));
    await supabase.from('programacao').delete().eq('lote_id', loteId).eq('ativo', true);
    toast({ title: 'Removido da programação', description: `${loteOriginal.cliente} voltou para Recebidos.` });
    return true;
  }, [lotes, fetchLotes]);

  const handleMarcarPintadoPorQR = useCallback(async (id) => {
    const loteOriginal = lotes.find(l => l.id === id);
    if (!loteOriginal) return;
    if (loteOriginal.pintado) { toast({ title: "ℹ️ Status inalterado", description: "Este lote já estava pintado." }); return; }
    return handleUpdateLoteStatus(id, { pintado: true, programado: false });
  }, [lotes, handleUpdateLoteStatus]);

  const handleMarcarEntregue = useCallback(async (id) => {
    const loteToMove = lotes.find(l => l.id === id);
    if (!loteToMove) return;
    if (!(loteToMove.pago === 'ok' && loteToMove.medida === 'ok' && loteToMove.pintado)) { toast({ title: "⚠️ Ação bloqueada", description: "Status 'Pago', 'Medida' e 'Pintado' devem estar OK.", variant: "destructive" }); return; }
    const loteEntregue = { ...loteToMove, data_entrega: new Date().toISOString() };
    const { data: archived, error: insertError } = await supabase.from('historico').insert(loteEntregue).select('id').single();
    if (insertError || !archived) { toast({ title: 'Entrega não confirmada', description: insertError?.message || 'O histórico não confirmou a gravação.', variant: 'destructive' }); return false; }
    // Preserve the existing archive workflow, but never remove a concurrently changed lot.
    const { data: removed, error: deleteError } = await supabase.from('lotes').delete().eq('id', id).eq('updated_at', loteToMove.updated_at).select('id').maybeSingle();
    if (deleteError || !removed) { toast({ title: 'Entrega requer conferência', description: 'O histórico foi salvo, mas o lote ativo não foi removido. Não repita a entrega; confira os registros antes de continuar.', variant: 'destructive' }); }
    else { toast({ title: 'Lote entregue!', description: `Lote de ${loteToMove.cliente} movido para o histórico com o mesmo ID.` }); }
    await fetchLotes();
    return !deleteError && !!removed;
  }, [lotes, fetchLotes]);

  const handleDeleteLote = useCallback(async (id) => {
    if (userRole !== 'administrador' && userRole !== 'comercial') { toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para excluir.", variant: "destructive" }); return; }
    const loteToDelete = lotes.find(l => l.id === id);
    if (loteToDelete?.foto) { await supabase.storage.from('fotos-lotes').remove([loteToDelete.foto]); }
    const { error } = await supabase.from('lotes').delete().eq('id', id);
    if (error) { toast({ title: "❌ Erro ao remover", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "🗑️ Lote removido", description: "Lote excluído com sucesso." }); }
  }, [userRole, lotes]);

  const handleDeleteHistoricoLote = useCallback(async (id) => {
    if (userRole !== 'administrador' && userRole !== 'comercial') { toast({ title: "🚫 Acesso Negado", description: "Permissão para excluir do histórico negada.", variant: "destructive" }); return; }
    const loteToDelete = historico.find(l => l.id === id);
    if (loteToDelete?.foto) { await supabase.storage.from('fotos-lotes').remove([loteToDelete.foto]); }
    const { error } = await supabase.from('historico').delete().eq('id', id);
    if (error) { toast({ title: "❌ Erro ao remover", description: error.message, variant: "destructive" }); } 
    else { setHistorico(prev => prev.filter(h => h.id !== id)); toast({ title: "🗑️ Lote removido do histórico", description: "Lote excluído." }); }
  }, [userRole, historico]);

  const resetAllFilters = useCallback(() => { setSearchTerm(''); setStatusFilters({ pago: 'any', medida: 'any', nota_fiscal: 'any' }); setShowOnlyPickupPending(false); }, []);
  
  const handleFilterChange = useCallback((newFilter) => { 
    setFilterStatus(newFilter);
    setShowOnlyPickupPending(false);
    if (newFilter === 'programado') { 
      setCabineFilter('1'); 
    }
    window.scrollTo(0, 0); 
  }, []);
  
  const handleStatusFilterChange = useCallback((filterName, value) => { setStatusFilters(prev => ({...prev, [filterName]: value})); window.scrollTo(0, 0); }, []);

  const handleDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (searchTerm || Object.values(statusFilters).some(value => value !== 'any')) {
      toast({ title: 'Limpe os filtros para reordenar', description: 'A ordem deve considerar todos os lotes da cabine.', variant: 'destructive' });
      return;
    }
    const cabine = parseInt(source.droppableId.split('-')[1]);
    const lotesNaCabine = [...filteredLotes.programado].filter(l => l.cabine === cabine).sort((a, b) => (a.ordem_pintura ?? 999) - (b.ordem_pintura ?? 999));
    const [reorderedItem] = lotesNaCabine.splice(source.index, 1);
    lotesNaCabine.splice(destination.index, 0, reorderedItem);
    // No upsert: reordering must never create or replace a lot.
    for (const [index, lote] of lotesNaCabine.entries()) {
      const { data, error } = await supabase.from('lotes').update({ ordem_pintura: index, updated_at: new Date().toISOString() }).eq('id', lote.id).eq('updated_at', lote.updated_at).select('id').maybeSingle();
      if (error || !data) {
        toast({ title: 'Ordenação interrompida', description: 'Houve uma falha ou edição simultânea. Parte da ordem pode ter sido salva; confira a lista atualizada antes de tentar novamente.', variant: 'destructive' });
        await fetchLotes();
        return;
      }
    }
    toast({ title: 'Ordem salva!', description: 'Gravações confirmadas para todos os lotes.' });
    await fetchLotes();
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
    const pintado = lotes.filter(l => l.pintado && applyFilters(l) && (!showOnlyPickupPending || isPickupPending(l, now)));
    
    let programado = cabineFilter === 'all' ? programadoRaw : programadoRaw.filter(l => l.cabine === parseInt(cabineFilter));

    return { recebido, programado, pintado };
  }, [lotes, searchTerm, statusFilters, cabineFilter, showOnlyPickupPending, now]);

  const stats = useMemo(() => ({
    total: lotes.length,
    recebido: lotes.filter(l => !l.programado && !l.pintado).length,
    programado: lotes.filter(l => l.programado && !l.pintado).length,
    pintado: lotes.filter(l => l.pintado).length,
  }), [lotes]);

  const pickupPendingCount = lotes.filter(lote => isPickupPending(lote, now)).length;

  const filterOptions = [
    { id: 'recebido', label: 'Recebidos', icon: Building, count: stats.recebido },
    { id: 'programado', label: 'Programação', icon: CalendarCheck, count: programacaoHojeCount },
    { id: 'pintado', label: 'Pintados', icon: CheckCircle, count: stats.pintado },
  ];

  // Auth/Login Screens handling
  if (!userRole) {
    if (showFinanceLogin) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FinanceLogin onLogin={handleFinanceLogin} onBack={() => setShowFinanceLogin(false)} />
        </Suspense>
      );
    }
    if (showComercialLogin) {
      return (
        <ComercialLogin onLogin={handleComercialLogin} onBack={() => setShowComercialLogin(false)} />
      );
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Pure Finance User View
  if (loginType === 'financeiro' && activeModule === 'financeiro') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FinanceModule onBack={handleLogout} />
      </Suspense>
    );
  }

  const currentLotes = filteredLotes[filterStatus] || [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Helmet>
        <title>Sistema de Gestão - Textura Técnicas</title>
        <meta name="description" content="Sistema integrado para gestão de lotes e qualidade." />
      </Helmet>

      <div className="min-h-screen">
        
        {/* Render Finance Module if selected by Admin */}
        {activeModule === 'financeiro' && userRole === 'administrador' && (
          <Suspense fallback={<LoadingFallback />}>
             <FinanceModule onBack={() => setActiveModule('lotes')} />
          </Suspense>
        )}

        {/* Render Lotes Module */}
        {activeModule === 'lotes' && (
          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h1 className="text-4xl md:text-5xl font-bold gradient-text">Gestão de Lotes</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="hidden sm:inline text-sm font-semibold glass-effect px-3 py-2 rounded-lg">{userRole === 'administrador' ? '👑 Admin' : userRole === 'comercial' ? '💼 Comercial' : '👤 Usuário'}</span>
                    
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsQualityModalOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 text-amber-400 border border-amber-500/30">
                      <ShieldAlert className="w-5 h-5" />
                      <span className="hidden sm:inline">Qualidade</span>
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsQRScannerOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60">
                      <QrCode className="w-5 h-5 text-sky-300" />
                      <span className="hidden lg:inline">Escanear</span>
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsHistoricoOpen(true)} className="glass-effect px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60">
                      <Truck className="w-5 h-5 text-sky-300" />
                      <span className="hidden lg:inline">Entregues</span>
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30">
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Novo</span>
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="glass-effect p-3 rounded-xl hover:bg-red-500/20" aria-label="Sair">
                      <LogOut className="w-5 h-5 text-red-400" />
                    </motion.button>
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

                {filterStatus === 'pintado' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button onClick={() => setShowOnlyPickupPending(value => !value)} aria-pressed={showOnlyPickupPending} className={`px-4 py-3 rounded-xl text-sm font-semibold border ${showOnlyPickupPending ? 'bg-amber-500/20 text-amber-200 border-amber-400' : 'glass-effect text-amber-300'}`}>
                      Retirada pendente há 7 dias ou mais: {pickupPendingCount}{showOnlyPickupPending ? ' · Mostrar todos' : ''}
                    </button>
                    <span className="text-xs text-slate-300">7 períodos de 24 horas desde a pintura · Horários: São Paulo</span>
                  </div>
                )}

              </motion.header>
              
              {lotesError && <div role="alert" className="glass-effect rounded-xl p-4 mb-4 text-red-200">{lotesError} <button onClick={fetchLotes} className="underline ml-2">Tentar novamente</button></div>}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <AnimatePresence mode="wait">
                  <motion.div key={filterStatus}>
                    {filterStatus === 'programado' ? (
                      <Suspense fallback={<LoadingFallback />}>
                        <ProgramacaoModule lotes={lotes} onPaintLote={handlePaintFromProgramacao} onRemoveFromProgramacao={handleRemoveFromProgramacao} userRole={userRole} />
                      </Suspense>
                    ) : loadingLotes && lotes.length === 0 ? (
                      <div className="text-center p-12 glass-effect rounded-2xl"><Package className="w-16 h-16 mx-auto mb-4 text-slate-500 animate-pulse" /><h3 className="text-2xl font-bold mb-2">Carregando lotes...</h3><p className="text-slate-400">Só um momento, estamos buscando os dados.</p></div>
                    ) : currentLotes.length === 0 ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-effect p-12 rounded-2xl text-center"><Package className="w-16 h-16 mx-auto mb-4 text-slate-500" /><h3 className="text-2xl font-bold mb-2">Nenhum lote encontrado</h3><p className="text-slate-400 mb-6">Tente ajustar os filtros ou adicione um novo lote.</p><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenAddModal} className="bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-sky-500/30"><Plus className="w-5 h-5" />Adicionar Lote</motion.button></motion.div>
                    ) : (
                      <Droppable droppableId={`cabine-${cabineFilter}`} isDropDisabled={true}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                              {[...currentLotes].sort((a,b) => (a.ordem_pintura ?? 999) - (b.ordem_pintura ?? 999)).map((lote, index) => (
                                <Draggable key={lote.id} draggableId={lote.id.toString()} index={index} isDragDisabled={true}>
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                      <LoteCard 
                                        lote={lote}
                                        now={now}
                                        userRole={userRole} 
                                        onUpdateStatus={handleUpdateLoteStatus} 
                                        onMarcarEntregue={handleMarcarEntregue} 
                                        onDelete={handleDeleteLote} 
                                        onEdit={handleOpenEditModal} 
                                        onProgramar={handleOpenProgramar} 
                                        onOpenFinanceIntegration={handleOpenFinanceIntegration}
                                      />
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
          </div>
        )}

        <Suspense fallback={<LoadingFallback />}>
          <AddLoteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddOrUpdateLote} loteToEdit={editingLote} userRole={userRole} />
          <HistoricoModal isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} historico={historico} loading={historicoLoading} onDelete={handleDeleteHistoricoLote} userRole={userRole} />
          <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleMarcarPintadoPorQR} lotes={lotes} />
          <CabineSelectModal isOpen={isCabineModalOpen} onClose={() => setIsCabineModalOpen(false)} onSelectCabine={(cabine) => handleSetCabine(loteToProgram, cabine)} />
          <QualityModal isOpen={isQualityModalOpen} onClose={() => setIsQualityModalOpen(false)} userRole={userRole} />
          <ProgramarLoteModal isOpen={isProgramarModalOpen} onClose={() => { setIsProgramarModalOpen(false); setLoteToProgramar(null); }} lote={loteToProgramar} onConfirm={handleProgramarLote} />
          <FinanceModal
            isOpen={financeIntegration.isOpen}
            onClose={() => setFinanceIntegration({ isOpen: false, lote: null })}
            onSave={handleSaveFinanceIntegration}
            recordToEdit={null}
            initialData={financeIntegrationInitialData}
          />
        </Suspense>
        
      </div>
    </DragDropContext>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LotesManager />} />
          <Route path="/finance" element={<PixLancamentoPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}