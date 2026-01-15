
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FinancePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '0312') {
      onSuccess();
      setPassword('');
      setError(false);
    } else {
      setError(true);
      toast({
        title: "⛔ Acesso Negado",
        description: "Senha incorreta.",
        variant: "destructive"
      });
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm glass-effect rounded-2xl p-6 shadow-2xl border border-slate-700 bg-[#0F172A] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-12 bg-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="p-3 bg-slate-800/50 rounded-full ring-1 ring-slate-700">
              <KeyRound className="w-8 h-8 text-sky-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">Acesso Financeiro</h3>
              <p className="text-sm text-slate-400">Autenticação necessária</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-slate-950 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-sky-500'} rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder-slate-600`}
                placeholder="Digite a senha..."
                autoFocus
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex items-center gap-2 text-red-400 text-xs px-2"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Senha incorreta. Tente novamente.</span>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
              >
                Acessar
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FinancePasswordModal;
