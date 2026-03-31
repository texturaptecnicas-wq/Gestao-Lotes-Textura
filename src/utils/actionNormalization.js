export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Convert to lowercase, remove accents, and remove duplicate spaces
  let normalized = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim();

  // Standardize singular/plural forms
  normalized = normalized.replace(/\bpeça\b/g, 'peças');
  normalized = normalized.replace(/\bar na\b/g, 'ar nas');
  normalized = normalized.replace(/\bar no\b/g, 'ar nos');

  return normalized;
};

export const groupAndCountActions = (actions) => {
  if (!actions || !Array.isArray(actions)) return [];

  const groups = {};

  actions.forEach(actionText => {
    if (!actionText || typeof actionText !== 'string') return;
    
    const normalized = normalizeText(actionText);

    if (!groups[normalized]) {
      groups[normalized] = {
        label: actionText.trim(), // Preserve original text of the first occurrence
        count: 0
      };
    }
    
    groups[normalized].count += 1;
  });

  // Return sorted by count descending
  return Object.values(groups).sort((a, b) => b.count - a.count);
};