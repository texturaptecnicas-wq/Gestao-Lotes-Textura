
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const COLOR_OPTIONS = [
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Amarelo', hex: '#eab308' },
  { name: 'Preto', hex: '#000000' },
  { name: 'Branco', hex: '#ffffff', border: true },
  { name: 'Cinza', hex: '#64748b' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Roxo', hex: '#a855f7' },
  { name: 'Marrom', hex: '#92400e' },
  { name: 'Bege', hex: '#fde68a', border: true },
];

const ColorSelector = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedColor = COLOR_OPTIONS.find(c => c.name === value) || (value ? { name: value, hex: 'transparent' } : null);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedColor ? (
            <>
              <span 
                className={`w-4 h-4 rounded-full flex-shrink-0 ${selectedColor.border ? 'border border-slate-300' : ''}`} 
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-white truncate">{selectedColor.name}</span>
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">Nenhuma (Qualquer cor)</span>
            </>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-800"
            >
              <Palette className="w-4 h-4 text-slate-500" />
              <span className="text-slate-300 text-sm">Nenhuma (Qualquer cor)</span>
            </button>
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => { onChange(color.name); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
              >
                <span 
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${color.border ? 'border border-slate-300' : ''}`} 
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-slate-200 text-sm">{color.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorSelector;
