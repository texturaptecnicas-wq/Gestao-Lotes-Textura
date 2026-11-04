// Normalização e comparação tolerante de nomes de cor para o agrupamento da
// programação. Trata maiúsculas/minúsculas, acentos, espaços e pontuação
// ("Preto-TX", "preto  tx", "PRETO TX", "pretotx") e pequenos erros de
// digitação (1 letra em palavras de 4–6 letras, até 2 letras em palavras de
// 7+ letras: "Grafte" == "Grafite", "Marron" == "Marrom").
//
// Para não juntar cores realmente diferentes, a tolerância NÃO se aplica a:
// - palavras com números (códigos como "RAL 9005" x "RAL 9006");
// - palavras curtas de até 3 letras (sufixos como "TX" x "LS");
// - nomes com quantidade diferente de palavras.

const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Forma legível normalizada: minúsculas, sem acentos, pontuação vira espaço.
export const normCor = (s) =>
  stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Chave compacta: ignora todos os espaços ("preto tx" == "pretotx").
export const colorKey = (s) => normCor(s).replace(/\s+/g, '');

// Distância de edição (Damerau/OSA): inserção, remoção, troca de letra e
// inversão de letras vizinhas ("prteo" -> "preto") contam 1 cada.
const editDistance = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
};

const allowedEdits = (len) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

// Distância entre duas cores, ou null se não forem consideradas a mesma cor.
// 0 = idênticas após normalização.
export const colorDistance = (a, b) => {
  const ka = colorKey(a);
  const kb = colorKey(b);
  if (!ka || !kb) return null;
  if (ka === kb) return 0;
  const ta = normCor(a).split(' ');
  const tb = normCor(b).split(' ');
  if (ta.length !== tb.length) return null;
  let total = 0;
  for (let i = 0; i < ta.length; i++) {
    const x = ta[i];
    const y = tb[i];
    if (x === y) continue;
    if (/\d/.test(x) || /\d/.test(y)) return null;
    const max = allowedEdits(Math.min(x.length, y.length));
    if (max === 0) return null;
    if (Math.abs(x.length - y.length) > max) return null;
    const d = editDistance(x, y);
    if (d > max) return null;
    total += d;
  }
  return total;
};

export const isSameColor = (a, b) => colorDistance(a, b) !== null;

// Procura, entre as cores existentes, a que corresponde à cor digitada.
// Prefere correspondência exata (após normalização) e depois a de menor
// distância. Retorna a forma já armazenada (canônica) ou null.
export const findMatchingColor = (input, candidates) => {
  let best = null;
  let bestDist = Infinity;
  for (const c of candidates || []) {
    const d = colorDistance(input, c);
    if (d !== null && d < bestDist) {
      best = c;
      bestDist = d;
      if (d === 0) break;
    }
  }
  return best;
};

// Lista de cores sem variações duplicadas (mantém a primeira forma vista).
export const uniqueColors = (colors) => {
  const seen = new Map();
  (colors || []).forEach((c) => {
    if (!c) return;
    const k = colorKey(c);
    if (!seen.has(k)) seen.set(k, c);
  });
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
};
