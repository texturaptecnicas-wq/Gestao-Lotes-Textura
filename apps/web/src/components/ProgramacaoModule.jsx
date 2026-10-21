import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, Loader2, MoveRight, AlertCircle, Repeat,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { todayISO, shiftDate, formatDisplay } from '@/utils/dateUtils';

const CABINES = [1, 2, 3, 4];

const ProgramacaoModule = ({ lotes, onPaintLote, onRemoveFromProgramacao }) => {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [moveCabine, setMoveCabine] = useState(1);
  const [moveCor, setMoveCor] = useState('');
  const [busyId, setBusyId] = useState(null);
  // Lote ids marcados como pintados de forma otimista (antes do realtime do
  // lote confirmar). Permite destacar em verde imediatamente.
  const [paintedIds, setPaintedIds] = useState(new Set());

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programacao')
      .select('*')
      .eq('data', date)
      .order('cabine', { ascending: true })
      .order('ordem_cor', { ascending: true })
      .order('ordem_cliente', { ascending: true });
    if (error) toast({ title: 'Erro ao carregar programação', description: error.message, variant: 'destructive' });
    setEntries(data || []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchEntries();
    // Realtime: apply the payload directly to local state instead of re-fetching
    // the whole board on every change, so paint/remove/move/reorder sync
    // instantly across devices without a manual page refresh.
    const channel = supabase
      .channel(`public:programacao:${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programacao', filter: `data=eq.${date}` }, (payload) => {
        setEntries(prev => {
          if (payload.eventType === 'DELETE') {
            return prev.filter(e => e.id !== payload.old.id);
          }
          const newRow = payload.new;
          if (!newRow) return prev;
          // Row moved to another date (or was re-dated): drop it from this view.
          if (newRow.data !== date) {
            return prev.filter(e => e.id !== newRow.id);
          }
          const idx = prev.findIndex(e => e.id === newRow.id);
          if (idx === -1) return [...prev, newRow];
          const next = prev.slice();
          next[idx] = newRow;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchEntries, date]);

  const lotesById = useMemo(() => {
    const m = new Map();
    (lotes || []).forEach((l) => m.set(l.id, l));
    return m;
  }, [lotes]);

  // Apenas programações ativas (não pintadas) aparecem no quadro.
  const isLotePainted = useCallback((loteId) => paintedIds.has(loteId) || lotesById.get(loteId)?.pintado === true, [paintedIds, lotesById]);

  const board = useMemo(() => {
    const byCab = {};
    CABINES.forEach((c) => { byCab[c] = []; });
    const colorMap = {};
    entries.filter((e) => e.ativo).forEach((e) => {
      const key = `${e.cabine}|${e.cor}`;
      if (!colorMap[key]) colorMap[key] = { cor: e.cor, cabine: e.cabine, ordem_cor: e.ordem_cor, clientMap: {} };
      const cg = colorMap[key];
      const cname = e.cliente || '—';
      if (!cg.clientMap[cname]) cg.clientMap[cname] = { cliente: cname, items: [], ordem_cliente: e.ordem_cliente };
      cg.clientMap[cname].items.push(e);
    });
    Object.values(colorMap).forEach((g) => {
      g.clientGroups = Object.values(g.clientMap).sort((a, b) => {
        // Clientes já pintados vão para o final do grupo de cor.
        const aP = a.items.every((it) => isLotePainted(it.lote_id));
        const bP = b.items.every((it) => isLotePainted(it.lote_id));
        if (aP !== bP) return aP ? 1 : -1;
        return a.ordem_cliente - b.ordem_cliente;
      });
      byCab[g.cabine].push(g);
    });
    CABINES.forEach((c) => byCab[c].sort((a, b) => a.ordem_cor - b.ordem_cor));
    return byCab;
  }, [entries, isLotePainted]);

  const allColors = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => set.add(e.cor));
    return [...set].sort();
  }, [entries]);

  const moveColor = async (cabine, cor, dir) => {
    const groups = [...board[cabine]];
    const idx = groups.findIndex((g) => g.cor === cor);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groups.length) return;
    [groups[idx], groups[swapIdx]] = [groups[swapIdx], groups[idx]];
    // Optimistic: swap the ordem_cor of the two affected color groups.
    setEntries(prev => prev.map(e => {
      if (e.cabine === cabine && e.cor === groups[idx].cor) return { ...e, ordem_cor: idx };
      if (e.cabine === cabine && e.cor === groups[swapIdx].cor) return { ...e, ordem_cor: swapIdx };
      return e;
    }));
    await Promise.all(
      groups.map((g, i) =>
        g.ordem_cor !== i
          ? supabase.from('programacao').update({ ordem_cor: i }).eq('data', date).eq('cabine', cabine).eq('cor', g.cor)
          : Promise.resolve()
      )
    );
  };

  const moveClient = async (cabine, cor, cliente, dir) => {
    const group = board[cabine].find((g) => g.cor === cor);
    if (!group) return;
    const groups = [...group.clientGroups];
    const idx = groups.findIndex((cg) => cg.cliente === cliente);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groups.length) return;
    const a = groups[idx];
    const b = groups[swapIdx];
    const aOrdem = a.ordem_cliente;
    const bOrdem = b.ordem_cliente;
    // Optimistic: swap the ordem_cliente of the two affected clients.
    setEntries(prev => prev.map(e => {
      if (e.cabine === cabine && e.cor === cor && e.cliente === a.cliente) return { ...e, ordem_cliente: bOrdem };
      if (e.cabine === cabine && e.cor === cor && e.cliente === b.cliente) return { ...e, ordem_cliente: aOrdem };
      return e;
    }));
    await Promise.all([
      ...a.items.map((it) => supabase.from('programacao').update({ ordem_cliente: bOrdem }).eq('id', it.id)),
      ...b.items.map((it) => supabase.from('programacao').update({ ordem_cliente: aOrdem }).eq('id', it.id)),
    ]);
  };

  const paintGroup = async (cg) => {
    if (!onPaintLote) return;
    const loteIds = new Set(cg.items.map(it => it.lote_id));
    // Optimistic: marca como pintado localmente para destacar em verde na hora.
    // A entrada de programação NÃO é removida — ela fica como registro do dia.
    setPaintedIds(prev => { const n = new Set(prev); loteIds.forEach(id => n.add(id)); return n; });
    setBusyId(`paint-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.cor}`);
    try {
      const results = await Promise.all(cg.items.map((it) => onPaintLote(it.lote_id)));
      if (results.some(r => r === false)) {
        // Falhou: limpa o estado otimista e recarrega para refletir a realidade.
        setPaintedIds(prev => { const n = new Set(prev); loteIds.forEach(id => n.delete(id)); return n; });
        fetchEntries();
      }
    } catch {
      setPaintedIds(prev => { const n = new Set(prev); loteIds.forEach(id => n.delete(id)); return n; });
      fetchEntries();
    } finally {
      setBusyId(null);
    }
  };

  // Repete o cliente (todos os lotes do grupo) na programação do dia seguinte,
  // preservando a entrada original de hoje e evitando duplicatas no mesmo dia.
  const repeatToNextDay = async (cg) => {
    const tomorrow = shiftDate(date, 1);
    const cabineNum = cg.items[0]?.cabine || 1;
    const cor = cg.items[0]?.cor || '';
    setBusyId(`repeat-${cg.cliente}-${cabineNum}-${cor}`);
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('programacao')
        .select('lote_id, cor, ordem_cor, ordem_cliente, cliente')
        .eq('data', tomorrow)
        .eq('cabine', cabineNum);
      if (fetchErr) { toast({ title: 'Erro ao repetir', description: fetchErr.message, variant: 'destructive' }); return; }
      const rows = existing || [];
      const alreadyLoteIds = new Set(rows.map(r => r.lote_id));
      const toInsert = cg.items.filter(it => !alreadyLoteIds.has(it.lote_id));
      if (toInsert.length === 0) { toast({ title: 'Já programado', description: 'Este cliente já está programado para amanhã.' }); return; }
      const sameColor = rows.filter(r => r.cor === cor);
      let ordem_cor, ordem_cliente;
      if (sameColor.length > 0) {
        ordem_cor = sameColor[0].ordem_cor;
        const sameClient = sameColor.filter(r => r.cliente === cg.cliente);
        if (sameClient.length > 0) ordem_cliente = sameClient[0].ordem_cliente;
        else ordem_cliente = (rows.reduce((m, r) => Math.max(m, r.ordem_cliente), -1)) + 1;
      } else {
        ordem_cor = (rows.reduce((m, r) => Math.max(m, r.ordem_cor), -1)) + 1;
        ordem_cliente = 0;
      }
      const inserts = toInsert.map(it => ({
        data: tomorrow, lote_id: it.lote_id, cabine: cabineNum, cor, ordem_cor, ordem_cliente, cliente: cg.cliente, ativo: true,
      }));
      const { error: insertErr } = await supabase.from('programacao').insert(inserts);
      if (insertErr) { toast({ title: 'Erro ao repetir', description: insertErr.message, variant: 'destructive' }); return; }
      toast({ title: 'Repetido para amanhã!', description: `${cg.cliente} → Cabine ${cabineNum} · ${cor} (${toInsert.length} lote${toInsert.length > 1 ? 's' : ''})` });
    } finally {
      setBusyId(null);
    }
  };

  const removeGroup = async (cg) => {
    if (!onRemoveFromProgramacao) return;
    const ids = new Set(cg.items.map(it => it.id));
    // Optimistic: remove the group immediately while the DB catches up.
    setEntries(prev => prev.filter(e => !ids.has(e.id)));
    setBusyId(`remove-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.cor}`);
    try {
      const results = await Promise.all(cg.items.map((it) => onRemoveFromProgramacao(it.lote_id)));
      if (results.some(r => r === false)) fetchEntries();
    } catch {
      fetchEntries();
    } finally {
      setBusyId(null);
    }
  };

  const startMove = (cg) => {
    setMovingId(`${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.cor}`);
    setMoveCabine(cg.items[0]?.cabine || 1);
    setMoveCor(cg.items[0]?.cor || '');
  };

  const confirmMove = async (cg) => {
    const newCabine = Number(moveCabine);
    const newCor = moveCor.trim();
    if (!newCor) { toast({ title: 'Cor inválida', variant: 'destructive' }); return; }
    const targetGroups = board[newCabine] || [];
    const existingColor = targetGroups.find((g) => g.cor === newCor);
    let ordem_cor;
    if (existingColor) {
      ordem_cor = existingColor.ordem_cor;
    } else {
      ordem_cor = targetGroups.length;
    }
    const allClients = targetGroups.flatMap((g) => g.clientGroups);
    const existingClient = allClients.find((c) => c.cliente === cg.cliente);
    let ordem_cliente;
    if (existingClient) {
      ordem_cliente = existingClient.ordem_cliente;
    } else if (existingColor) {
      ordem_cliente = (allClients.reduce((m, c) => Math.max(m, c.ordem_cliente), -1)) + 1;
    } else {
      ordem_cliente = 0;
    }
    const ids = new Set(cg.items.map(it => it.id));
    // Optimistic: relocate the group to the new cabine/cor immediately.
    setEntries(prev => prev.map(e => ids.has(e.id) ? { ...e, cabine: newCabine, cor: newCor, ordem_cor, ordem_cliente } : e));
    await Promise.all(
      cg.items.map((it) =>
        supabase.from('programacao').update({ cabine: newCabine, cor: newCor, ordem_cor, ordem_cliente }).eq('id', it.id)
      )
    );
    setMovingId(null);
  };

  const isToday = date === todayISO();

  return (
    <div className="space-y-4">
      {/* Navegação de data */}
      <div className="glass-effect rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDate(shiftDate(date, -1))} className="glass-effect p-2 rounded-lg hover:bg-slate-700/60">
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-sky-300" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-effect px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              style={{ colorScheme: 'dark' }}
            />
            <span className="text-sm text-slate-400 hidden sm:inline capitalize">{formatDisplay(date)}</span>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDate(shiftDate(date, 1))} className="glass-effect p-2 rounded-lg hover:bg-slate-700/60">
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
        {isToday ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Hoje
          </span>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDate(todayISO())} className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg text-sm font-semibold">
            Voltar para hoje
          </motion.button>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {isToday ? 'Programação do dia' : 'Consulta / edição de programação anterior'}
        </span>
      </div>

      {loading ? (
        <div className="glass-effect rounded-2xl p-12 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-3 text-sky-400 animate-spin" />
          <p className="text-slate-400">Carregando programação...</p>
        </div>
      ) : entries.filter((e) => e.ativo).length === 0 ? (
        <div className="glass-effect rounded-2xl p-12 text-center">
          <Calendar className="w-14 h-14 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-bold mb-2">Nenhuma programação para esta data</h3>
          <p className="text-slate-400">Use o botão <strong className="text-sky-300">Progr.</strong> em um lote de Recebidos para adicioná-lo aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {CABINES.map((cab) => {
            const groups = board[cab];
            const totalCab = groups.reduce((s, g) => s + g.clientGroups.reduce((ss, cg) => ss + cg.items.length, 0), 0);
            return (
              <div key={cab} className="glass-effect rounded-2xl p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-bold text-lg gradient-text">Cabine {cab}</h3>
                  <span className="text-xs bg-slate-900/50 px-2 py-0.5 rounded-full font-semibold">{totalCab}</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {groups.map((group, gi) => (
                      <motion.div
                        key={group.cor}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex flex-col">
                              <button onClick={() => moveColor(cab, group.cor, -1)} disabled={gi === 0} className="disabled:opacity-30 hover:text-sky-300">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveColor(cab, group.cor, 1)} disabled={gi === groups.length - 1} className="disabled:opacity-30 hover:text-sky-300">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-semibold text-sm truncate" title={group.cor}>{group.cor}</span>
                          </div>
                          <span className="text-xs text-slate-400">{group.clientGroups.length} cliente{group.clientGroups.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="p-2 space-y-2">
                          {group.clientGroups.map((cg, ci) => {
                            const moveKey = `${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.cor}`;
                            const isMoving = movingId === moveKey;
                            const paintBusy = busyId === `paint-${moveKey}`;
                            const removeBusy = busyId === `remove-${moveKey}`;
                            const repeatBusy = busyId === `repeat-${moveKey}`;
                            const groupPainted = cg.items.every(it => isLotePainted(it.lote_id));
                            const firstLote = cg.items[0] ? lotesById.get(cg.items[0].lote_id) : null;
                            const totalPecas = cg.items.reduce((s, it) => {
                              const l = lotesById.get(it.lote_id);
                              return s + (l?.quantidade || 0);
                            }, 0);
                            return (
                              <motion.div
                                key={`${cg.cliente}-${ci}`}
                                layout
                                className={`rounded-lg p-2 border ${groupPainted ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-slate-800/70 border-slate-700/60'}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <button onClick={() => moveClient(cab, group.cor, cg.cliente, -1)} disabled={ci === 0} className="disabled:opacity-30 hover:text-sky-300">
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => moveClient(cab, group.cor, cg.cliente, 1)} disabled={ci === group.clientGroups.length - 1} className="disabled:opacity-30 hover:text-sky-300">
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <p className={`font-semibold text-sm truncate ${groupPainted ? 'text-emerald-300' : ''}`}>{cg.cliente}</p>
                                      {groupPainted && (
                                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Pintado</span>
                                      )}
                                      {cg.items.length > 1 && (
                                        <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">{cg.items.length} lotes</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                      {totalPecas ? `${totalPecas} peças` : ''}
                                      {firstLote?.medida === 'ok' ? ' · Medido' : ''}
                                      {firstLote?.pago === 'ok' ? ' · Pago' : ''}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => startMove(cg)} className="p-1 rounded hover:bg-slate-700/60 text-indigo-300" title="Mover para outra cabine/cor">
                                      <MoveRight className="w-3.5 h-3.5" />
                                    </button>
                                    {!groupPainted && (
                                      <button onClick={() => repeatToNextDay(cg)} disabled={repeatBusy} className="p-1 rounded hover:bg-sky-500/20 text-sky-300 disabled:opacity-50" title="Repetir cliente amanhã">
                                        {repeatBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                    {!groupPainted && (
                                      <button onClick={() => paintGroup(cg)} disabled={paintBusy} className="p-1 rounded hover:bg-green-500/20 text-green-400 disabled:opacity-50" title="Marcar como pintado">
                                        {paintBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                    <button onClick={() => removeGroup(cg)} disabled={removeBusy} className="p-1 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-50" title="Remover da programação">
                                      {removeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {isMoving && (
                                  <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-2">
                                    <div className="flex gap-2">
                                      <select value={moveCabine} onChange={(e) => setMoveCabine(Number(e.target.value))} className="glass-effect rounded-lg px-2 py-1 text-xs flex-1">
                                        {CABINES.map((c) => <option key={c} value={c}>Cab. {c}</option>)}
                                      </select>
                                      <input list="move-cores-list" value={moveCor} onChange={(e) => setMoveCor(e.target.value)} className="glass-effect rounded-lg px-2 py-1 text-xs flex-1" placeholder="Cor" />
                                      <datalist id="move-cores-list">
                                        {allColors.map((c) => <option key={c} value={c} />)}
                                      </datalist>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => confirmMove(cg)} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-1 rounded-lg">Confirmar</button>
                                      <button onClick={() => setMovingId(null)} className="flex-1 glass-effect text-xs font-semibold py-1 rounded-lg">Cancelar</button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-effect rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-sky-300 flex-shrink-0 mt-0.5" />
        <p>Ao programar, o lote sai de <strong className="text-slate-200">Recebidos</strong> e aparece aqui agrupado por cliente e cor. Marcar como pintado envia o lote para <strong className="text-slate-200">Pintados</strong> e destaca o cliente em <strong className="text-emerald-300">verde</strong> aqui, mantendo o registro do dia. Use <strong className="text-sky-300">Repetir amanhã</strong> para levar um cliente não pintado para a programação do dia seguinte, preservando a entrada de hoje. Remover da programação devolve o lote a <strong className="text-slate-200">Recebidos</strong>.</p>
      </div>
    </div>
  );
};

export default ProgramacaoModule;
