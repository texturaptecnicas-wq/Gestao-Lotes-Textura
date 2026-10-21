import React, { useState } from 'react';
import { X, Maximize2, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageGallery = ({ imageUrl }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      <div 
        className="relative group rounded-lg overflow-hidden border border-slate-700/50 cursor-pointer bg-slate-900 aspect-video max-h-[200px]"
        onClick={() => setIsFullscreen(true)}
      >
        <img 
          src={imageUrl} 
          alt="Evidência" 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-slate-900/80 p-2 rounded-full text-white">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <button 
              className="absolute top-4 right-4 p-3 bg-slate-800/50 hover:bg-slate-700 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imageUrl}
              alt="Evidência Ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;