export const calculateTrendency = (currentPeriodRework, previousPeriodRework) => {
  const current = parseFloat(currentPeriodRework) || 0;
  const prev = parseFloat(previousPeriodRework) || 0;

  if (prev === 0) {
    if (current === 0) {
      return { status: 'Estável →', percentageChange: 0, color: 'text-amber-400', bgText: 'bg-amber-500/20' };
    }
    return { status: 'Piorando ↑', percentageChange: 100, color: 'text-red-400', bgText: 'bg-red-500/20' };
  }

  const change = ((current - prev) / prev) * 100;
  
  if (change < 0) {
    // Rework decreased, this is good (Melhorando)
    return { status: 'Melhorando ↓', percentageChange: Math.abs(change), color: 'text-emerald-400', bgText: 'bg-emerald-500/20' };
  } else if (change > 0) {
    // Rework increased, this is bad (Piorando)
    return { status: 'Piorando ↑', percentageChange: change, color: 'text-red-400', bgText: 'bg-red-500/20' };
  } else {
    // Rework is the same
    return { status: 'Estável →', percentageChange: 0, color: 'text-amber-400', bgText: 'bg-amber-500/20' };
  }
};