import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Target, Activity, Edit3 } from 'lucide-react';
import { calculateTrendency } from '@/utils/calculateTrendency';
import { calculateReworkPercentage } from '@/utils/calculateReworkPercentage';

// Using standard weights for quality sizes
const PIECE_SIZE_WEIGHTS = {
  'muito_pequena': 0.5,
  'pequena': 1.0,
  'media': 1.5,
  'grande': 2.0,
  'muito_grande': 3.0
};
const ReportSummaryCards = ({
  logs,
  prevLogs
}) => {
  const [totalPieces, setTotalPieces] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('totalPiecesInPeriod');
    if (saved) setTotalPieces(saved);
  }, []);
  const handleTotalPiecesChange = e => {
    const val = e.target.value;
    setTotalPieces(val);
    localStorage.setItem('totalPiecesInPeriod', val);
  };

  // Calculations
  const currentReworkCount = logs?.reduce((sum, l) => sum + (parseInt(l.quantidade) || 0), 0) || 0;
  const prevReworkCount = prevLogs?.reduce((sum, l) => sum + (parseInt(l.quantidade) || 0), 0) || 0;
  const trend = calculateTrendency(currentReworkCount, prevReworkCount);
  const reworkData = calculateReworkPercentage(logs, totalPieces, PIECE_SIZE_WEIGHTS);
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Rework Total Card */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="dashboard-card flex flex-col justify-between bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-900/50">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-slate-300 font-medium text-sm mb-1">Retrabalho Total (Peças)</h3>
          <p className="text-3xl font-bold text-white tracking-tight">{currentReworkCount}</p>
          <p className="text-xs text-white/70 mt-2 font-medium">Soma bruta no período atual</p>
        </div>
      </motion.div>
      
      {/* Weighted Target Card with Input */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.1
    }} className="dashboard-card flex flex-col justify-between bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-900/50 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-slate-300 font-medium text-sm mb-3 leading-snug">
            % de Retrabalho
          </h3>
          
          <div className="relative mb-3 w-full max-w-[180px]">
             <Edit3 className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
             <input type="number" value={totalPieces} onChange={handleTotalPiecesChange} placeholder="Total Prod: 5000" className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all" />
          </div>

          {totalPieces && totalPieces > 0 ? <p className="text-3xl font-bold text-white tracking-tight">{reworkData.formatted}%</p> : <p className="text-sm font-semibold text-amber-300/80 mt-1">Insira o total de peças para calcular %</p>}
        </div>
      </motion.div>

      {/* Trend Card */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.2
    }} className="dashboard-card flex flex-col justify-between bg-gradient-to-br from-sky-900/40 to-sky-950/40 border-sky-900/50">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${trend.bgText} ${trend.color}`}>
            {trend.status} {trend.percentageChange > 0 ? `${trend.percentageChange.toFixed(1)}%` : ''}
          </div>
        </div>
        <div>
          <h3 className="text-slate-300 font-medium text-sm mb-1">Tendência de Retrabalho</h3>
          <p className="text-3xl font-bold text-white tracking-tight">{currentReworkCount}</p>
          <p className="text-xs text-white/70 mt-2 font-medium">Período Anterior: {prevReworkCount} peças</p>
        </div>
      </motion.div>
    </div>;
};
export default ReportSummaryCards;