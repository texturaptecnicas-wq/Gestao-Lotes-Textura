import React, { useState, useEffect } from 'react';
import { Save, Loader2, TrendingUp, TrendingDown, Minus, Target, User, Palette, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import { getRecordWeight } from '@/services/qualityService';
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  trend
}) => <div className="metric-card">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-white leading-tight">{value || '--'}</h4>
      </div>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
      <span className="text-xs text-slate-500 truncate max-w-[70%]">{subtitle}</span>
      {trend && <span className={`text-xs font-bold flex items-center gap-1 ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>}
    </div>
  </div>;
const ReportMetrics = ({
  records,
  totalPiecesPainted,
  reworkPercentage,
  aggregations,
  onSaveTotalPieces,
  isSaving
}) => {
  const [localTotal, setLocalTotal] = useState('');
  useEffect(() => {
    setLocalTotal(totalPiecesPainted || '');
  }, [totalPiecesPainted]);
  const handleSave = () => {
    const val = parseInt(localTotal);
    if (isNaN(val) || val <= 0) {
      alert("Informe um número válido e positivo para o total de peças.");
      return;
    }
    onSaveTotalPieces(val);
  };
  const totalWeightedRework = records.reduce((acc, r) => {
    const qty = parseInt(r.quantidade) || 0;
    const weight = getRecordWeight(r.tamanho_peca);
    return acc + qty * weight;
  }, 0);
  return <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/10">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400" />
            Produção do Período
          </h3>
          <p className="text-sm text-slate-400">Informe o total de peças pintadas para calcular o % de retrabalho ponderado.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <input type="number" value={localTotal} onChange={e => setLocalTotal(e.target.value)} placeholder="Total produzido..." className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500/50 w-full md:w-48 text-sm" min="1" />
          </div>
          <button onClick={handleSave} disabled={isSaving || !localTotal} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="% Retrabalho Ponderado" value={`${reworkPercentage ? reworkPercentage.toFixed(2) : '0.00'}%`} subtitle="Baseado no peso do tamanho" icon={AlertCircle} colorClass="bg-red-500/20 text-red-400" />
        
        <MetricCard title="Peças Refeitas (Pond.)" value={totalWeightedRework.toFixed(1)} subtitle={`Em ${records.length} registros reais`} icon={Package} colorClass="bg-amber-500/20 text-amber-400" />
        
        <MetricCard title="Principal Cliente" value={aggregations.topClient ? aggregations.topClient.name : 'N/A'} subtitle={aggregations.topClient ? `${aggregations.topClient.count} pçs pond.` : '--'} icon={User} colorClass="bg-blue-500/20 text-blue-400" />

        <MetricCard title="Principal Problema" value={aggregations.topProblem ? aggregations.topProblem.name : 'N/A'} subtitle={aggregations.topProblem ? `${aggregations.topProblem.count} pçs pond.` : '--'} icon={AlertTriangle} colorClass="bg-orange-500/20 text-orange-400" />

        <MetricCard title="Principal Pintor" value={aggregations.topPainter ? aggregations.topPainter.name : 'N/A'} subtitle={aggregations.topPainter ? `${aggregations.topPainter.count} pçs pond.` : '--'} icon={Palette} colorClass="bg-indigo-500/20 text-indigo-400" />
        
        <MetricCard title="Principal Cor" value={aggregations.topColor ? aggregations.topColor.name : 'N/A'} subtitle={aggregations.topColor ? `${aggregations.topColor.count} pçs pond.` : '--'} icon={Palette} colorClass="bg-pink-500/20 text-pink-400" />
      </div>
    </div>;
};
export default ReportMetrics;