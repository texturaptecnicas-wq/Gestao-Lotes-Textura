
import { getFilteredLogs } from '@/services/qualityService';
import { normalizePainterName } from './painterNormalization';
import { normalizeClientName } from './clientNormalization';

// Function mapping indices to our custom CSS properties
const PINTOR_COLORS = Array.from({ length: 8 }, (_, i) => `hsl(var(--pintor-color-${i + 1}))`);

export const getComparisonCabinePainter = async (filters) => {
  if (!filters?.startDate || !filters?.endDate) {
    return { chartData: [], pintores: [] };
  }

  try {
    const logs = await getFilteredLogs(filters.startDate, filters.endDate, filters);

    let totalOverall = 0;
    const cabineMap = {};
    const uniquePintores = new Set();

    logs.forEach(log => {
      const qty = parseInt(log.quantidade) || 0;
      if (qty === 0) return; // Skip zero rework

      const cabine = log.cabine ? log.cabine.toString() : 'Sem Cabine';
      const pintor = normalizePainterName(log.pintor);
      const cliente = normalizeClientName(log.client_name || log.cliente);

      if (!cabineMap[cabine]) {
        cabineMap[cabine] = { 
          name: cabine === 'Sem Cabine' ? cabine : `Cabine ${cabine}`, 
          rawName: cabine, 
          total: 0, 
          pintoresData: {}
        };
      }
      
      if (!cabineMap[cabine].pintoresData[pintor]) {
        cabineMap[cabine].pintoresData[pintor] = { count: 0, clients: {} };
      }
      
      if (!cabineMap[cabine].pintoresData[pintor].clients[cliente]) {
        cabineMap[cabine].pintoresData[pintor].clients[cliente] = { count: 0, details: {} };
      }

      // Update counters
      cabineMap[cabine].total += qty;
      cabineMap[cabine].pintoresData[pintor].count += qty;
      cabineMap[cabine].pintoresData[pintor].clients[cliente].count += qty;
      
      totalOverall += qty;
      uniquePintores.add(pintor);

      // Track details
      const dateStr = log.date || '';
      const color = log.cor || 'Não Informada';
      const symptom = log.problema || 'Não Informado';
      const detailKey = `${dateStr}|${color}|${symptom}`;

      if (!cabineMap[cabine].pintoresData[pintor].clients[cliente].details[detailKey]) {
        cabineMap[cabine].pintoresData[pintor].clients[cliente].details[detailKey] = {
          date: dateStr,
          color: color,
          symptom: symptom,
          occurrences: 0
        };
      }
      cabineMap[cabine].pintoresData[pintor].clients[cliente].details[detailKey].occurrences += qty;
    });

    // Sort pintores to assign colors consistently
    const pintoresArray = Array.from(uniquePintores).sort();
    const colorMap = {};
    pintoresArray.forEach((p, idx) => {
      colorMap[p] = PINTOR_COLORS[idx % PINTOR_COLORS.length];
    });

    const chartData = Object.values(cabineMap).map(cab => {
      const percentage = totalOverall > 0 ? ((cab.total / totalOverall) * 100).toFixed(1) : 0;
      
      const pintoresDetails = Object.entries(cab.pintoresData).map(([pName, pData]) => {
        const byClient = Object.entries(pData.clients).map(([cName, cData]) => {
          const detailsList = Object.values(cData.details).map(d => {
            let formattedDate = d.date;
            if (d.date && d.date.includes('-')) {
              const [year, month, day] = d.date.split('-');
              formattedDate = `${day}/${month}/${year}`;
            }
            return { ...d, formattedDate };
          }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

          return {
            client_name: cName,
            count: cData.count,
            percentage: pData.count > 0 ? ((cData.count / pData.count) * 100).toFixed(1) : 0,
            details: detailsList
          };
        }).sort((a, b) => b.count - a.count);

        return {
          name: pName,
          color: colorMap[pName],
          count: pData.count,
          percentage: cab.total > 0 ? ((pData.count / cab.total) * 100).toFixed(1) : 0,
          byClient
        };
      }).sort((a, b) => b.count - a.count);

      const item = {
        name: cab.name,
        rawName: cab.rawName,
        total: cab.total,
        percentage,
        label: `${cab.name} - Total: ${cab.total} (${percentage}%)`,
        pintoresDetails
      };

      // Add flat painter counts for Recharts Stacked BarChart
      pintoresDetails.forEach(p => {
        item[p.name] = p.count;
      });

      return item;
    }).sort((a, b) => {
      if(a.rawName === 'Sem Cabine') return 1;
      if(b.rawName === 'Sem Cabine') return -1;
      return b.total - a.total;
    });

    return {
      chartData,
      pintores: pintoresArray.map(p => ({ name: p, color: colorMap[p] }))
    };
  } catch (error) {
    console.error("Error generating cabine/painter comparison data:", error);
    return { chartData: [], pintores: [] };
  }
};
