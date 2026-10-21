import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';

const DateTimeline = ({ dates, selectedDate, onDateSelect }) => {
  const formatDDMMYYYY = (dStr) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 p-2 md:p-4 h-full overflow-hidden w-full">
      <div className="hidden md:flex items-center gap-2 mb-4 px-2 text-slate-300">
        <Calendar className="w-5 h-5" />
        <h3 className="font-semibold text-sm uppercase tracking-wider">Linha do Tempo</h3>
      </div>
      
      {/* Scrollable Container - Horizontal on mobile, vertical on desktop */}
      <div className="flex flex-row md:flex-col flex-1 overflow-x-auto md:overflow-y-auto overflow-y-hidden md:overflow-x-hidden mobile-scroll-x md:custom-scrollbar md:pr-2 gap-2 pb-2 md:pb-0 scroll-smooth">
        {dates.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4 w-full">Nenhum registro.</p>
        ) : (
          <AnimatePresence>
            {dates.map((date) => {
              const isSelected = date === selectedDate;
              const formattedDate = formatDDMMYYYY(date);
              
              return (
                <motion.button
                  key={date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => onDateSelect(date)}
                  className={`flex-none min-w-[140px] md:min-w-0 md:w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center justify-between transition-all duration-200 group relative overflow-hidden touch-target snap-start ${
                    isSelected 
                      ? 'bg-sky-500/20 border border-sky-500/50 text-white shadow-sm shadow-sky-900/20' 
                      : 'bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {isSelected && (
                    <motion.div 
                      layoutId="timeline-active" 
                      className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 hidden md:block" 
                    />
                  )}
                  {isSelected && (
                     <motion.div 
                     layoutId="timeline-active-mobile" 
                     className="absolute left-0 bottom-0 right-0 h-1 bg-sky-500 md:hidden" 
                   />
                  )}
                  <div className="flex items-center gap-2 md:gap-3 w-full justify-between md:justify-start">
                    <div className={`w-2 h-2 rounded-full hidden md:block ${isSelected ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-slate-600 group-hover:bg-slate-500'}`} />
                    <span className={`font-medium whitespace-nowrap text-sm md:text-base ${isSelected ? 'text-white' : ''}`}>{formattedDate}</span>
                    <ChevronRight className={`w-4 h-4 hidden md:block transition-transform ${isSelected ? 'text-sky-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default DateTimeline;