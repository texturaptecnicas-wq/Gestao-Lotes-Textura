
import { supabase } from '@/lib/customSupabaseClient';
import { normalizeClientName } from '@/utils/clientNormalization';

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
  const { normalized } = await normalizeAndGetOfficialName(client_name);
  const { data, error } = await supabase.from('quality_alerts').insert([{ 
    client_name, 
    client_normalized: normalized, 
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
  const { normalized } = await normalizeAndGetOfficialName(client_name);
  const { data, error } = await supabase.from('quality_alerts').update({
    client_name,
    client_normalized: normalized,
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
  
  // 1) Case insensitive client match
  const loteClient = lote.cliente ? lote.cliente.trim().toLowerCase() : '';
  const alertClient = alert.client_name ? alert.client_name.trim().toLowerCase() : '';
  const alertNormalized = alert.client_normalized ? alert.client_normalized : '';
  const loteNormalized = normalizeClientName(lote.cliente || '');

  const clientMatches = loteNormalized === alertNormalized || loteClient === alertClient;
  if (!clientMatches) return false;

  // 2) Case insensitive color match
  if (alert.cor && alert.cor.trim() !== '') {
    const loteCor = lote.cor ? lote.cor.trim().toLowerCase() : '';
    const alertCor = alert.cor.trim().toLowerCase();
    
    return loteCor === alertCor;
  }
  
  // 3) If alert.cor is null or empty, it triggers for all colors of this client
  return true;
};

export const createDailyLogEntry = async (logData) => {
  const { normalized } = await normalizeAndGetOfficialName(logData.cliente || logData.client_name);
  const { data, error } = await supabase.from('quality_daily_log').insert([{
      date: logData.date, 
      cabine: logData.cabine, 
      client_name: logData.cliente || logData.client_name,
      client_normalized: normalized, 
      cor: logData.cor, 
      pintor: logData.pintor, 
      problema: logData.sintoma || logData.problema,
      quantidade: logData.quantidade, 
      tamanho_peca: logData.tamanho_peca,
      analysis_conclusion: logData.analysis_conclusion, 
      image_url: logData.image_url
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
  const { data, error } = await supabase.from('quality_daily_log').update(updateData).eq('id', logId).select().single();
  if (error) throw error;
  return data;
};

export const deleteDailyLogEntry = async (logId) => {
  const { error } = await supabase.from('quality_daily_log').delete().eq('id', logId);
  if (error) throw error;
  return true;
};

// --- REPORTS & NEW ANALYTICS ---

export const getFilteredLogs = async (startDate, endDate, filters = {}) => {
  let query = supabase
    .from('quality_daily_log')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (filters.cabines && filters.cabines.length > 0) {
    query = query.in('cabine', filters.cabines);
  }
  if (filters.pintores && filters.pintores.length > 0) {
    query = query.in('pintor', filters.pintores);
  }
  if (filters.clientes && filters.clientes.length > 0) {
    query = query.in('client_name', filters.clientes);
  }
  if (filters.cores && filters.cores.length > 0) {
    query = query.in('cor', filters.cores);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Existing
export const getLogsForPeriod = async (startDate, endDate) => {
  return getFilteredLogs(startDate, endDate, {});
};

export const calculateWeightedReworkPercentage = (recordsOrWeightedSum, totalPiecesPainted) => {
  if (!totalPiecesPainted || totalPiecesPainted <= 0) return 0;
  let weightedSum = 0;
  if (Array.isArray(recordsOrWeightedSum)) {
    weightedSum = recordsOrWeightedSum.reduce((sum, log) => {
      const qty = parseInt(log.quantidade) || 0;
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
    if (!acc[dateKey]) acc[dateKey] = { date: dateKey, totalRework: 0 };
    acc[dateKey].totalRework += (parseInt(log.quantidade) || 0);
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getProblemsFrequency = (logs) => {
  const problems = logs.reduce((acc, log) => {
    const prob = log.problema || 'Não Informado';
    if (!acc[prob]) acc[prob] = 0;
    acc[prob] += (parseInt(log.quantidade) || 0);
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

export const getSolutionsByProblem = (logs) => {
  const solutions = logs.reduce((acc, log) => {
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

export const getComparisonWithPreviousPeriod = async (startDate, endDate, filters = {}) => {
  const currentLogs = await getFilteredLogs(startDate, endDate, filters);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays + 1);

  const formatD = (d) => d.toISOString().split('T')[0];
  const prevLogs = await getFilteredLogs(formatD(prevStart), formatD(prevEnd), filters);

  const currentRework = currentLogs.reduce((sum, l) => sum + (parseInt(l.quantidade) || 0), 0);
  const prevRework = prevLogs.reduce((sum, l) => sum + (parseInt(l.quantidade) || 0), 0);

  let change = 0;
  if (prevRework > 0) {
    change = ((currentRework - prevRework) / prevRework) * 100;
  } else if (currentRework > 0) {
    change = 100;
  }

  return {
    currentRework,
    prevRework,
    changePercentage: change,
    trend: change > 0 ? 'piorando' : (change < 0 ? 'melhorando' : 'estável')
  };
};

export const getFilterOptions = async () => {
  const { data, error } = await supabase.from('quality_daily_log').select('cabine, pintor, client_name, cor');
  if (error) throw error;
  
  const cabines = [...new Set(data.map(d => d.cabine).filter(Boolean))].sort();
  const pintores = [...new Set(data.map(d => d.pintor).filter(Boolean))].sort();
  const clientes = [...new Set(data.map(d => d.client_name).filter(Boolean))].sort();
  const cores = [...new Set(data.map(d => d.cor).filter(Boolean))].sort();

  return { cabines, pintores, clientes, cores };
};

// --- NEWLY RESTORED FUNCTIONS ---

export const transformLogToAlert = async (logEntry, specificColor = null) => {
  try {
    let logData = logEntry;
    
    if (typeof logEntry === 'string') {
      const { data, error } = await supabase
        .from('quality_daily_log')
        .select('*')
        .eq('id', logEntry)
        .single();
      if (error) throw error;
      logData = data;
    }

    const description = `Problema: ${logData.problema || 'N/A'}. Tamanho: ${logData.tamanho_peca || 'N/A'}. Cabine: ${logData.cabine || 'N/A'}. Obs: ${logData.observacoes || ''}`;

    let alertColor = specificColor !== undefined ? specificColor : logData.cor;
    if (alertColor === '') alertColor = null;

    const alertData = {
      client_name: logData.client_name || logData.cliente || 'Desconhecido',
      client_normalized: logData.client_normalized || 'desconhecido',
      description: description.trim(),
      image_url: logData.image_url,
      created_by: logData.pintor || 'Sistema',
      cor: alertColor || null,
      active: true
    };

    const { data: newAlert, error: alertError } = await supabase
      .from('quality_alerts')
      .insert([alertData])
      .select()
      .single();

    if (alertError) throw alertError;
    return newAlert;
  } catch (error) {
    console.error('Error transforming log to alert:', error);
    throw error;
  }
};

export const getDailyLogByDate = async (date) => {
  try {
    const { data, error } = await supabase
      .from('quality_daily_log')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching daily log by date:', error);
    throw error;
  }
};

export const getDailyLogDates = async () => {
  try {
    const { data, error } = await supabase
      .from('quality_daily_log')
      .select('date')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    const uniqueDates = [...new Set(data.map(d => d.date))];
    return uniqueDates;
  } catch (error) {
    console.error('Error fetching daily log dates:', error);
    throw error;
  }
};

export const uploadAlertImage = async (file, alertId = 'new') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${alertId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('alerts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('alerts').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading alert image:', error);
    throw error;
  }
};

export const getWeightedMetricsForAllCabines = async (startDate, endDate) => {
  try {
    const logs = await getFilteredLogs(startDate, endDate, {});
    
    const grouped = logs.reduce((acc, log) => {
      const cab = log.cabine || 'N/A';
      if (!acc[cab]) {
        acc[cab] = {
          cabine: cab,
          weightedRework: 0,
          rawRework: 0,
          problems: {},
          painters: {},
          logs: []
        };
      }
      
      const qty = parseInt(log.quantidade) || 0;
      const weight = getRecordWeight(log.tamanho_peca);
      
      acc[cab].rawRework += qty;
      acc[cab].weightedRework += (qty * weight);
      acc[cab].logs.push(log);
      
      const prob = log.problema || 'N/A';
      if (!acc[cab].problems[prob]) acc[cab].problems[prob] = 0;
      acc[cab].problems[prob] += qty;
      
      const painter = log.pintor || 'N/A';
      if (!acc[cab].painters[painter]) acc[cab].painters[painter] = 0;
      acc[cab].painters[painter] += qty;
      
      return acc;
    }, {});
    
    return Object.values(grouped);
  } catch (error) {
    console.error('Error calculating weighted metrics for cabines:', error);
    throw error;
  }
};

export const getQualityReport = async (periodType, startDate, endDate) => {
  try {
    const { data } = await supabase
      .from('quality_reports')
      .select('*')
      .eq('period_type', periodType)
      .eq('period_start', startDate)
      .eq('period_end', endDate)
      .maybeSingle();
    return data;
  } catch (error) {
    console.error('Error fetching quality report:', error);
    return null;
  }
};

export const saveQualityReport = async (reportData) => {
  try {
    const { data, error } = await supabase
      .from('quality_reports')
      .upsert([reportData])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quality report:', error);
    throw error;
  }
};

export const calculateMetricAggregations = (logs) => {
  const aggregations = { clients: {}, colors: {}, painters: {}, problems: {}, sizes: {} };
  
  logs.forEach(log => {
    const qty = parseInt(log.quantidade) || 0;
    
    if (log.client_name) {
      aggregations.clients[log.client_name] = (aggregations.clients[log.client_name] || 0) + qty;
    }
    if (log.cor) {
      aggregations.colors[log.cor] = (aggregations.colors[log.cor] || 0) + qty;
    }
    if (log.pintor) {
      aggregations.painters[log.pintor] = (aggregations.painters[log.pintor] || 0) + qty;
    }
    if (log.problema) {
      aggregations.problems[log.problema] = (aggregations.problems[log.problema] || 0) + qty;
    }
    if (log.tamanho_peca) {
      aggregations.sizes[log.tamanho_peca] = (aggregations.sizes[log.tamanho_peca] || 0) + qty;
    }
  });
  
  return { aggregations };
};
