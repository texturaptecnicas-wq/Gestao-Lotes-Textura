import React from 'react';
import { PIECE_SIZES } from '@/utils/pieceSizeConfig';
import { cn } from '@/lib/utils';

const PieceSizeSelector = ({ selectedSize, onSizeChange, disabled = false }) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-slate-400 mb-2">Tamanho da Peça</label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PIECE_SIZES.map((size) => {
          const Icon = size.icon;
          const isSelected = selectedSize === size.value;
          
          return (
            <button
              key={size.id}
              type="button"
              disabled={disabled}
              onClick={() => onSizeChange(isSelected ? null : size.value)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                isSelected 
                  ? `${size.twBg} ${size.twBorder} ${size.twColor} shadow-md` 
                  : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1.5", isSelected ? size.twColor : "text-slate-500")} />
              <span className="text-[10px] font-semibold text-center leading-tight">
                {size.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PieceSizeSelector;