import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, MonitorSmartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { ACESSO } from '@/config/acesso';

// Só deixa o app abrir em aparelhos ativados.
// Cada aparelho é ativado uma vez com a senha interna; a sessão fica salva
// e se renova sozinha, então no dia a dia o app abre direto.
const AtivacaoGate = ({ children }) => {
  const [estado, setEstado] = useState('carregando'); // carregando | ativado | pendente
  const [senha, setSenha] = useState('');
  const [nomeAparelho, setNomeAparelho] = useState(
    () => localStorage.getItem(ACESSO.chaveNomeAparelho) || ''
  );
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEstado(session ? 'ativado' : 'pendente');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setEstado(session ? 'ativado' : 'pendente');
    });
    return () => subscription.unsubscribe();
  }, []);

  const ativar = async (e) => {
    e.preventDefault();
    if (!nomeAparelho.trim()) {
      setErro('Dê um nome para este aparelho (ex.: PC comercial).');
      return;
    }
    setEnviando(true);
    setErro('');
    const { error } = await supabase.auth.signInWithPassword({
      email: ACESSO.emailConta,
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro('Senha incorreta. Confira e tente de novo.');
      setSenha('');
      return;
    }
    localStorage.setItem(ACESSO.chaveNomeAparelho, nomeAparelho.trim());
  };

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E]">
        <Loader2 className="w-10 h-10 text-sky-300 animate-spin" />
      </div>
    );
  }

  if (estado === 'ativado') return children;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-full mb-4 shadow-lg shadow-sky-500/30">
            <MonitorSmartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Ativar aparelho</h1>
          <p className="text-slate-300">Feito uma única vez em cada aparelho da {ACESSO.nomeEmpresa}.</p>
        </div>

        <form onSubmit={ativar} className="glass-effect p-8 rounded-2xl space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300 flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4" />
              Nome deste aparelho
            </label>
            <input
              type="text"
              value={nomeAparelho}
              onChange={(e) => setNomeAparelho(e.target.value)}
              placeholder="Ex.: PC comercial, celular cabine 1"
              className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha de ativação
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha..."
              className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-500"
              autoFocus
            />
          </div>
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            type="submit"
            disabled={enviando || !senha}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30 text-white disabled:opacity-50"
          >
            {enviando ? 'Ativando...' : 'Ativar aparelho'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AtivacaoGate;
