export const calculateReworkPercentage = (totalReworkPieces, totalPiecesInPeriod, pieceSizeWeights = {}) => {
  const total = parseInt(totalPiecesInPeriod, 10);
  
  if (isNaN(total) || total <= 0) {
    return { percentage: 0, formatted: '0.00' };
  }
  
  let weightedRework = 0;
  
  // Apply size-based weighting if an array of logs is provided
  if (Array.isArray(totalReworkPieces)) {
    weightedRework = totalReworkPieces.reduce((sum, log) => {
      const qty = parseInt(log.quantidade) || 0;
      if (qty === 0) return sum; // Zero-rework days don't add to total rework
      
      // Default weight is 1.0 if not specified
      const weight = pieceSizeWeights[log.tamanho_peca] || 1.0; 
      return sum + (qty * weight);
    }, 0);
  } else {
    // If it's just a raw number, use it directly
    weightedRework = parseFloat(totalReworkPieces) || 0;
  }
  
  const percentage = (weightedRework / total) * 100;
  
  return {
    percentage,
    formatted: percentage.toFixed(2)
  };
};