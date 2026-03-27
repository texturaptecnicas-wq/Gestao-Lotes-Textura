
export const normalizePainterName = (name) => {
  if (!name || typeof name !== 'string') return 'Sem Pintor';
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean || clean.toLowerCase() === 'sem pintor') return 'Sem Pintor';
  
  // Capitalize first letter of each word (e.g., "luiz" -> "Luiz")
  return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};
