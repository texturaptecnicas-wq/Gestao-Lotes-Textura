
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, DollarSign, Calendar, User, Plus, 
  Trash2, Pencil, CheckCircle, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import AddPendingPIXModal from '@/components/AddPendingPIXModal';
import EditPendingPIXModal from '@/components/EditPendingPIXModal';

const PendingPIXManager = ({ onRefreshFinance }) => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pix_pendentes')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching pending pix:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta pendência?")) return;

    try {
      const { error } = await supabase.from('pix_pendentes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Excluído", description: "Registro removido com sucesso." });
      fetchRecords();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkAsPaid = async (record) => {
    if (!window.confirm(`Confirmar recebimento de R$ ${record.valor_pendente} de ${record.cliente}?`)) return;

    try {
      // 1. Insert into pix_lancados (new requirement)
      // Note: We might also want to insert into pix_records if that's the main finance table,
      // but the user specifically requested pix_lancados table.
      // Based on Task 5 ("include data from 'pix_lancados' table in calculations"), 
      // it implies this new table stores these specific converted payments.
      
      const { error: insertError } = await supabase.from('pix_lancados').insert({
        cliente: record.cliente,
        valor: record.valor_pendente,
        data_lancamento: new Date().toISOString().split('T')[0],
        status: 'pago'
      });

      if (insertError) throw insertError;

      // 2. Insert into pix_records (Legacy support / Unification)
      // Since the rest of the FinanceModule uses 'pix_records' for reports, 
      // we SHOULD likely add it there too, OR update FinanceModule to merge both tables.
      // However, to keep it simple and strictly follow the "new table" instruction while ensuring 
      // reports work (Task 5), we will fetch from both tables in FinanceModule.
      
      // 3. Update pending record status to 'pago'
      const { error: updateError } = await supabase
        .from('pix_pendentes')
        .update({ status: 'pago' })
        .eq('id', record.id);
        
      if (updateError) throw updateError;

      toast({ title: "Sucesso!", description: "Pagamento recebido e lançado." });
      fetchRecords();
      
      // Notify parent to refresh totals
      if (onRefreshFinance) onRefreshFinance();

    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sem prazo';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (val) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            Gerenciar PIX Pendentes
          </h2>
          <p className="text-slate-400 text-sm">Controle manual de pagamentos futuros</p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Pendente
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between text-red-400">
          <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</span>
          <button onClick={fetchRecords} className="underline hover:text-white">Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-400">Nenhuma pendência registrada</h3>
          <p className="text-slate-500">Adicione um novo registro para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const isPaid = record.status === 'pago';
            
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4
                  ${isPaid 
                    ? 'bg-emerald-900/10 border-emerald-500/20 opacity-75' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-amber-500/30 hover:bg-slate-800/80'}
                `}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isPaid ? 'text-emerald-400 line-through' : 'text-white'}`}>
                        {record.cliente}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Prazo: {formatDate(record.prazo_pagamento)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                   <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Valor</p>
                      <p className={`text-xl font-mono font-bold ${isPaid ? 'text-emerald-500' : 'text-amber-400'}`}>
                        {formatCurrency(record.valor_pendente)}
                      </p>
                   </div>

                   <div className="flex items-center gap-2 mt-2 md:mt-0">
                      {!isPaid && (
                        <button 
                          onClick={() => handleMarkAsPaid(record)}
                          className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg transition-colors border border-emerald-600/30 flex items-center gap-2"
                          title="Confirmar Recebimento"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">Receber</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setEditingRecord(record)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddPendingPIXModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRecords}
      />

      <EditPendingPIXModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSuccess={fetchRecords}
      />
    </div>
  );
};

export default PendingPIXManager;
