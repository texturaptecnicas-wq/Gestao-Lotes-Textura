
import { supabase } from '@/lib/customSupabaseClient';
import { normalizeClientName } from '@/utils/clientNormalization';
import { normalizePainterName } from '@/utils/painterNormalization';

// ============================================================================
// NOTICE: THIS SERVICE IS COMPLETELY ISOLATED FROM FINANCIAL OPERATIONS.
// IT ONLY INTERACTS WITH quality_reports, quality_alerts, AND quality_daily_log.
// NO REFERENCES TO pix_lancados, pix_pendentes, OR pix_records EXIST HERE.
// ============================================================================

const SIZE_WEIGHTS = {
  'muito_pequena': 0.5,
  'pequena': 1.0,
  'media': 1.5,
  'grande': 2.0,
  'muito_grande': 3.0
};

export const getRecordWeight = (tamanho_peca) => {
  return tamanho_peca ? (SIZE_WEIGHTS[tamanho_peca] || 1.0) : 1.0;
};

export const normalizeAndGetOfficialName = async (name) => {
  if (!name) return { official_name: '', normalized: '' };
  const normalized = normalizeClientName(name);
  const { data, error } = await supabase.from('client_aliases').select('official_name').eq('normalized', normalized).limit(1).maybeSingle(); 
  if (error) console.error('Error fetching client alias:', error);
  return { official_name: data?.official_name || name, normalized };
};

// --- ALERTS & DAILY LOG --- 
export const createQualityAlert = async ({ client_name, description, image_url, created_by, cor }) => {
  let normalized = null;
  let official = null;
  
  if (client_name && client_name.trim() !== '') {
    const res = await normalizeAndGetOfficialName(client_name);
    normalized = res.normalized;
    official = res.official_name;
  }

  const { data, error } = await supabase.from('quality_alerts').insert([{ 
    client_name: official || client_name || null, 
    client_normalized: normalized || null, 
    description, 
    image_url, 
    created_by, 
    cor: cor || null,
    active: true 
  }]).select().single();
  
  if (error) throw error;
  return data;
};

export const updateQualityAlert = async (id, { client_name, description, cor }) => {
  let normalized = null;
  let official = null;
  
  if (client_name && client_name.trim() !== '') {
    const res = await normalizeAndGetOfficialName(client_name);
    normalized = res.normalized;
    official = res.official_name;
  }

  const { data, error } = await supabase.from('quality_alerts').update({
    client_name: official || client_name || null,
    client_normalized: normalized || null,
    description,
    cor: cor || null
  }).eq('id', id).select().single();
  
  if (error) throw error;
  return data;
};

export const getAlertsByClient = async (clientName) => {
  if (!clientName) return [];
  const normalized = normalizeClientName(clientName);
  const { data, error } = await supabase.from('quality_alerts').select('*').eq('client_normalized', normalized).eq('active', true);
  if (error) throw error;
  return data || [];
};

export const getAllAlerts = async () => {
  const { data, error } = await supabase.from('quality_alerts').select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const deactivateAlert = async (alertId) => {
  const { data, error } = await supabase.from('quality_alerts').update({ active: false }).eq('id', alertId).select().single();
  if (error) throw error;
  return data;
};

export const checkAlertTrigger = (lote, alert) => {
  if (!lote || !alert) return false;
  
  const hasAlertClient = alert.client_name && alert.client_name.trim() !== '';
  const hasAlertColor = alert.cor && alert.cor.trim() !== '';

  if (!hasAlertClient && !hasAlertColor) return false; // Invalid alert, neither configured

  if (hasAlertClient) {
    const loteClient = lote.cliente ? lote.cliente.trim().toLowerCase() : '';
    const alertClient = alert.client_name.trim().toLowerCase();
    const alertNormalized = alert.client_normalized || '';
    const loteNormalized = normalizeClientName(lote.cliente || '');

    const clientMatches = loteNormalized === alertNormalized || loteClient === alertClient;
    if (!clientMatches) return false;
  }

  if (hasAlertColor) {
    const loteCor = lote.cor ? lote.cor.trim().toLowerCase() : '';
    const alertCor = alert.cor.trim().toLowerCase();
    if (loteCor !== alertCor) return false;
  }

  return true;
};

export const createDailyLogEntry = async (logData) => {
  const { normalized } = await normalizeAndGetOfficialName(logData.cliente || logData.client_name);
  const { data, error } = await supabase.from('quality_daily_log').insert([{
      date: logData.date, 
      cabine: logData.cabine || null, 
      client_name: logData.cliente || logData.client_name,
      client_normalized: normalized, 
      cor: logData.cor || null, 
      pintor: normalizePainterName(logData.pintor), // Applied normalization
      problema: logData.sintoma || logData.problema || null,
      quantidade: logData.quantidade !== undefined ? logData.quantidade : 1, 
      tamanho_peca: logData.tamanho_peca || null,
      observacoes: logData.observacoes || null,
      analysis_conclusion: logData.analysis_conclusion || null, 
      image_url: logData.image_url || null
  }]).select().single();
  if (error) throw error;
  return data;
};

export const updateDailyLogEntry = async (logId, updateData) => {
  if (updateData.client_name || updateData.cliente) {
      const name = updateData.client_name || updateData.cliente;
      const { normalized } = await normalizeAndGetOfficialName(name);
      updateData.client_name = name; updateData.client_normalized = normalized; delete updateData.cliente;
  }
  if (updateData.pintor !== undefined) {
      updateData.pintor = normalizePainterName(updateData.pintor);
  }
  const { data, error } = await supabase.from('quality_daily_log').update(updateData).eq('id', logId).select().single();
  if (error) throw error;
  return data;
};

export const deleteDailyLogEntry = async (logId) => {
  const { error } = await supabase.from('quality_daily_log').delete().eq('id', logId);
  if (error) throw error;
  return true;
};

// --- REPORTS ---

export const getFilteredLogs = async (startDate, endDate, filters = {}) => {
  let query = supabase
    .from('quality_daily_log')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (filters.cabines && filters.cabines.length > 0) query = query.in('cabine', filters.cabines);
  if (filters.pintores && filters.pintores.length > 0) query = query.in('pintor', filters.pintores);
  if (filters.clientes && filters.clientes.length > 0) query = query.in('client_name', filters.clientes);
  if (filters.cores && filters.cores.length > 0) query = query.in('cor', filters.cores);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getLogsForPeriod = async (startDate, endDate) => {
  return getFilteredLogs(startDate, endDate, {});
};

export const getZeroReworkDays = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('quality_daily_log')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('quantidade', 0)
    .ilike('client_normalized', '%sem retrabalho%');
    
  if (error) throw error;
  return data || [];
};

export const calculateWeightedReworkPercentage = (recordsOrWeightedSum, totalPiecesPainted) => {
  if (!totalPiecesPainted || totalPiecesPainted <= 0) return 0;
  let weightedSum = 0;
  if (Array.isArray(recordsOrWeightedSum)) {
    weightedSum = recordsOrWeightedSum.reduce((sum, log) => {
      const qty = parseInt(log.quantidade) || 0;
      if (qty === 0) return sum; // Zero-rework logic handled explicitly
      const weight = getRecordWeight(log.tamanho_peca);
      return sum + (qty * weight);
    }, 0);
  } else {
    weightedSum = recordsOrWeightedSum;
  }
  return (weightedSum / totalPiecesPainted) * 100;
};

export const getReportDataByDateRange = (logs, groupBy = 'day') => {
  const grouped = logs.reduce((acc, log) => {
    const dateKey = log.date; 
    if (!acc[dateKey]) acc[dateKey] = { date: dateKey, totalRework: 0, isZeroRework: false };
    
    const qty = parseInt(log.quantidade) || 0;
    acc[dateKey].totalRework += qty;
    
    if (qty === 0 && (log.client_normalized?.includes('sem retrabalho') || log.client_name === 'SEM RETRABALHO')) {
      acc[dateKey].isZeroRework = true;
    }
    
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getProblemsFrequency = (logs) => {
  const problems = logs.reduce((acc, log) => {
    const qty = parseInt(log.quantidade) || 0;
    if (qty === 0) return acc; // Skip zero-rework logs
    const prob = log.problema || 'Não Informado';
    if (!acc[prob]) acc[prob] = 0;
    acc[prob] += qty;
    return acc;
  }, {});

  const total = Object.values(problems).reduce((sum, val) => sum + val, 0);

  return Object.entries(problems)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count);
};

export const getProblemsFrequencyByClient = (logs) => {
  const problems = {};

  logs.forEach(log => {
    const qty = parseInt(log.quantidade) || 0;
    if (qty === 0) return; // Skip zero-rework logs

    const prob = log.problema || 'Não Informado';
    const client = log.client_name || log.cliente || 'Não Informado';

    if (!problems[prob]) {
      problems[prob] = { sintoma: prob, count: 0, clientMap: {} };
    }
    
    problems[prob].count += qty;
    
    if (!problems[prob].clientMap[client]) {
      problems[prob].clientMap[client] = 0;
    }
    problems[prob].clientMap[client] += qty;
  });

  const total = Object.values(problems).reduce((sum, val) => sum + val.count, 0);

  return Object.values(problems).map(prob => {
    const byClient = Object.entries(prob.clientMap)
      .map(([client_name, count]) => ({ client_name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sintoma: prob.sintoma,
      count: prob.count,
      percentage: total > 0 ? ((prob.count / total) * 100).toFixed(1) : 0,
      byClient
    };
  }).sort((a, b) => b.count - a.count);
};

export const getSolutionsByProblem = (logs) => {
  const solutions = logs.reduce((acc, log) => {
    const qty = parseInt(log.quantidade) || 0;
    if (qty === 0) return acc; // Skip zero-rework logs
    const prob = log.problema || 'Não Informado';
    const sol = log.analysis_conclusion || 'Sem conclusão';
    if (!acc[prob]) acc[prob] = {};
    if (!acc[prob][sol]) acc[prob][sol] = 0;
    acc[prob][sol] += 1;
    return acc;
  }, {});

  return Object.entries(solutions).map(([problem, sols]) => ({
    problem,
    solutions: Object.entries(sols).map(([name, count]) => ({ name, count }))
  }));
};

export const getFilterOptions = async () => {
  const { data, error } = await supabase.from('quality_daily_log').select('cabine, pintor, client_name, cor');
  if (error) throw error;
  
  const cabines = [...new Set(data.map(d => d.cabine).filter(Boolean))].sort();
  // Normalize painters to consolidate duplicated cases like "Luiz" and "luiz"
  const pintores = [...new Set(data.map(d => normalizePainterName(d.pintor)).filter(p => p !== 'Sem Pintor'))].sort();
  const clientes = [...new Set(data.map(d => d.client_name).filter(c => c && c !== 'SEM RETRABALHO'))].sort();
  const cores = [...new Set(data.map(d => d.cor).filter(Boolean))].sort();

  return { cabines, pintores, clientes, cores };
};

export const getDailyLogDates = async () => {
  try {
    const { data, error } = await supabase.from('quality_daily_log').select('date').order('date', { ascending: false });
    if (error) throw error;
    const uniqueDates = [...new Set(data.map(d => d.date))];
    return uniqueDates;
  } catch (error) {
    console.error('Error fetching daily log dates:', error);
    throw error;
  }
};

export const getDailyLogByDate = async (date) => {
  if (!date) return [];
  try {
    const { data, error } = await supabase
      .from('quality_daily_log')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getDailyLogByDate:', error);
    return [];
  }
};

export const uploadAlertImage = async (file) => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');
  if (!file.type.startsWith('image/')) throw new Error('O arquivo deve ser uma imagem.');

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('alerts')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('alerts')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Falha ao fazer upload da imagem.');
  }
};

export const getWeightedMetricsForAllCabines = async (startOrRange, endStr) => {
  let startDate, endDate;
  
  if (typeof startOrRange === 'object' && startOrRange !== null) {
    startDate = startOrRange.startDate || startOrRange.start;
    endDate = startOrRange.endDate || startOrRange.end;
  } else {
    startDate = startOrRange;
    endDate = endStr;
  }

  if (!startDate || !endDate) return [];
  
  try {
    const { data: logs, error } = await supabase
      .from('quality_daily_log')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    if (!logs || logs.length === 0) return [];

    const cabineMap = {};

    logs.forEach(log => {
      const qty = parseInt(log.quantidade) || 0;
      if (qty === 0) return; // Ignore zero rework for cabine metrics
      
      const cab = log.cabine || 'Sem Cabine';
      if (!cabineMap[cab]) {
        cabineMap[cab] = {
          cabine: cab,
          logs: [],
          rawRework: 0,
          weightedRework: 0,
          problems: {},
          painters: {},
          total_records: 0,
          problem_frequency: {},
          defect_rate: 0,
          rework_rate: 0,
          severity_average: 0
        };
      }

      const weight = getRecordWeight(log.tamanho_peca);
      
      const cabData = cabineMap[cab];
      cabData.logs.push(log);
      cabData.rawRework += qty;
      cabData.weightedRework += (qty * weight);
      cabData.total_records += 1;

      const prob = log.problema || 'Não Informado';
      cabData.problems[prob] = (cabData.problems[prob] || 0) + qty;
      cabData.problem_frequency[prob] = cabData.problems[prob];

      const pintor = normalizePainterName(log.pintor);
      cabData.painters[pintor] = (cabData.painters[pintor] || 0) + qty;
    });

    return Object.values(cabineMap).map(cab => {
       cab.defect_rate = cab.total_records > 0 ? (cab.logs.filter(l => l.problema).length / cab.total_records) * 100 : 0;
       cab.rework_rate = cab.total_records > 0 ? (cab.logs.filter(l => (parseInt(l.quantidade) || 0) > 0).length / cab.total_records) * 100 : 0;
       cab.severity_average = cab.total_records > 0 ? (cab.weightedRework / cab.total_records) : 0;
       return cab;
    }).sort((a, b) => {
       if (a.cabine === 'Sem Cabine') return 1;
       if (b.cabine === 'Sem Cabine') return -1;
       return String(a.cabine).localeCompare(String(b.cabine), undefined, {numeric: true});
    });

  } catch (error) {
    console.error('Error fetching cabine metrics:', error);
    return [];
  }
};
