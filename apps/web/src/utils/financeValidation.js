export const validateFinancialRecord = (data) => {
  const errors = {};

  if (!data.descricao || data.descricao.trim() === '') errors.descricao = 'Descrição é obrigatória.';
  if (!validateTipo(data.tipo)) errors.tipo = 'Tipo deve ser entrada ou saida.';
  
  const parsedValor = parseFloat(data.valor);
  if (isNaN(parsedValor) || parsedValor <= 0) errors.valor = 'Valor deve ser um número positivo.';
  
  if (!data.data_lancamento) errors.data_lancamento = 'Data é obrigatória.';
  if (!validateCategoria(data.categoria)) errors.categoria = 'Categoria inválida.';
  if (!validateStatus(data.status)) errors.status = 'Status inválido.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validateTipo = (tipo) => {
  return ['entrada', 'saida'].includes(tipo);
};

export const validateCategoria = (categoria) => {
  const categoriasValidas = ['PIX', 'PIX_PENDENTE', 'PIX_RECEBIDO', 'Pagamento', 'Despesa', 'Salário', 'Imposto', 'Outros'];
  return categoria && categoria.trim() !== ''; // Allow dynamic for now, or enforce strict list
};

export const validateStatus = (status) => {
  return ['pendente', 'confirmado', 'cancelado'].includes(status);
};