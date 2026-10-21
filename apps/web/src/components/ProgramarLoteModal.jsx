import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Palette, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { todayISO } from '@/utils/dateUtils';

const ProgramarLoteModal = ({ isOpen, onClose, lote, onConfirm }) => {
  const [data, setData] = useState(todayISO());
  const [cabine, setCabine] = useState(1);
  const [cor, setCor] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingColors, setExistingColors] = useState([]);

  useEffect(() => {
    if (isOpen && lote) {
      setData(todayISO());
      setCabine(1);
      setCor(lote.cor || '');
    }
  }, [isOpen, lote]);

  // Sugere cores já usadas na cabine+data escolhidas
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const load = async () => {
      const { data: rows } = await supabase
        .from('programacao')
        .select('cor')
        .eq('data', data)
        .eq('cabine', Number(cabine));
      if (active && rows) {
        const unique = [...new Set(rows.map(r => r.cor))].sort();
        setExistingColors(unique);
      }
    };
    load();
    return () => { active = false; };
  }, [isOpen, data, cabine]);

  const canConfirm = useMemo(() => !!lote && cor.trim() !== '' && !!data && !saving, [lote, cor, data, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canConfirm) return;
    setSaving(true);
    try {
      const ok = await onConfirm(lote, { data, cabine: Number(cabine), cor: cor.trim() });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && lote && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
          >
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Programar Lote</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700/60 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="glass-effect rounded-xl p-3 mb-5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Cliente</p>
                  <p className="font-bold text-slate-100 truncate">{lote.cliente}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Cor do lote</p>
                  <p className="font-semibold text-sky-300 truncate">{lote.cor || '—'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-300" /> Data da programação
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">Cabine</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCabine(c)}
                        className={`py-3 rounded-xl font-bold transition-all ${
                          Number(cabine) === c
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30'
                            : 'glass-effect text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-300" /> Cor / Grupo
                  </label>
                  <input
                    type="text"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="Ex: Azul Marinho"
                    list="programar-cores-list"
                    className="w-full glass-effect px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    autoFocus
                  />
                  <datalist id="programar-cores-list">
                    {existingColors.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {existingColors.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">Cores já usadas nesta cabine aparecem ao digitar.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 glass-effect px-4 py-3 rounded-xl font-semibold hover:bg-slate-700/60"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!canConfirm}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {saving ? 'Programando...' : 'Programar'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProgramarLoteModal;
