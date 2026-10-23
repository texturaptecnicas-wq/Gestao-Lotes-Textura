import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, Loader2, MoveRight, AlertCircle, Repeat, ArrowLeftRight, Star, FileDown, Eye,
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, ShadingType, WidthType, BorderStyle, Table, TableRow, TableCell } from 'docx';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { todayISO, shiftDate, formatDisplay } from '@/utils/dateUtils';
import ProgramacaoPhotosModal from '@/components/ProgramacaoPhotosModal';

const CABINES = [1, 2, 3, 4];

// Normaliza o nome da cor para agrupar variações de caixa/acentos/espaços
// (ex: "preto tx" == "Preto TX") em um único grupo da programação.
const normCor = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

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
  // Movimento de subconjunto inteiro de cor para outra cabine.
  const [movingSubsetKey, setMovingSubsetKey] = useState(null);
  const [subsetTargetCabine, setSubsetTargetCabine] = useState(1);
  // Visualização das fotos vinculadas aos lotes do cliente.
  const [photosModal, setPhotosModal] = useState({ open: false, cliente: '', photos: [] });
  const [photosBusyKey, setPhotosBusyKey] = useState(null);

  // Reúne as fotos de todos os lotes do grupo de cliente e abre o modal.
  // Se houver mais de um lote do mesmo cliente, todas as fotos aparecem juntas.
  const openClientPhotos = async (cg) => {
    const key = `photos-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`;
    setPhotosBusyKey(key);
    try {
      const lotesArr = cg.items
        .map((it) => lotesById.get(it.lote_id))
        .filter(Boolean);
      const comFoto = lotesArr.filter((l) => l.foto);
      if (comFoto.length === 0) {
        toast({ title: 'Sem fotos', description: 'Nenhuma foto vinculada aos lotes deste cliente.' });
        return;
      }
      const photos = comFoto.map((l) => {
        const { data } = supabase.storage.from('fotos-lotes').getPublicUrl(l.foto);
        return {
          url: `${data.publicUrl}?t=${new Date().getTime()}`,
          cliente: l.cliente,
          cor: l.cor,
          quantidade: l.quantidade,
        };
      });
      setPhotosModal({ open: true, cliente: cg.cliente, photos });
    } finally {
      setPhotosBusyKey(null);
    }
  };

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

  // Agrupa por (cabine, ordem_cor) em vez de por cor, permitindo que existam
  // dois ou mais subconjuntos da mesma cor na mesma cabine (criados via
  // "seguir sequência" ao programar). Cada subconjunto é um grupo distinto.
  const board = useMemo(() => {
    const byCab = {};
    CABINES.forEach((c) => { byCab[c] = []; });
    const groupMap = {};
    entries.filter((e) => e.ativo).forEach((e) => {
      const key = `${e.cabine}|${e.ordem_cor}`;
      if (!groupMap[key]) groupMap[key] = { cor: e.cor, cabine: e.cabine, ordem_cor: e.ordem_cor, clientMap: {} };
      const g = groupMap[key];
      const cname = e.cliente || '—';
      if (!g.clientMap[cname]) g.clientMap[cname] = { cliente: cname, items: [], ordem_cliente: e.ordem_cliente };
      g.clientMap[cname].items.push(e);
    });
    Object.values(groupMap).forEach((g) => {
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

  // Reordena subconjuntos de cor dentro da cabine. Atualiza por id para evitar
  // ambiguidade quando há dois subconjuntos da mesma cor (mesma cor, ordem_cor
  // diferente).
  const moveColor = async (cabine, ordemCor, dir) => {
    const groups = [...board[cabine]];
    const idx = groups.findIndex((g) => g.ordem_cor === ordemCor);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groups.length) return;
    const a = groups[idx];
    const b = groups[swapIdx];
    const aOrdem = a.ordem_cor;
    const bOrdem = b.ordem_cor;
    const aIds = a.clientGroups.flatMap((cg) => cg.items).map((it) => it.id);
    const bIds = b.clientGroups.flatMap((cg) => cg.items).map((it) => it.id);
    // Optimistic: troca o ordem_cor dos dois subconjuntos.
    setEntries(prev => prev.map(e => {
      if (aIds.includes(e.id)) return { ...e, ordem_cor: bOrdem };
      if (bIds.includes(e.id)) return { ...e, ordem_cor: aOrdem };
      return e;
    }));
    await Promise.all([
      ...aIds.map((id) => supabase.from('programacao').update({ ordem_cor: bOrdem }).eq('id', id)),
      ...bIds.map((id) => supabase.from('programacao').update({ ordem_cor: aOrdem }).eq('id', id)),
    ]);
  };

  // Reordena clientes dentro de um subconjunto. Atualiza por id para manter o
  // escopo correto mesmo com subconjuntos da mesma cor.
  const moveClient = async (cabine, ordemCor, cliente, dir) => {
    const group = board[cabine].find((g) => g.ordem_cor === ordemCor);
    if (!group) return;
    const groups = [...group.clientGroups];
    const idx = groups.findIndex((cg) => cg.cliente === cliente);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groups.length) return;
    const a = groups[idx];
    const b = groups[swapIdx];
    const aOrdem = a.ordem_cliente;
    const bOrdem = b.ordem_cliente;
    const aIds = a.items.map((it) => it.id);
    const bIds = b.items.map((it) => it.id);
    // Optimistic: troca o ordem_cliente dos dois clientes.
    setEntries(prev => prev.map(e => {
      if (aIds.includes(e.id)) return { ...e, ordem_cliente: bOrdem };
      if (bIds.includes(e.id)) return { ...e, ordem_cliente: aOrdem };
      return e;
    }));
    await Promise.all([
      ...aIds.map((id) => supabase.from('programacao').update({ ordem_cliente: bOrdem }).eq('id', id)),
      ...bIds.map((id) => supabase.from('programacao').update({ ordem_cliente: aOrdem }).eq('id', id)),
    ]);
  };

  const paintGroup = async (cg) => {
    if (!onPaintLote) return;
    const loteIds = new Set(cg.items.map(it => it.lote_id));
    // Optimistic: marca como pintado localmente para destacar em verde na hora.
    // A entrada de programação NÃO é removida — ela fica como registro do dia.
    setPaintedIds(prev => { const n = new Set(prev); loteIds.forEach(id => n.add(id)); return n; });
    setBusyId(`paint-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`);
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
    setBusyId(`repeat-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`);
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
    setBusyId(`remove-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`);
    try {
      const results = await Promise.all(cg.items.map((it) => onRemoveFromProgramacao(it.lote_id)));
      if (results.some(r => r === false)) fetchEntries();
    } catch {
      fetchEntries();
    } finally {
      setBusyId(null);
    }
  };

  // Marca/desmarca todos os lotes do grupo de cliente como "promessa para
  // hoje". O destaque aparece no quadro e no PDF (sem negrito, reservado às
  // cores). Persistido no campo `promessa` do lote; o realtime do App propaga.
  const togglePromessa = async (cg) => {
    const loteIds = cg.items.map(it => it.lote_id);
    const anyPromessa = cg.items.some(it => lotesById.get(it.lote_id)?.promessa === true);
    const newValue = !anyPromessa;
    const key = `${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`;
    setBusyId(`promessa-${key}`);
    try {
      await Promise.all(
        loteIds.map(id => supabase.from('lotes').update({ promessa: newValue, updated_at: new Date().toISOString() }).eq('id', id))
      );
    } finally {
      setBusyId(null);
    }
  };

  // Gera um documento Word (.docx) fiel à programação exibida no momento
  // (cabines, cores em negrito, clientes em sequência e destaques de
  // promessa sem negrito). Página A4, título centralizado e conteúdo em
  // duas colunas. O documento é sempre gerado a partir do estado atual,
  // refletindo qualquer alteração feita na programação.
  const generateWord = useCallback(async () => {
    // Monta a lista plana de grupos de cor (cada um com suas linhas de
    // cliente), preservando a ordem cabine → cor → cliente do quadro.
    const groups = [];
    CABINES.forEach((cab) => {
      const cabGroups = board[cab];
      if (!cabGroups || cabGroups.length === 0) return;
      cabGroups.forEach((group) => {
        const lines = group.clientGroups.map((cg) => {
          const lotesArr = cg.items.map((it) => lotesById.get(it.lote_id));
          const isPromessa = lotesArr.some((l) => l?.promessa === true);
          const totalPecas = lotesArr.reduce((s, l) => s + (l?.quantidade || 0), 0);
          let label = `${cg.cliente}`;
          if (totalPecas) label += `  —  ${totalPecas} peça${totalPecas > 1 ? 's' : ''}`;
          if (cg.items.length > 1) label += `  (${cg.items.length} lotes)`;
          return { label, isPromessa };
        });
        groups.push({ cabine: cab, cor: group.cor, lines });
      });
    });

    // Constrói os parágrafos de uma coluna (lista de grupos). O cabeçalho
    // de cabine aparece sempre que a cabine muda dentro da coluna.
    const buildColumnParas = (colGroups) => {
      const paras = [];
      let lastCabine = null;
      colGroups.forEach((g) => {
        if (g.cabine !== lastCabine) {
          // Espaço visual entre a última cor de uma cabine e o título da
          // próxima cabine (antes do primeiro título não há espaço).
          if (lastCabine !== null) {
            paras.push(new Paragraph({
              spacing: { before: 0, after: 120 },
              children: [new TextRun({ text: '', size: 16 })],
            }));
          }
          paras.push(new Paragraph({
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: `Cabine ${g.cabine}`, bold: true, size: 36, font: 'Arial' })], // Arial 18pt negrito
          }));
          lastCabine = g.cabine;
        }
        paras.push(new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [new TextRun({ text: g.cor, bold: true, size: 36, font: 'Arial' })], // Arial 18pt negrito
        }));
        g.lines.forEach((ln) => {
          const text = ln.isPromessa ? `★ ${ln.label}` : ln.label;
          paras.push(new Paragraph({
            spacing: { after: 20 },
            shading: ln.isPromessa ? { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF37F' } : undefined,
            children: [new TextRun({ text, size: 32, font: 'Arial' })], // Arial 16pt, sem negrito
          }));
        });
      });
      return paras;
    };

    // Distribui os grupos em duas colunas balanceadas por número de linhas,
    // mantendo grupos de cor inteiros (sem quebrar no meio).
    const groupWeight = (g) => 1 + g.lines.length;
    const totalWeight = groups.reduce((s, g) => s + groupWeight(g), 0);
    let acc = 0;
    let splitIdx = groups.length;
    for (let i = 0; i < groups.length; i++) {
      acc += groupWeight(groups[i]);
      if (acc >= totalWeight / 2) { splitIdx = i + 1; break; }
    }
    const leftGroups = groups.slice(0, splitIdx);
    const rightGroups = groups.slice(splitIdx);

    // Título centralizado, em negrito, ocupando toda a largura da página
    // acima da tabela de duas colunas.
    const titlePara = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Programação — ${formatDisplay(date)} (${date})`,
          bold: true,
          size: 40, // 20pt
          font: 'Arial',
        }),
      ],
    });

    // Tabela invisível de duas colunas para o layout lado a lado.
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const cellOpts = {
      margins: { top: 20, bottom: 20, left: 40, right: 40 },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
    };

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5233, 5233],
      rows: [
        new TableRow({
          children: [
            new TableCell({ ...cellOpts, children: buildColumnParas(leftGroups) }),
            new TableCell({ ...cellOpts, children: buildColumnParas(rightGroups) }),
          ],
        }),
      ],
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 (twips)
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [titlePara, table],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `programacao-${date}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: 'Erro ao gerar Word', description: err?.message || 'Não foi possível gerar o documento.', variant: 'destructive' });
    }
  }, [board, lotesById, date]);

  // --- Movimento de cliente individual para outra cabine/cor ---
  const startMove = (cg) => {
    setMovingId(`${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`);
    setMoveCabine(cg.items[0]?.cabine || 1);
    setMoveCor(cg.items[0]?.cor || '');
  };

  const confirmMove = async (cg) => {
    const newCabine = Number(moveCabine);
    const newCor = moveCor.trim();
    if (!newCor) { toast({ title: 'Cor inválida', variant: 'destructive' }); return; }
    const targetGroups = board[newCabine] || [];
    const existingColor = targetGroups.find((g) => normCor(g.cor) === normCor(newCor));
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
    const canonicalCor = existingColor ? existingColor.cor : newCor;
    // Optimistic: relocate the group to the new cabine/cor immediately.
    setEntries(prev => prev.map(e => ids.has(e.id) ? { ...e, cabine: newCabine, cor: canonicalCor, ordem_cor, ordem_cliente } : e));
    await Promise.all(
      cg.items.map((it) =>
        supabase.from('programacao').update({ cabine: newCabine, cor: canonicalCor, ordem_cor, ordem_cliente }).eq('id', it.id)
      )
    );
    setMovingId(null);
  };

  // --- Movimento de subconjunto inteiro de cor para outra cabine ---
  // Move todos os lotes do subconjunto preservando clientes e ordem interna.
  // Se a cor já existir na cabine de destino, mescla no subconjunto existente;
  // caso contrário, cria um novo subconjunto no final da cabine.
  const startMoveSubset = (group) => {
    setMovingSubsetKey(`${group.cabine}-${group.ordem_cor}`);
    setSubsetTargetCabine(group.cabine);
  };

  const confirmMoveSubset = async (group) => {
    const newCabine = Number(subsetTargetCabine);
    if (newCabine === group.cabine) { setMovingSubsetKey(null); return; }
    const newCor = group.cor;
    const targetGroups = board[newCabine] || [];
    const existingColor = targetGroups.find((g) => normCor(g.cor) === normCor(newCor));
    const canonicalCor = existingColor ? existingColor.cor : newCor;
    let ordem_cor;
    if (existingColor) {
      ordem_cor = existingColor.ordem_cor;
    } else {
      ordem_cor = targetGroups.reduce((m, g) => Math.max(m, g.ordem_cor), -1) + 1;
    }
    // Mapa de clientes já existentes no subconjunto de destino (para mesclar).
    const existingClientMap = {};
    if (existingColor) {
      existingColor.clientGroups.forEach((cg) => { existingClientMap[cg.cliente] = cg.ordem_cliente; });
    }
    const allTargetClients = targetGroups.flatMap((g) => g.clientGroups);
    let nextOrdem = allTargetClients.reduce((m, c) => Math.max(m, c.ordem_cliente), -1) + 1;
    // Determina o ordem_cliente de cada cliente do subconjunto movido.
    const clientOrdemMap = {};
    group.clientGroups.forEach((cg) => {
      if (existingClientMap[cg.cliente] !== undefined) {
        clientOrdemMap[cg.cliente] = existingClientMap[cg.cliente];
      } else {
        clientOrdemMap[cg.cliente] = nextOrdem;
        nextOrdem += 1;
      }
    });
    const allItems = group.clientGroups.flatMap((cg) => cg.items);
    const ids = new Set(allItems.map((it) => it.id));
    // Optimistic: realoca todos os lotes para a nova cabine/subconjunto.
    setEntries(prev => prev.map(e => {
      if (!ids.has(e.id)) return e;
      return { ...e, cabine: newCabine, cor: canonicalCor, ordem_cor, ordem_cliente: clientOrdemMap[e.cliente] ?? 0 };
    }));
    setBusyId(`move-subset-${group.cabine}-${group.ordem_cor}`);
    try {
      await Promise.all(
        allItems.map((it) =>
          supabase.from('programacao')
            .update({ cabine: newCabine, cor: canonicalCor, ordem_cor, ordem_cliente: clientOrdemMap[it.cliente] ?? 0 })
            .eq('id', it.id)
        )
      );
      toast({ title: 'Subconjunto movido!', description: `${newCor} → Cabine ${newCabine}` });
      setMovingSubsetKey(null);
    } catch {
      fetchEntries();
    } finally {
      setBusyId(null);
    }
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
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={generateWord} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20" title="Gerar Word da programação">
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Word</span>
        </motion.button>
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
                    {groups.map((group, gi) => {
                      const subsetKey = `${group.cabine}-${group.ordem_cor}`;
                      const isMovingSubset = movingSubsetKey === subsetKey;
                      const moveSubsetBusy = busyId === `move-subset-${subsetKey}`;
                      // Conta quantos subconjuntos da mesma cor existem nesta cabine
                      // para exibir um rótulo quando houver mais de um.
                      const sameColorCount = groups.filter((g) => normCor(g.cor) === normCor(group.cor)).length;
                      return (
                      <motion.div
                        key={group.ordem_cor}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2 px-3 py-2 bg-slate-800/60">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="flex flex-col shrink-0">
                              <button onClick={() => moveColor(cab, group.ordem_cor, -1)} disabled={gi === 0} className="disabled:opacity-30 hover:text-sky-300">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveColor(cab, group.ordem_cor, 1)} disabled={gi === groups.length - 1} className="disabled:opacity-30 hover:text-sky-300">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-sm break-words" title={group.cor}>{group.cor}</span>
                              {sameColorCount > 1 && (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full">subconj. {gi + 1}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{group.clientGroups.length} cliente{group.clientGroups.length > 1 ? 's' : ''}</span>
                            <button onClick={() => startMoveSubset(group)} className="p-1 rounded hover:bg-indigo-500/20 text-indigo-300" title="Mover subconjunto para outra cabine">
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isMovingSubset && (
                          <div className="px-3 py-2 border-b border-slate-700/60 bg-indigo-500/5 space-y-2">
                            <p className="text-xs text-slate-300">Mover todo o subconjunto <strong className="text-indigo-300">{group.cor}</strong> para:</p>
                            <div className="grid grid-cols-4 gap-1">
                              {CABINES.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setSubsetTargetCabine(c)}
                                  disabled={c === group.cabine}
                                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${Number(subsetTargetCabine) === c ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white' : 'glass-effect text-slate-300 hover:bg-slate-700/60'} ${c === group.cabine ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  Cab. {c}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => confirmMoveSubset(group)} disabled={moveSubsetBusy} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-1 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                                {moveSubsetBusy && <Loader2 className="w-3 h-3 animate-spin" />}Confirmar
                              </button>
                              <button onClick={() => setMovingSubsetKey(null)} className="flex-1 glass-effect text-xs font-semibold py-1 rounded-lg">Cancelar</button>
                            </div>
                          </div>
                        )}

                        <div className="p-2 space-y-2">
                          {group.clientGroups.map((cg, ci) => {
                            const moveKey = `${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`;
                            const isMoving = movingId === moveKey;
                            const paintBusy = busyId === `paint-${moveKey}`;
                            const removeBusy = busyId === `remove-${moveKey}`;
                            const repeatBusy = busyId === `repeat-${moveKey}`;
                            const promessaBusy = busyId === `promessa-${moveKey}`;
                            const groupPainted = cg.items.every(it => isLotePainted(it.lote_id));
                            const groupPromessa = cg.items.some(it => lotesById.get(it.lote_id)?.promessa === true);
                            const firstLote = cg.items[0] ? lotesById.get(cg.items[0].lote_id) : null;
                            const totalPecas = cg.items.reduce((s, it) => {
                              const l = lotesById.get(it.lote_id);
                              return s + (l?.quantidade || 0);
                            }, 0);
                            return (
                              <motion.div
                                key={`${cg.cliente}-${ci}`}
                                layout
                                className={`rounded-lg p-2 border ${groupPromessa ? 'bg-amber-500/15 border-amber-400/60 ring-1 ring-amber-400/40' : groupPainted ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-slate-800/70 border-slate-700/60'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                      <div className="flex flex-col shrink-0">
                                        <button onClick={() => moveClient(cab, group.ordem_cor, cg.cliente, -1)} disabled={ci === 0} className="disabled:opacity-30 hover:text-sky-300">
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => moveClient(cab, group.ordem_cor, cg.cliente, 1)} disabled={ci === group.clientGroups.length - 1} className="disabled:opacity-30 hover:text-sky-300">
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                        <p className={`font-semibold text-sm break-words ${groupPainted ? 'text-emerald-300' : ''}`}>{cg.cliente}</p>
                                        {groupPainted && (
                                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Pintado</span>
                                        )}
                                        {groupPromessa && (
                                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" fill="currentColor" />Promessa</span>
                                        )}
                                        {cg.items.length > 1 && (
                                          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">{cg.items.length} lotes</span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 break-words">
                                      {totalPecas ? `${totalPecas} peças` : ''}
                                      {firstLote?.medida === 'ok' ? ' · Medido' : ''}
                                      {firstLote?.pago === 'ok' ? ' · Pago' : ''}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                    <button onClick={() => startMove(cg)} className="p-1 rounded hover:bg-slate-700/60 text-indigo-300" title="Mover para outra cabine/cor">
                                      <MoveRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => togglePromessa(cg)} disabled={promessaBusy} className={`p-1 rounded hover:bg-amber-500/20 ${groupPromessa ? 'text-amber-300 bg-amber-500/15' : 'text-amber-400/70'}`} title="Marcar como promessa para hoje">
                                      {promessaBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" fill={groupPromessa ? 'currentColor' : 'none'} />}
                                    </button>
                                    <button onClick={() => openClientPhotos(cg)} disabled={photosBusyKey === `photos-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}`} className="p-1 rounded hover:bg-sky-500/20 text-sky-300 disabled:opacity-50" title="Ver fotos dos lotes do cliente">
                                      {photosBusyKey === `photos-${cg.cliente}-${cg.items[0]?.cabine}-${cg.items[0]?.ordem_cor}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
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
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProgramacaoPhotosModal
        isOpen={photosModal.open}
        onClose={() => setPhotosModal({ open: false, cliente: '', photos: [] })}
        cliente={photosModal.cliente}
        photos={photosModal.photos}
      />

      <div className="glass-effect rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-sky-300 flex-shrink-0 mt-0.5" />
        <p>Ao programar, o lote sai de <strong className="text-slate-200">Recebidos</strong> e aparece aqui agrupado por cliente e cor. Se a cor já existir na cabine, você pode <strong className="text-amber-300">seguir sequência</strong> para criar um novo subconjunto no final, ou escolher em qual subconjunto entrar. Use <strong className="text-indigo-300">Mover subconjunto</strong> (ícone <ArrowLeftRight className="inline w-3 h-3" />) para enviar todo o grupo de cor para outra cabine. Marcar como pintado envia o lote para <strong className="text-slate-200">Pintados</strong> e destaca o cliente em <strong className="text-emerald-300">verde</strong> aqui, mantendo o registro do dia.</p>
      </div>
    </div>
  );
};

export default ProgramacaoModule;
