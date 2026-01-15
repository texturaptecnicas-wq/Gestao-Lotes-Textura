
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FinanceLogin = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("FinanceLogin: Verificando senha...");
    
    // Updated the hardcoded password here as requested
    if (password === '0312') {
      console.log("FinanceLogin: Senha correta. Autenticando...");
      // Passa explicitamente 'financeiro' para garantir o tipo correto no App.jsx
      onLogin('financeiro');
    } else {
      console.warn("FinanceLogin: Senha incorreta");
      toast({
        title: "❌ Senha incorreta",
        description: "A senha do setor Financeiro está incorreta.",
        variant: "destructive"
      });
      setPassword(''); // Limpa o campo para nova tentativa
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mb-6 glass-effect px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700/60 text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </motion.button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4 shadow-lg shadow-green-500/30">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Acesso Financeiro</h1>
          <p className="text-slate-300 text-lg">Área restrita</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-effect p-8 rounded-2xl space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha..."
              className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-slate-500"
              autoFocus
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 text-white"
          >
            Acessar Sistema
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default FinanceLogin;
