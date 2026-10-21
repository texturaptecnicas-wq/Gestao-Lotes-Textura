// Utilitários de agrupamento de clientes para o módulo financeiro.
//
// A consolidação é apenas de apresentação/cálculo: nenhum lançamento é
// alterado ou reescrito no banco. O nome original é preservado nas
// transações; apenas a chave de agrupamento passa por uma normalização
// cuidadosa para juntar o mesmo cliente escrito de formas ligeiramente
// diferentes (maiúsculas/minúsculas, acentos, espaços extras, pequenos erros
// de digitação).
//
// Para evitar misturar clientes diferentes, a correspondência aproximada é
// conservadora: exige alta similaridade entre os nomes normalizados.

// Normalização para comparação: minúsculas, sem acentos, espaços colapsados,
// sem espaços nas pontas. Mantém espaços internos (diferente do
// clientNormalization genérico) para não fundir nomes compostos distintos.
//
// Também remove rótulos transacionais prefixados (ex.: "PIX Recebido: ",
// "PIX Pendente: ", "PIX: ") para que um lançamento feito como
// "PIX Recebido: PLACRIM" seja agrupado com um lançamento "PLACRIM".
// Apenas o nome do cliente sob o rótulo é considerado para o agrupamento.
export const normalizeFinanceClient = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    // Remove rótulos transacionais à esquerda seguidos de ":".
    // Ex.: "pix recebido: placrim" -> "placrim".
    .replace(/^pix(\s+[^:]*)?\s*:\s*/i, '')
    .replace(/^(recebido|pago|enviado|pendente)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos/diacríticos
    .replace(/[.\-_/\\]+/g, ' ') // separadores comuns viram espaço
    .replace(/\s+/g, ' ')
    .trim();
};

// Distância de Levenshtein (número de edições para transformar a em b).
const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
};

// Decide se dois nomes normalizados devem ser considerados o mesmo cliente.
// Conservador: 1 erro tolerado para nomes curtos (>=3), 2 para nomes longos
// (>=7). Nomes muito curtos (<3) exigem correspondência exata para evitar
// fusões indevidas.
export const shouldMergeClients = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 3) return false;
  const dist = levenshtein(a, b);
  const threshold = maxLen >= 7 ? 2 : 1;
  // Exige ainda que a similaridade relativa seja alta (>= 0.82).
  const similarity = 1 - dist / maxLen;
  return dist <= threshold && similarity >= 0.82;
};

// Constrói um mapa de nome original -> nome canônico de exibição.
//
// O nome canônico é a grafia original mais frequente dentro do grupo (desempate
// pela primeira ocorrência), de forma que o texto exibido continue sendo um
// nome real digitado pelo usuário.
//
// `names` deve ser um array de strings (nomes originais, na ordem de exibição).
export const buildCanonicalClientMap = (names) => {
  const map = {};
  if (!names || names.length === 0) return map;

  // Conta frequência de cada grafia original.
  const freq = {};
  for (const name of names) {
    const key = name || 'Sem Cliente Especificado';
    freq[key] = (freq[key] || 0) + 1;
  }

  const uniqueOriginals = Object.keys(freq);
  const normalizedOf = {};
  for (const name of uniqueOriginals) {
    normalizedOf[name] = normalizeFinanceClient(name);
  }

  // Union-find simples sobre as grafias originais.
  const parent = {};
  for (const name of uniqueOriginals) parent[name] = name;
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (x, y) => {
    const rx = find(x);
    const ry = find(y);
    if (rx === ry) return;
    // Mantém como raiz a grafia mais frequente (desempate por ordem de entrada
    // estável via índice no array uniqueOriginals).
    const idxRx = uniqueOriginals.indexOf(rx);
    const idxRy = uniqueOriginals.indexOf(ry);
    const root = freq[rx] > freq[ry] || (freq[rx] === freq[ry] && idxRx < idxRy) ? rx : ry;
    const child = root === rx ? ry : rx;
    parent[child] = root;
  };

  for (let i = 0; i < uniqueOriginals.length; i++) {
    for (let j = i + 1; j < uniqueOriginals.length; j++) {
      const a = uniqueOriginals[i];
      const b = uniqueOriginals[j];
      if (shouldMergeClients(normalizedOf[a], normalizedOf[b])) {
        union(a, b);
      }
    }
  }

  for (const name of uniqueOriginals) {
    map[name] = find(name);
  }
  return map;
};
