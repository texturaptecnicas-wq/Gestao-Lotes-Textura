import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ImageIcon } from 'lucide-react';
import ImageZoomModal from '@/components/ImageZoomModal';

const ProgramacaoPhotosModal = ({ isOpen, onClose, cliente, photos }) => {
  const [zoomUrl, setZoomUrl] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/60">
                <h3 className="font-bold text-lg gradient-text flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-sky-300" />
                  Fotos — {cliente}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 bg-slate-800/50 hover:bg-red-500/20 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-4">
                {photos.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Nenhuma foto vinculada aos lotes deste cliente.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/40 group relative"
                      >
                        <div className="relative aspect-video bg-slate-900/50">
                          <img
                            src={photo.url}
                            alt={`${photo.cliente} — ${photo.cor}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <button
                            onClick={() => setZoomUrl(photo.url)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="Ampliar"
                          >
                            <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                          </button>
                        </div>
                        <div className="p-2 text-xs text-slate-300 space-y-0.5">
                          <p className="font-semibold truncate">{photo.cor}</p>
                          <p className="text-slate-400">
                            {photo.quantidade ? `${photo.quantidade} peças` : 'N/A'}
                            {photo.loteIndex != null ? ` · Lote ${photo.loteIndex}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {zoomUrl && <ImageZoomModal imageUrl={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </>
  );
};

export default ProgramacaoPhotosModal;
