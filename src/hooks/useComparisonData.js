
import { useState, useEffect } from 'react';
import { getFilteredLogs } from '@/services/qualityService';
import { getComparisonColor } from '@/utils/comparisonColorConfig';
import { normalizePainterName } from '@/utils/painterNormalization';

export const useComparisonData = (type, filters) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type || !filters?.startDate || !filters?.endDate) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const logs = await getFilteredLogs(filters.startDate, filters.endDate, filters);
        
        const grouped = {};
        let total = 0;

        logs.forEach(log => {
           const qty = parseInt(log.quantidade) || 0;
           if (qty === 0) return; // ignore zero rework entries

           let key = type === 'cabine' 
              ? (log.cabine ? `Cabine ${log.cabine}` : 'Sem Cabine') 
              : normalizePainterName(log.pintor);
           
           if (!grouped[key]) grouped[key] = 0;
           grouped[key] += qty;
           total += qty;
        });

        const formatted = Object.keys(grouped).map(key => {
           return {
             name: key,
             originalName: type === 'cabine' ? key.replace('Cabine ', '') : key,
             count: grouped[key],
             percentage: total > 0 ? ((grouped[key] / total) * 100).toFixed(1) : 0,
           };
        }).sort((a, b) => b.count - a.count).map((item, index) => ({
           ...item,
           color: getComparisonColor(index)
        }));

        setData(formatted);
      } catch(err) {
        console.error("Error fetching comparison data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [type, JSON.stringify(filters)]);

  return { data, loading };
};
