import { supabase } from '@/lib/customSupabaseClient';
import { validateFinancialRecord } from '@/utils/financeValidation';

// Cria registro de auditoria
const createAuditLog = async (recordId, acao, dadosAnteriores, dadosNovos, usuario = 'Sistema') => {
  try {
    await supabase.from('financial_audit_log').insert([{
      financial_record_id: recordId,
      acao,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos,
      usuario
    }]);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const getFinancialRecords = async (filters = {}) => {
  let query = supabase
    .from('financial_records')
    .select('*')
    .order('data_lancamento', { ascending: false });

  if (filters.startDate && filters.endDate) {
    query = query.gte('data_lancamento', filters.startDate).lte('data_lancamento', filters.endDate);
  }
  if (filters.tipo && filters.tipo !== 'todos') query = query.eq('tipo', filters.tipo);
  if (filters.categoria && filters.categoria !== 'todos') query = query.eq('categoria', filters.categoria);
  if (filters.status && filters.status !== 'todos') query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createFinancialRecord = async (data, usuario = 'Sistema') => {
  const validation = validateFinancialRecord(data);
  if (!validation.isValid) throw new Error(Object.values(validation.errors).join(', '));

  const payload = {
    descricao: data.descricao,
    tipo: data.tipo,
    valor: parseFloat(data.valor),
    data_lancamento: data.data_lancamento,
    categoria: data.categoria,
    status: data.status,
    observacoes: data.observacoes || null
  };

  const { data: result, error } = await supabase
    .from('financial_records')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  
  await createAuditLog(result.id, 'criado', null, result, usuario);
  return result;
};

export const updateFinancialRecord = async (id, data, usuario = 'Sistema') => {
  // Buscar anterior
  const { data: previousData, error: fetchError } = await supabase
    .from('financial_records')
    .select('*')
    .eq('id', id)
    .single();
    
  if (fetchError) throw fetchError;

  const validation = validateFinancialRecord(data);
  if (!validation.isValid) throw new Error(Object.values(validation.errors).join(', '));

  const payload = {
    descricao: data.descricao,
    tipo: data.tipo,
    valor: parseFloat(data.valor),
    data_lancamento: data.data_lancamento,
    categoria: data.categoria,
    status: data.status,
    observacoes: data.observacoes || null,
    updated_at: new Date().toISOString()
  };

  const { data: result, error } = await supabase
    .from('financial_records')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  await createAuditLog(id, 'atualizado', previousData, result, usuario);
  return result;
};

export const deleteFinancialRecord = async (id, usuario = 'Sistema') => {
  const { data: previousData } = await supabase
    .from('financial_records')
    .select('*')
    .eq('id', id)
    .single();

  // Soft delete
  const { data: result, error } = await supabase
    .from('financial_records')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  await createAuditLog(id, 'deletado', previousData, result, usuario);
  return result;
};

export const getFinancialSummary = async (filters = {}) => {
  const records = await getFinancialRecords(filters);
  
  let totalEntradas = 0;
  let totalSaidas = 0;

  records.forEach(r => {
    if (r.status !== 'cancelado') {
      const val = parseFloat(r.valor);
      if (r.tipo === 'entrada') totalEntradas += val;
      if (r.tipo === 'saida') totalSaidas += val;
    }
  });

  return {
    totalEntradas,
    totalSaidas,
    saldoLiquido: totalEntradas - totalSaidas
  };
};