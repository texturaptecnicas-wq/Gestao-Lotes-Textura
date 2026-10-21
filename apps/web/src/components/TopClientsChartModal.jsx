import React, { useMemo } from 'react';
import { BarChart3, X } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);

const formatCurrencyFull = (val) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// Paleta sóbria e profissional, sem poluição visual.
const BAR_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#14b8a6',
];

const TopClientsChartModal = ({ isOpen, onClose, groupedData, period }) => {
  const { chartData, totalFaturamento, totalDistinctClients, outrosClientsCount } = useMemo(() => {
    if (!groupedData || groupedData.length === 0) {
      return { chartData: [], totalFaturamento: 0, totalDistinctClients: 0, outrosClientsCount: 0 };
    }

    // Faturamento = soma das entradas (tipo === 'entrada') não canceladas
    // por cliente, usando o agrupamento canônico já aplicado no módulo.
    const revenueByClient = groupedData
      .map((group) => {
        const faturamento = group.transactions
          .filter((t) => t.tipo === 'entrada' && t.status !== 'cancelado')
          .reduce((sum, t) => sum + Number(t.valor), 0);
        return {
          name: group.clientName,
          faturamento,
        };
      })
      .filter((c) => c.faturamento > 0)
      .sort((a, b) => b.faturamento - a.faturamento);

    // Denominador = faturamento total do período (todas as entradas), não
    // apenas o somatório dos 10 maiores. Cada barra representa sua fatia
    // desse total.
    const totalFaturamento = revenueByClient.reduce(
      (sum, c) => sum + c.faturamento,
      0
    );

    const totalDistinctClients = revenueByClient.length;
    const top10 = revenueByClient.slice(0, 10);
    const outrosClients = revenueByClient.slice(10);
    const outrosFaturamento = outrosClients.reduce(
      (sum, c) => sum + c.faturamento,
      0
    );

    const pct = (val) =>
      totalFaturamento > 0
        ? new Intl.NumberFormat('pt-BR', {
            maximumFractionDigits: 1,
          }).format((val / totalFaturamento) * 100)
        : '0';

    const chartData = top10.map((c) => ({
      ...c,
      percentage: `${pct(c.faturamento)}%`,
    }));
    if (outrosFaturamento > 0) {
      chartData.push({
        name: 'Outros',
        faturamento: outrosFaturamento,
        percentage: `${pct(outrosFaturamento)}%`,
      });
    }

    return {
      chartData,
      totalFaturamento,
      totalDistinctClients,
      outrosClientsCount: outrosClients.length,
    };
  }, [groupedData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] bg-slate-950 border border-slate-700/60 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <BarChart3 className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Top 10 Clientes por Faturamento
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-0.5">
                  Período: {formatDate(period.startDate)} a {formatDate(period.endDate)}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Sem dados no período</h3>
              <p className="text-slate-400 text-sm">
                Não há lançamentos de entrada para os filtros selecionados.
              </p>
            </div>
          ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                  Faturamento total do período
                </span>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrencyFull(totalFaturamento)}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                  Clientes distintos no período
                </span>
                <p className="text-2xl font-bold text-white">
                  {totalDistinctClients}
                </p>
              </div>
              {outrosClientsCount > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                    Em “Outros”
                  </span>
                  <p className="text-2xl font-bold text-slate-300">
                    {outrosClientsCount}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                  No Top 10
                </span>
                <p className="text-2xl font-bold text-sky-400">
                  {chartData.length - (outrosClientsCount > 0 ? 1 : 0)}
                </p>
              </div>
            </div>

            <div className="w-full h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 52, left: 8, bottom: 0 }}
                  barCategoryGap={8}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    width={140}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      const pct = totalFaturamento > 0
                        ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format((item.faturamento / totalFaturamento) * 100)
                        : '0';
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-white font-semibold text-sm mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-emerald-400 font-bold text-sm">
                            {formatCurrencyFull(item.faturamento)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {pct}% do faturamento do período
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="faturamento" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="percentage"
                      position="right"
                      offset={8}
                      fill="#94a3b8"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Considera apenas lançamentos de entrada não cancelados, agrupados por
              cliente conforme o critério do módulo financeiro. A barra “Outros”
              soma as entradas dos clientes além do top 10. As porcentagens são
              calculadas sobre o faturamento total do período selecionado.
            </p>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopClientsChartModal;
