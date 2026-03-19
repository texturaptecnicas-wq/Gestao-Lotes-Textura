import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { deduplicateConclusions } from '@/utils/deduplicateConclusions';
const ReportSolutionsChart = ({
  logs
}) => {
  const structuredConclusions = deduplicateConclusions(logs);
  if (!structuredConclusions || structuredConclusions.length === 0) {
    return <div className="dashboard-card h-full flex flex-col items-center justify-center text-center p-6 border-dashed border-slate-700 bg-slate-900/30">
        <CheckCircle2 className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-slate-300 font-semibold mb-1">Acompanhamento de Soluções</h3>
        <p className="text-slate-500 text-sm max-w-xs">Nenhuma solução ou conclusão registrada no período selecionado.</p>
      </div>;
  }
  return <div className="dashboard-card w-full h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Ações / Conclusões</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        {structuredConclusions.map((item, idx) => <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 transition-colors hover:border-slate-700">
            <h4 className="text-sm font-bold text-amber-400 mb-2 border-b border-slate-800 pb-2">{item.problem}</h4>
            <ul className="space-y-2">
              {item.conclusions.map((sol, sidx) => <li key={sidx} className="text-sm text-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{sol.conclusion}</span>
                  <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md text-xs font-bold border border-slate-700">
                    (x{sol.frequency})
                  </span>
                </li>)}
            </ul>
          </div>)}
      </div>
    </div>;
};
export default ReportSolutionsChart;