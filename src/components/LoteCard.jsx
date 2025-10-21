
    import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { DollarSign, Ruler, Truck, QrCode, Trash2, X, Edit, CalendarCheck, Calendar as CalendarIcon, CheckCircle, FileText, CreditCard, Eye, Star, MessageSquare } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import QRCodeGenerator from '@/components/QRCodeGenerator';

    const StatusButton = React.memo(({ Icon, label, status, onClick, isDisabled = false }) => {
      const colorMap = {
        ok: { bg: 'bg-green-500', text: 'text-green-50', ring: 'ring-green-500' },
        pending: { bg: 'bg-red-500', text: 'text-red-50', ring: 'ring-red-500' },
        unanalysed: { bg: 'bg-slate-700/50', text: 'text-slate-400', ring: 'ring-transparent' },
      };
      const validStatus = ['ok', 'pending', 'unanalysed'].includes(status) ? status : 'unanalysed';
      const activeClasses = colorMap[validStatus];
      
      return (
        <motion.button
          whileHover={isDisabled ? {} : { scale: 1.05, y: -2 }}
          whileTap={isDisabled ? {} : { scale: 0.95 }}
          onClick={isDisabled ? undefined : onClick}
          className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2 ${activeClasses.bg} ${activeClasses.ring} ${isDisabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:-translate-y-0.5'}`}
        >
          <Icon className={`w-4 h-4 transition-colors ${activeClasses.text}`} />
          <span className={`text-[10px] font-bold transition-colors ${activeClasses.text}`}>{label}</span>
        </motion.button>
      );
    });

    const SimpleStatusButton = React.memo(({ Icon, label, isActive, onClick, colorClass }) => {
        const colorMap = {
            programado: { bg: 'bg-orange-500', text: 'text-orange-50', ring: 'ring-orange-500' },
            pintado: { bg: 'bg-green-600', text: 'text-green-50', ring: 'ring-green-600' },
        };
        const activeClasses = colorMap[colorClass];
        const stateClasses = isActive ? `${activeClasses.bg} ${activeClasses.ring}` : 'bg-slate-700/50 ring-transparent';

        return (
            <motion.button whileHover={{scale: 1.05, y: -2}} whileTap={{scale: 0.95}} onClick={onClick} className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2 ${stateClasses} hover:scale-105 hover:-translate-y-0.5`}>
                <Icon className={`w-4 h-4 transition-colors ${isActive ? activeClasses.text : 'text-slate-400'}`}/>
                <span className={`text-[10px] font-bold transition-colors ${isActive ? activeClasses.text : 'text-slate-400'}`}>{label}</span>
            </motion.button>
        );
    });

    const LoteCard = ({ lote, index, userRole, onUpdateStatus, onMarcarEntregue, onDelete, onEdit }) => {
      const [showQR, setShowQR] = useState(false);
      const [showImage, setShowImage] = useState(false);

      const handleToggleStatus = (field, currentStatus) => {
        if (userRole !== 'administrador' && ['pago', 'medida', 'notaFiscal'].includes(field)) {
          toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para alterar este status.", variant: "destructive" });
          return;
        }
        const nextStatus = { 'unanalysed': 'pending', 'pending': 'ok', 'ok': 'unanalysed' };
        const validCurrentStatus = ['ok', 'pending', 'unanalysed'].includes(currentStatus) ? currentStatus : 'unanalysed';
        onUpdateStatus(lote.id, { [field]: nextStatus[validCurrentStatus] });
      };

      const getStatusText = () => {
        if (lote.pintado) return 'Pintado';
        if (lote.promessa) return 'Promessa p/ Hoje';
        if (lote.programado) return 'Programado p/ Hoje';
        return 'Recebido';
      };

      const getStatusColor = () => {
        if (lote.pintado) return 'bg-green-600/80';
        if (lote.promessa) return 'bg-yellow-500/80 text-yellow-900';
        if (lote.programado) return 'bg-orange-500/80';
        return 'bg-slate-500/80';
      };
      
      const isReadyForDelivery = lote.pago === 'ok' && lote.medida === 'ok' && lote.pintado;
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      };
      const isAdmin = userRole === 'administrador';

      return (
        <>
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
            className={`glass-effect rounded-2xl overflow-hidden group flex flex-col h-full relative ${lote.promessa ? 'ring-2 ring-yellow-400 shadow-yellow-400/30 shadow-lg' : ''}`}
          >
            {lote.promessa && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5 z-10 shadow-lg"><Star className="w-4 h-4" fill="currentColor" /></div>}
            <div className="p-4 flex flex-col flex-grow gap-4">
              <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                    <StatusButton Icon={DollarSign} label="Pago" status={lote.pago} onClick={() => handleToggleStatus('pago', lote.pago)} isDisabled={!isAdmin} />
                    <StatusButton Icon={Ruler} label="Medida" status={lote.medida} onClick={() => handleToggleStatus('medida', lote.medida)} isDisabled={!isAdmin} />
                    <StatusButton Icon={FileText} label="NF" status={lote.notaFiscal} onClick={() => handleToggleStatus('notaFiscal', lote.notaFiscal)} isDisabled={!isAdmin} />
                  </div>
                  <div className="flex-grow min-w-0 text-center flex flex-col items-center">
                      <div className="relative w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                        {lote.foto ? (
                          <motion.button 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => setShowImage(true)} 
                            className="w-full h-full flex items-center justify-center bg-transparent hover:bg-sky-500/20 transition-colors duration-300"
                            aria-label="Ver imagem do lote"
                          >
                            <Eye className="w-8 h-8 text-sky-300 group-hover:text-sky-200 transition-colors" />
                          </motion.button>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="w-8 h-8 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getStatusColor()} mb-1 shadow-md`}>{getStatusText()}</div>
                      <h3 className="text-base font-bold text-shadow-lg text-slate-100 truncate w-full">{lote.cliente}</h3>
                      <p className="text-xs text-slate-300 text-shadow truncate w-full">{lote.cor} • {lote.quantidade ? `${lote.quantidade} peças` : 'N/A'}</p>
                      {lote.prazoEntrega && <div className="mt-1 glass-effect px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200"><CalendarIcon className="w-3 h-3 text-sky-300" /><span>{formatDate(lote.prazoEntrega)}</span></div>}
                  </div>
                  <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                    <SimpleStatusButton Icon={CalendarCheck} label="Progr." isActive={lote.programado} onClick={() => onUpdateStatus(lote.id, { programado: !lote.programado })} colorClass="programado" />
                    <SimpleStatusButton Icon={CheckCircle} label="Pintado" isActive={lote.pintado} onClick={() => onUpdateStatus(lote.id, { pintado: !lote.pintado })} colorClass="pintado" />
                    <motion.button whileHover={{scale: 1.05, y: -2}} whileTap={{scale: 0.95}} onClick={() => onUpdateStatus(lote.id, { promessa: !lote.promessa })} className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2 ${lote.promessa ? 'bg-yellow-400 ring-yellow-400' : 'bg-slate-700/50 ring-transparent'}`}>
                        <Star className={`w-4 h-4 transition-colors ${lote.promessa ? 'text-yellow-900' : 'text-slate-400'}`}/>
                        <span className={`text-[10px] font-bold transition-colors ${lote.promessa ? 'text-yellow-900' : 'text-slate-400'}`}>Promessa</span>
                    </motion.button>
                  </div>
              </div>
              {(lote.metodoPagamento || lote.observacao) && (
                <div className="glass-effect rounded-lg p-2 text-[11px] mt-auto space-y-1">
                    {lote.metodoPagamento && <div className="flex items-center gap-2 text-slate-300"><CreditCard className="w-3 h-3 flex-shrink-0 text-sky-300" /><span>Pgto: <strong>{lote.metodoPagamento}</strong></span></div>}
                    {lote.observacao && <div className="flex items-start gap-2 text-slate-300"><MessageSquare className="w-3 h-3 flex-shrink-0 text-amber-300 mt-0.5" /><span className="line-clamp-2">{lote.observacao}</span></div>}
                </div>
              )}
            </div>
            <div className="border-t border-slate-700/60 p-2">
              <div className="flex gap-2">
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowQR(true)} className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl transition-all flex-shrink-0" aria-label="Gerar QR Code"><QrCode className="w-4 h-4 text-sky-300" /></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(lote)} className={`p-2.5 glass-effect rounded-xl transition-all flex-shrink-0 ${isAdmin ? 'hover:bg-slate-700/60' : 'opacity-50 cursor-not-allowed'}`} aria-label="Editar Lote" disabled={!isAdmin}><Edit className="w-4 h-4 text-sky-300" /></motion.button>
                <motion.button whileHover={{ scale: isReadyForDelivery ? 1.02 : 1 }} whileTap={{ scale: isReadyForDelivery ? 0.98 : 1 }} onClick={() => onMarcarEntregue(lote.id)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isReadyForDelivery ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30' : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'}`}><Truck className="w-4 h-4" />Entregar</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (window.confirm('Tem certeza que deseja excluir este lote?')) { onDelete(lote.id); } }} className={`p-2.5 glass-effect rounded-xl transition-all flex-shrink-0 text-slate-400 ${isAdmin ? 'hover:bg-red-500/20 hover:text-red-400' : 'opacity-50 cursor-not-allowed'}`} aria-label="Excluir Lote" disabled={!isAdmin}><Trash2 className="w-4 h-4" /></motion.button>
              </div>
            </div>
          </motion.div>
          {showQR && <QRCodeGenerator loteId={lote.id} cliente={lote.cliente} onClose={() => setShowQR(false)} />}
          {showImage && lote.foto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImage(false)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full">
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowImage(false)} className="absolute -top-12 right-0 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-all text-white/80 hover:text-white"><X className="w-6 h-6" /></motion.button>
                <img src={lote.foto} alt={`Lote ${lote.cliente}`} className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
              </motion.div>
            </motion.div>
          )}
        </>
      );
    };

    const areEqual = (prevProps, nextProps) => {
      return prevProps.lote.id === nextProps.lote.id && prevProps.lote.updatedAt === nextProps.lote.updatedAt;
    };

    export default React.memo(LoteCard, areEqual);
  