export const deduplicateConclusions = (logs) => {
  if (!logs || !Array.isArray(logs)) return [];
  
  // Group conclusions by problem
  const grouped = logs.reduce((acc, log) => {
    const prob = log.problema || 'Não Informado';
    const conc = log.analysis_conclusion || 'Sem conclusão';
    
    if (!acc[prob]) acc[prob] = {};
    if (!acc[prob][conc]) acc[prob][conc] = 0;
    acc[prob][conc] += 1;
    
    return acc;
  }, {});

  // Format into structured array
  return Object.entries(grouped)
    .map(([problem, conclusionsObj]) => {
      const conclusions = Object.entries(conclusionsObj)
        .map(([conclusion, frequency]) => ({ conclusion, frequency }))
        .sort((a, b) => b.frequency - a.frequency);
      
      return { problem, conclusions };
    })
    .sort((a, b) => {
      const sumA = a.conclusions.reduce((s, c) => s + c.frequency, 0);
      const sumB = b.conclusions.reduce((s, c) => s + c.frequency, 0);
      return sumB - sumA;
    });
};