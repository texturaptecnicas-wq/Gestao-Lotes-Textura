import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getFinancialRecords, getFinancialSummary, createFinancialRecord, updateFinancialRecord, deleteFinancialRecord } from '@/services/financeService';

import FinanceFilters from './FinanceFilters';
import FinanceSummary from './FinanceSummary';
import FinanceCharts from './FinanceCharts';
import FinanceReportTable from './FinanceReportTable';
import FinanceModal from './FinanceModal';

const FinanceModule = ({ onBack }) => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    tipo: 'todos',
    status: 'todos',
    categoria: 'todos'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, sum] = await Promise.all([
        getFinancialRecords(filters),
        getFinancialSummary(filters)
      ]);
      setRecords(data);
      setSummary(sum);
    } catch (error) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data, id) => {
    try {
      if (id) {
        await updateFinancialRecord(id, data);
        toast({ title: "Sucesso", description: "Registro atualizado." });
      } else {
        await createFinancialRecord(data);
        toast({ title: "Sucesso", description: "Registro criado." });
      }
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente cancelar este registro? Ele continuará no sistema como cancelado.")) {
      try {
        await deleteFinancialRecord(id);
        toast({ title: "Cancelado", description: "O registro foi marcado como cancelado." });
        fetchData();
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    }
  };

  const openModal = (record = null) => {
    setRecordToEdit(record);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-3xl font-bold text-white">Módulo Financeiro</h1>
            </div>
            <p className="text-slate-400">Gestão independente de caixa e registros</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            Novo Lançamento
          </button>
        </header>

        <FinanceFilters filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-sky-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium animate-pulse">Carregando painel financeiro...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <FinanceSummary summary={summary} />
            <FinanceCharts records={records} />
            <FinanceReportTable records={records} onEdit={openModal} onDelete={handleDelete} />
          </motion.div>
        )}

        <FinanceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          recordToEdit={recordToEdit} 
        />
      </div>
    </div>
  );
};

export default FinanceModule;