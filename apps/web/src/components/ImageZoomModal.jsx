import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ImageZoomModal = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState(null);
  
  const containerRef = useRef(null);

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.max(prev - 0.1, 1));
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.1, 3));
    } else {
      setScale((prev) => Math.max(prev - 0.1, 1));
    }
  }, []);

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Pinch & Pan
  const getDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches);
      const diff = currentDistance - initialDistance;
      const zoomStep = diff > 0 ? 0.05 : -0.05;
      
      setScale((prev) => {
        const newScale = Math.max(1, Math.min(prev + zoomStep, 3));
        return newScale;
      });
      setInitialDistance(currentDistance);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialDistance(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Prevent drag returning to center immediately if scale is 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  if (!imageUrl) return null;

  const percentage = Math.round(scale * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center zoom-modal-overlay"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 z-[310] flex items-center gap-2">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-white font-mono text-sm shadow-lg">
            {percentage}%
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-900/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg border border-slate-700 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[310] flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2.5 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-xl text-white transition-colors touch-action-manipulation"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1" />
          
          <button
            onClick={handleReset}
            disabled={scale === 1}
            className="p-2.5 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-xl text-white transition-colors touch-action-manipulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1" />
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2.5 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-xl text-white transition-colors touch-action-manipulation"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden touch-action-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.img
            src={imageUrl}
            alt="Zoomed"
            draggable="false"
            className={`max-w-full max-h-full object-contain ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
            style={{
              x: position.x,
              y: position.y,
              scale: scale,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageZoomModal;