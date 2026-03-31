import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Lock, Save, DollarSign, Calendar, FileText, User } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export default function PixLancamentoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Safely format the date from search param, default to today
  const defaultDate = searchParams.get('data') 
    ? searchParams.get('data').split('T')[0] 
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    valor: searchParams.get('valor') || '',
    data_lancamento: defaultDate,
    descricao: searchParams.get('descricao') || '',
    cliente: searchParams.get('cliente') || '',
    tipo: 'PIX'
  });
  
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    // Only allow numbers, max 4 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length !== 4) {
      toast({ 
        title: "Senha inválida", 
        description: "A senha deve conter exatamente 4 dígitos numéricos.", 
        variant: "destructive" 
      });
      return;
    }

    // Hardcoded password validation (e.g. 1234)
    if (password !== '1234') {
      toast({ 
        title: "Senha incorreta", 
        description: "Tente novamente.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        cliente: formData.cliente,
        valor: parseFloat(formData.valor) || 0,
        data_lancamento: formData.data_lancamento,
        status: 'ok',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('pix_lancados').insert(payload);
      
      if (error) throw error;

      toast({ 
        title: "✅ PIX lançado com sucesso!", 
        description: "O lançamento foi registrado no financeiro e está sincronizado." 
      });
      
      setTimeout(() => navigate('/'), 2000);
      
    } catch (err) {
      toast({ 
        title: "❌ Erro ao lançar PIX", 
        description: err.message, 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
      <Helmet>
        <title>Lançar PIX - Gestão Financeira</title>
      </Helmet>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Lançar PIX</h1>
            <p className="text-sm text-slate-400">Registre o recebimento no financeiro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Cliente</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                name="cliente" 
                value={formData.cliente} 
                onChange={handleChange} 
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500" 
                required 
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  name="valor" 
                  value={formData.valor} 
                  onChange={handleChange} 
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500" 
                  required 
                />
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="date" 
                  name="data_lancamento" 
                  value={formData.data_lancamento} 
                  onChange={handleChange} 
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Tipo (Disabled) */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Tipo de Transação</label>
            <div className="w-full bg-slate-800/30 border border-slate-700/30 text-slate-400 px-4 py-3 rounded-xl cursor-not-allowed font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {formData.tipo}
            </div>
          </div>

          {/* Senha */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Senha de Autorização (4 dígitos)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input 
                type="password" 
                maxLength={4} 
                value={password} 
                onChange={handlePasswordChange} 
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all tracking-[1em] text-lg font-black placeholder:tracking-normal placeholder:text-base placeholder:font-normal placeholder:text-slate-500" 
                required 
                placeholder="••••" 
                autoComplete="off"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 flex gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="flex-1 px-4 py-3.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5" /> Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || password.length !== 4} 
              className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Lançando...' : <><Save className="w-5 h-5" /> Confirmar</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}