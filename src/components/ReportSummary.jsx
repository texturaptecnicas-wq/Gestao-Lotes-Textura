
import React, { useState, useEffect } from 'react';
import ReportSummaryCards from './ReportSummaryCards';
import { getZeroReworkDays } from '@/services/qualityService';
import { ShieldCheck } from 'lucide-react';

const ReportSummary = ({ logs, prevLogs, period }) => {
  const [zeroReworkCount, setZeroReworkCount] = useState(0);

  useEffect(() => {
    if (period?.startDate && period?.endDate) {
      getZeroReworkDays(period.startDate, period.endDate)
        .then(days => setZeroReworkCount(days.length))
        .catch(console.error);
    }
  }, [period]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="mb-8">
      {period && period.startDate && period.endDate && (
        <div className="mb-5 dashboard-card py-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-sky-400 font-bold text-sm uppercase tracking-wider shrink-0">Período Analisado:</span>
            <span className="text-white font-bold text-lg flex items-center gap-2 flex-wrap">
              {formatDate(period.startDate)} 
              <span className="text-slate-500 font-normal text-sm">até</span> 
              {formatDate(period.endDate)}
            </span>
          </div>
          
          {zeroReworkCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold">{zeroReworkCount} {zeroReworkCount === 1 ? 'Dia' : 'Dias'} Sem Retrabalho</span>
            </div>
          )}
        </div>
      )}
      
      {/* Pass only logs and prevLogs to the cards. 
          Total pieces input is now handled internally inside the card component */}
      <ReportSummaryCards logs={logs} prevLogs={prevLogs} />
    </div>
  );
};

export default ReportSummary;
