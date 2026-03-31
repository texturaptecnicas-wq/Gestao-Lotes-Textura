
import { useMemo } from 'react';

/**
 * Custom hook to filter and identify delayed lotes.
 * A lote is considered delayed if it's programmed for painting,
 * has not been painted yet, and was registered/updated prior to today.
 */
export const useDelayedLotes = (lotes) => {
  return useMemo(() => {
    if (!lotes || !Array.isArray(lotes)) return { delayedLotes: [], delayedCount: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const delayedLotes = lotes.filter(lote => {
      // Must be programmed and not painted yet
      if (lote.programado && !lote.pintado) {
        // If the lote was updated or created before today, it's considered delayed
        const checkDate = new Date(lote.updated_at || lote.data_criacao);
        return checkDate < today;
      }
      return false;
    });
    
    return {
      delayedLotes,
      delayedCount: delayedLotes.length
    };
  }, [lotes]);
};
