
import React, { useState } from 'react';
import { AlertTriangle, User, Palette, Package, CheckCircle, Edit, Trash2, Clock, Factory, Maximize2, Image as ImageIcon } from 'lucide-react';
import ImageGallery from './ImageGallery';
import ImageZoomModal from './ImageZoomModal';
import { getPieceSizeConfig } from '@/utils/pieceSizeConfig';
import { getCabineColorClass } from '@/utils/cabineColorConfig';

const QualityRecordCard = ({ log, onEdit, onDelete, onConvertToAlert, onExpand, isExpandedView = false }) => {
  const [showZoomImage, setShowZoomImage] = useState(false);
  const sizeConfig = log.tamanho_peca ? getPieceSizeConfig(log.tamanho_peca) : null;
  const SizeIcon = sizeConfig ? sizeConfig.icon : null;

  const formatDDMM = (dStr) => {
    if (!dStr) return '--/--';
    const datePart = dStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return '--/--';
    const [y, m, d] = parts;
    return `${d}/${m}`;
  };

  const cabineClass = getCabineColorClass(log.cabine);
  const cabineTextColor = cabineClass.split(' ').find(c => c.startsWith('text-')) || 'text-slate-400';

  return (
    <>
      <div className={`bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full ${isExpandedView ? 'border-none shadow-none' : ''}`}>
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/30 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${cabineClass}`}>
                <Factory className={`w-3 h-3 ${cabineTextColor}`} /> Cabine {log.cabine}
              </span>
              <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                <Clock className="w-3 h-3" /> {formatDDMM(log.date)}
              </span>
              {sizeConfig && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-opacity-20 ${sizeConfig.twBg} ${sizeConfig.twColor}`}>
                  <SizeIcon className="w-3 h-3" /> {sizeConfig.label}
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white truncate leading-tight" title={log.client_name}>
              {log.client_name || 'Cliente Não Informado'}
            </h4>
          </div>
          
          <div className="flex gap-1 ml-2 shrink-0">
            {!isExpandedView && onExpand && (
              <button 
                onClick={() => onExpand(log)} 
                className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors touch-target" 
                title="Expandir"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => onEdit(log)} 
              className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors touch-target" 
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(log.id)} 
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors touch-target" 
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pintor</p>
                <p className="text-sm text-slate-200 truncate font-medium">{log.pintor || '--'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quantidade</p>
                <p className="text-sm text-slate-200 font-medium">{log.quantidade || '0'} pçs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-0 sm:col-span-2 pt-1 border-t border-slate-700/30">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                <Palette className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cor / Acabamento</p>
                <p className="text-sm text-slate-200 truncate font-medium" title={log.cor}>
                  {log.cor || '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {log.problema && (
              <div className={`bg-red-500/5 border border-red-500/20 rounded-xl p-3 relative overflow-hidden group ${isExpandedView ? 'bg-red-500/10' : ''}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
                <p className={`text-[10px] ${cabineTextColor} uppercase font-black mb-1.5 flex items-center gap-1.5`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${cabineTextColor}`} /> Sintoma / Problema
                </p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">{log.problema}</p>
              </div>
            )}

            {log.analysis_conclusion && (
              <div className={`bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 relative overflow-hidden ${isExpandedView ? 'bg-emerald-500/10' : ''}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                <p className="text-[10px] text-emerald-400 uppercase font-black mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Conclusão / Ação
                </p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {log.analysis_conclusion}
                </p>
              </div>
            )}
          </div>

          {log.image_url ? (
            <div 
              className="mt-auto pt-2 shrink-0 cursor-pointer relative group rounded-xl overflow-hidden" 
              onClick={() => setShowZoomImage(true)}
              title="Clique para Ampliar"
            >
              <div className="pointer-events-none">
                <ImageGallery imageUrl={log.image_url} />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                 <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-opacity pointer-events-none">
                   Ampliar Foto
                 </span>
              </div>
            </div>
          ) : (
            <div className="mt-auto pt-2 shrink-0">
              <div className="border border-slate-800 border-dashed rounded-lg p-3 bg-slate-900/30 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                <span className="text-[10px] font-medium">Sem evidência visual</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-900/50 border-t border-slate-700/50 shrink-0">
          <button 
            onClick={() => onConvertToAlert(log)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold transition-all active:scale-[0.98] touch-target"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> 
            CONVERTER EM ALERTA FIXO
          </button>
        </div>
      </div>

      {showZoomImage && log?.image_url && (
        <ImageZoomModal 
          imageUrl={log.image_url} 
          onClose={() => setShowZoomImage(false)} 
        />
      )}
    </>
  );
};

export default QualityRecordCard;
