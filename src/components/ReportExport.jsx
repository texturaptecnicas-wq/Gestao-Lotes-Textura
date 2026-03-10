
import React from 'react';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ReportExport = ({ transactions, period }) => {
  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast({ title: "Aviso", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    const headers = ["Data", "Cliente", "Valor"];
    const rows = transactions.map(t => {
      const [year, month, day] = t.data_lancamento.split('T')[0].split('-');
      const date = `${day}/${month}/${year}`;
      const client = `"${t.cliente.replace(/"/g, '""')}"`;
      const value = t.valor.toString().replace('.', ',');
      return [date, client, value];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(";") + "\n" 
      + rows.map(e => e.join(";")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const fileName = `Relatorio_Financeiro_${period.startDate}_a_${period.endDate}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Sucesso", description: "Relatório exportado com sucesso!" });
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl border border-slate-700 shadow-sm transition-colors active:scale-95"
    >
      <Download className="w-5 h-5" />
      Exportar CSV
    </button>
  );
};

export default ReportExport;
