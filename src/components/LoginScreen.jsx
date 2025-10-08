import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md text-center"
      >
        <h1 className="text-5xl font-bold gradient-text mb-4">Bem-vindo!</h1>
        <p className="text-slate-300 mb-12 text-lg">Selecione seu perfil para continuar</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLogin('administrador')}
            className="glass-effect p-8 rounded-2xl flex flex-col items-center gap-4 group"
          >
            <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
              <Shield className="w-10 h-10 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Administrador</h2>
            <p className="text-sm text-slate-400">Acesso total ao sistema</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLogin('usuario')}
            className="glass-effect p-8 rounded-2xl flex flex-col items-center gap-4 group"
          >
            <div className="p-4 bg-sky-500/20 rounded-full group-hover:bg-sky-500/30 transition-colors">
              <User className="w-10 h-10 text-sky-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Usuário</h2>
            <p className="text-sm text-slate-400">Acesso para produção</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;