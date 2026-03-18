
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import QualityRecordCard from './QualityRecordCard';

const FullscreenQualityView = ({ 
  isOpen, 
  onClose, 
  logs, 
  onEdit, 
  onDelete, 
  onConvertToAlert,
  title
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 text-white">
              <Maximize2 className="w-5 h-5 text-sky-400" />
              <h2 className="text-xl font-bold">{title || 'Visualização Expandida'}</h2>
              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-700">
                {logs.length} registros
              </span>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-slate-700 hover:border-red-500/50 group"
              title="Fechar (ESC)"
            >
              <X className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p className="text-xl">Nenhum registro encontrado para esta exibição.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 max-w-[1920px] mx-auto">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <QualityRecordCard 
                      log={log} 
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onConvertToAlert={onConvertToAlert}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenQualityView;
