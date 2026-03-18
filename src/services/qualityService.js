
import { supabase } from '@/lib/customSupabaseClient';
import { normalizeClientName } from '@/utils/clientNormalization';

/**
 * Sistema de Cálculo Ponderado (Weighted Calculation System)
 * 
 * Este sistema ajusta o impacto do retrabalho com base no tamanho da peça.
 * Peças maiores consomem mais tempo e material, portanto têm um peso maior no cálculo
 * das métricas de qualidade.
 * 
 * Valores de Peso por Tamanho (Piece Size Weights):
 * - muito_pequena: 0.5 (Impacto reduzido)
 * - pequena: 1.0 (Impacto padrão/base)
 * - media: 1.5 (Impacto moderado)
 * - grande: 2.0 (Alto impacto)
 * - muito_grande: 3.0 (Impacto crítico)
 */
const SIZE_WEIGHTS = {
  'muito_pequena': 0.5,
  'pequena': 1.0,
  'media': 1.5,
  'grande': 2.0,
  'muito_grande': 3.0
};

/**
 * Obtém o peso numérico para um determinado tamanho de peça.
 * @param {string} tamanho_peca - O identificador do tamanho (ex: 'media')
 * @returns {number} O multiplicador de peso
 */
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

export const createQualityAlert = async ({ client_name, description, image_url, created_by }) => {
  const { normalized } = await normalizeAndGetOfficialName(client_name);
  const { data, error } = await supabase.from('quality_alerts').insert([{ client_name, client_normalized: normalized, description, image_url, created_by, active: true }]).select().single();
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

export const getDailyLogByDate = async (date) => {
  const { data, error } = await supabase.from('quality_daily_log').select('*').eq('date', date).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getDailyLogDates = async () => {
  const { data, error } = await supabase.from('quality_daily_log').select('date').order('date', { ascending: false });
  if (error) throw error;
  const uniqueDates = [...new Set(data.map(item => item.date))];
  return uniqueDates;
};

export const getDailyLogByCabine = async (cabine, date) => {
  const { data, error } = await supabase.from('quality_daily_log').select('*').eq('cabine', cabine).eq('date', date).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
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

export const transformLogToAlert = async (logId) => {
  const { data: log, error: fetchError } = await supabase.from('quality_daily_log').select('*').eq('id', logId).maybeSingle(); 
  if (fetchError) throw fetchError;
  if (!log) throw new Error('Log not found');
  const description = log.analysis_conclusion ? `Origem: Cabine ${log.cabine} (${log.date})\nSintoma: ${log.problema || 'N/A'}\nConclusão: ${log.analysis_conclusion}` : `Origem: Cabine ${log.cabine} (${log.date})\nSintoma: ${log.problema || 'N/A'}`;
  const alert = await createQualityAlert({ client_name: log.client_name, description: description, image_url: log.image_url || '', created_by: 'Sistema' });
  return alert;
};

export const uploadQualityImage = async (file) => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');
  const fileExt = file.name.split('.').pop(); const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const { error } = await supabase.storage.from('quality_images').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('quality_images').getPublicUrl(fileName);
  return data.publicUrl;
};

export const uploadAlertImage = async (file) => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');
  if (!file.type.startsWith('image/')) throw new Error('Apenas arquivos de imagem são permitidos.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem excede o tamanho máximo de 5MB.');
  const fileExt = file.name.split('.').pop(); const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const { error } = await supabase.storage.from('alerts').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Falha ao enviar a imagem. Tente novamente.');
  const { data } = supabase.storage.from('alerts').getPublicUrl(fileName);
  return data.publicUrl;
};

export const saveDailyObservation = async (date, observation) => {
  const { data, error } = await supabase.from('quality_daily_log').upsert({ date, observacoes: observation, updated_at: new Date().toISOString() }, { onConflict: 'date' }).select().single();
  if (error) throw error;
  return data;
};

export const getDailyObservation = async (date) => {
  const { data, error } = await supabase.from('quality_daily_log').select('observacoes').eq('date', date).maybeSingle(); 
  if (error) throw error;
  return data ? { observation: data.observacoes || '' } : { observation: '' };
};

// REPORTS & METRICS
export const getLogsForPeriod = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('quality_daily_log')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getQualityReport = async (periodType, periodStart, periodEnd) => {
  const { data, error } = await supabase
    .from('quality_reports')
    .select('*')
    .eq('period_type', periodType)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const saveQualityReport = async (reportData) => {
  const payload = {
    ...reportData,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('quality_reports')
    .upsert(payload, { onConflict: 'period_type,period_start,period_end' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Calcula a porcentagem de retrabalho usando a soma ponderada de peças.
 * @param {Array|number} recordsOrWeightedSum - Array de registros OU a soma ponderada já calculada.
 * @param {number} totalPiecesPainted - O total de peças pintadas (base para a %).
 * @returns {number} A porcentagem de retrabalho ponderado.
 */
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

/**
 * Obtém métricas ponderadas para um período específico.
 * Retorna as peças de retrabalho ponderadas baseadas no config de tamanhos.
 * @param {string} startDate - Data inicial (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 */
export const getWeightedMetricsForPeriod = async (startDate, endDate) => {
  const logs = await getLogsForPeriod(startDate, endDate);
  
  const weightedReworkPieces = logs.reduce((sum, log) => {
    const qty = parseInt(log.quantidade) || 0;
    const weight = getRecordWeight(log.tamanho_peca);
    return sum + (qty * weight);
  }, 0);

  return {
    logs,
    weightedReworkPieces,
    rawReworkPieces: logs.reduce((sum, log) => sum + (parseInt(log.quantidade) || 0), 0)
  };
};

/**
 * Obtém métricas ponderadas por cabine específica.
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {number|string} cabine - O número da cabine
 */
export const getWeightedMetricsByCabine = async (startDate, endDate, cabine) => {
  const { data, error } = await supabase
    .from('quality_daily_log')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('cabine', cabine);
    
  if (error) throw error;
  
  const logs = data || [];
  const weightedReworkPieces = logs.reduce((sum, log) => {
    const qty = parseInt(log.quantidade) || 0;
    const weight = getRecordWeight(log.tamanho_peca);
    return sum + (qty * weight);
  }, 0);

  return { logs, weightedReworkPieces };
};

/**
 * Obtém métricas agrupadas por cabine para comparação.
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 */
export const getWeightedMetricsForAllCabines = async (startDate, endDate) => {
  const logs = await getLogsForPeriod(startDate, endDate);
  
  const cabineStats = {};
  
  logs.forEach(log => {
    const cabineId = log.cabine || 'N/I';
    if (!cabineStats[cabineId]) {
      cabineStats[cabineId] = {
        cabine: cabineId,
        logs: [],
        weightedRework: 0,
        rawRework: 0,
        problems: {},
        painters: {}
      };
    }
    
    cabineStats[cabineId].logs.push(log);
    
    const qty = parseInt(log.quantidade) || 0;
    const weight = getRecordWeight(log.tamanho_peca);
    const weightedQty = qty * weight;
    
    cabineStats[cabineId].weightedRework += weightedQty;
    cabineStats[cabineId].rawRework += qty;
    
    if (log.problema) {
      cabineStats[cabineId].problems[log.problema] = (cabineStats[cabineId].problems[log.problema] || 0) + weightedQty;
    }
    if (log.pintor) {
      cabineStats[cabineId].painters[log.pintor] = (cabineStats[cabineId].painters[log.pintor] || 0) + weightedQty;
    }
  });

  return Object.values(cabineStats);
};

export const calculateMetricAggregations = (records) => {
  const aggregations = {
    clients: {},
    colors: {},
    painters: {},
    sizes: {},
    problems: {}
  };

  records.forEach(log => {
    const qty = parseInt(log.quantidade) || 0;
    const weight = getRecordWeight(log.tamanho_peca);
    const weightedQty = qty * weight; // Apply weight to all aggregations for consistency
    
    // Client
    if (log.client_name) {
      aggregations.clients[log.client_name] = (aggregations.clients[log.client_name] || 0) + weightedQty;
    }
    
    // Color
    if (log.cor) {
      aggregations.colors[log.cor] = (aggregations.colors[log.cor] || 0) + weightedQty;
    }
    
    // Painter
    if (log.pintor) {
      aggregations.painters[log.pintor] = (aggregations.painters[log.pintor] || 0) + weightedQty;
    }
    
    // Size
    const sizeVal = log.tamanho_peca || 'N/I';
    aggregations.sizes[sizeVal] = (aggregations.sizes[sizeVal] || 0) + weightedQty;
    
    // Problem
    if (log.problema) {
      aggregations.problems[log.problema] = (aggregations.problems[log.problema] || 0) + weightedQty;
    }
  });

  const topFromDict = (dict) => {
    const sorted = Object.entries(dict).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1].toFixed(1) } : null;
  };

  return {
    aggregations,
    topClient: topFromDict(aggregations.clients),
    topColor: topFromDict(aggregations.colors),
    topPainter: topFromDict(aggregations.painters),
    topSize: topFromDict(aggregations.sizes),
    topProblem: topFromDict(aggregations.problems)
  };
};
