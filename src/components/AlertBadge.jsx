
import React from 'react';
import { AlertTriangle, Palette, CheckCircle, Edit, Eye } from 'lucide-react';

const AlertBadge = ({ alert, isAdmin, onDeactivate, isModal = false, onEdit, onViewDetails }) => {
  if (!alert) return null;

  return (
    <div className={`bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-4 border-red-500 rounded-r-lg rounded-l-sm p-3 shadow-md backdrop-blur-sm relative overflow-hidden flex items-start gap-3 ${isModal ? 'bg-slate-900/50' : ''}`}>
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-red-100">
            {isModal ? alert.client_name : 'Alerta de Qualidade'}
          </h4>
          
          <div className="flex items-center gap-1">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(alert)}
                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-colors"
                title="Ver Detalhes"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {isModal && onEdit && (
              <button
                onClick={() => onEdit(alert)}
                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-colors"
                title="Editar Alerta"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isModal && isAdmin && onDeactivate && (
              <button
                onClick={() => onDeactivate(alert.id)}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                title="Desativar/Resolver Alerta"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-red-200 mt-1 leading-snug line-clamp-2">{alert.description}</p>
        
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/40 border border-red-500/30 text-red-300">
            <Palette className="w-3 h-3" />
            {alert.cor ? `Cor: ${alert.cor}` : 'Cor: Qualquer cor'}
          </span>
          {isModal && (
            <span className="text-[10px] text-slate-500">
              {new Date(alert.created_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBadge;
