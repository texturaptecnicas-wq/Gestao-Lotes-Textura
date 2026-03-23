import React from 'react';
import ReportSummaryCards from './ReportSummaryCards';

const ReportSummary = ({ logs, prevLogs, period }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="mb-8">
      {period && period.startDate && period.endDate && (
        <div className="mb-5 dashboard-card py-4 px-6 flex items-center gap-3 bg-slate-900/60 border-slate-700/50">
          <span className="text-sky-400 font-bold text-sm uppercase tracking-wider">Período Analisado:</span>
          <span className="text-white font-bold text-lg flex items-center gap-2">
            {formatDate(period.startDate)} 
            <span className="text-slate-500 font-normal text-sm">até</span> 
            {formatDate(period.endDate)}
          </span>
        </div>
      )}
      
      {/* Pass only logs and prevLogs to the cards. 
          Total pieces input is now handled internally inside the card component */}
      <ReportSummaryCards logs={logs} prevLogs={prevLogs} />
    </div>
  );
};

export default ReportSummary;