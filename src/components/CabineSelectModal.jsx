import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const CabineSelectModal = ({ isOpen, onClose, onSelectCabine }) => {
  const cabines = [1, 2, 3, 4];

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
          >
            <div className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Selecionar Cabine</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700/60 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {cabines.map(cabine => (
                  <motion.button
                    key={cabine}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectCabine(cabine)}
                    className="bg-gradient-to-br from-sky-500/80 to-indigo-500/80 p-6 rounded-xl font-bold text-2xl text-white shadow-lg shadow-sky-500/20 hover:from-sky-500 hover:to-indigo-500 transition-all"
                  >
                    Cabine {cabine}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CabineSelectModal;