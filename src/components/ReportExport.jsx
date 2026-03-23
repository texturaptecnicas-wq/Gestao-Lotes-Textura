import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ReportExport = ({ logs, period, filters }) => {
  
  const generateFileName = (ext) => {
    let name = `Relatorio_Qualidade_${period.startDate}_a_${period.endDate}`;
    if (filters?.cabines?.length) name += `_Cab${filters.cabines.join('-')}`;
    return `${name}.${ext}`;
  };

  const handleExportExcel = () => {
    if (!logs || logs.length === 0) {
      toast({ title: "Aviso", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    try {
      const headers = ["Data", "Cliente", "Cor", "Cabine", "Pintor", "Qtd", "Tamanho", "Problema", "Conclusão"];
      const rows = logs.map(l => [
        l.date,
        `"${(l.client_name || '').replace(/"/g, '""')}"`,
        l.cor || '',
        l.cabine || '',
        l.pintor || '',
        l.quantidade || 0,
        l.tamanho_peca || '',
        `"${(l.problema || '').replace(/"/g, '""')}"`,
        `"${(l.analysis_conclusion || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(";") + "\n" 
        + rows.map(e => e.join(";")).join("\n");
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", generateFileName('csv'));
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Sucesso", description: "Dados exportados em CSV com sucesso!" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao exportar arquivo.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    // Placeholder for actual PDF generation library (like jspdf or html2canvas)
    // Since environment constrains external heavy packages, we provide print functionality.
    toast({ title: "Preparando PDF", description: "Abra a caixa de impressão para salvar como PDF." });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-800">
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Exportar Dados (CSV)
      </button>
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-900/20"
      >
        <FileText className="w-4 h-4" />
        Gerar Relatório PDF
      </button>
    </div>
  );
};

export default ReportExport;