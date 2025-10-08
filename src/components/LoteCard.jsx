import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Ruler, Truck, QrCode, Trash2, X, Edit, CalendarCheck, Calendar as CalendarIcon, CheckCircle, FileText, CreditCard, FileImage as ImageIcon, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import QRCodeGenerator from '@/components/QRCodeGenerator';

const StatusButton = ({ Icon, label, isActive, onClick, colorClass, isDisabled = false }) => {
  const colorMap = {
    pago: { bg: 'bg-emerald-500', text: 'text-emerald-50', ring: 'ring-emerald-500' },
    medida: { bg: 'bg-cyan-500', text: 'text-cyan-50', ring: 'ring-cyan-500' },
    notaFiscal: { bg: 'bg-indigo-500', text: 'text-indigo-50', ring: 'ring-indigo-500' },
    programado: { bg: 'bg-orange-500', text: 'text-orange-50', ring: 'ring-orange-500' },
    pintado: { bg: 'bg-green-600', text: 'text-green-50', ring: 'ring-green-600' },
  };

  const activeClasses = colorMap[colorClass];
  
  const inactiveBg = 'bg-slate-700/50';
  const inactiveText = 'text-slate-400';
  const inactiveRing = 'ring-transparent';
  
  const baseClasses = `p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2`;
  const stateClasses = isActive ? `${activeClasses.bg} ${activeClasses.ring}` : `${inactiveBg} ${inactiveRing}`;
  const disabledClasses = isDisabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:-translate-y-0.5';

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.05, y: -2 }}
      whileTap={isDisabled ? {} : { scale: 0.95 }}
      onClick={isDisabled ? undefined : onClick}
      className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
    >
      {isDisabled && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-slate-400" />}
      <Icon className={`w-4 h-4 transition-colors ${isActive ? activeClasses.text : inactiveText}`} />
      <span className={`text-[10px] font-bold transition-colors ${isActive ? activeClasses.text : inactiveText}`}>{label}</span>
      <AnimatePresence>
      {isActive &&
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 bg-white/20"
          style={{ clipPath: 'circle(100% at 50% 50%)' }}
          transition={{ duration: 0.4 }}
        />
      }
      </AnimatePresence>
    </motion.button>
  );
};

const LoteCard = ({ lote, index, userRole, onUpdateStatus, onMarcarEntregue, onDelete, onEdit }) => {
  const [showQR, setShowQR] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const handleToggleStatus = (field) => {
    const isProtectedField = ['pago', 'medida', 'notaFiscal'].includes(field);
    if (isProtectedField && userRole !== 'administrador') {
      toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para alterar este status.", variant: "destructive" });
      return;
    }
    onUpdateStatus(lote.id, { [field]: !lote[field] });
  };

  const getStatusText = () => {
    if (lote.pintado) return 'Pintado';
    if (lote.programado) return 'Programado p/ Hoje';
    return 'Recebido';
  };

  const getStatusColor = () => {
    if (lote.pintado) return 'bg-green-600/80';
    if (lote.programado) return 'bg-orange-500/80';
    return 'bg-slate-500/80';
  };
  
  const isReadyForDelivery = lote.pago && lote.medida && lote.pintado;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const isAdmin = userRole === 'administrador';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
        className="glass-effect rounded-2xl overflow-hidden group flex flex-col"
      >
        <div className="p-4 flex flex-col flex-grow gap-4">
          <div className="flex items-center gap-2">
              <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                <StatusButton Icon={DollarSign} label="Pago" isActive={lote.pago} onClick={() => handleToggleStatus('pago')} colorClass="pago" isDisabled={!isAdmin} />
                <StatusButton Icon={Ruler} label="Medida" isActive={lote.medida} onClick={() => handleToggleStatus('medida')} colorClass="medida" isDisabled={!isAdmin} />
                <StatusButton Icon={FileText} label="NF" isActive={lote.notaFiscal} onClick={() => handleToggleStatus('notaFiscal')} colorClass="notaFiscal" isDisabled={!isAdmin} />
              </div>
              
              <div className="flex-grow min-w-0 text-center flex flex-col items-center">
                  <div
                    className="relative w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden mb-2"
                    onClick={() => lote.foto && setShowImage(true)}
                  >
                      {lote.foto ? (
                        <img src={lote.foto} alt={`Lote ${lote.cliente}`} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"/>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      )}
                  </div>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getStatusColor()} mb-1 shadow-md`}>
                      {getStatusText()}
                  </div>
                  <h3 className="text-base font-bold text-shadow-lg text-slate-100 truncate w-full">{lote.cliente}</h3>
                  <p className="text-xs text-slate-300 text-shadow truncate w-full">
                      {lote.cor} • {lote.quantidade} peças
                  </p>
                  {lote.prazoEntrega && (
                  <div className="mt-1 glass-effect px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <CalendarIcon className="w-3 h-3 text-sky-300" />
                      <span>{formatDate(lote.prazoEntrega)}</span>
                  </div>
                  )}
              </div>
              
              <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                <StatusButton Icon={CalendarCheck} label="Progr." isActive={lote.programado} onClick={() => handleToggleStatus('programado')} colorClass="programado" />
                <StatusButton Icon={CheckCircle} label="Pintado" isActive={lote.pintado} onClick={() => handleToggleStatus('pintado')} colorClass="pintado" />
              </div>
          </div>
          
          {lote.metodoPagamento && (
            <div className="glass-effect rounded-lg p-2 text-[11px] mt-auto">
                <div className="flex items-center gap-2 text-slate-300">
                    <CreditCard className="w-3 h-3 flex-shrink-0 text-sky-300" />
                    <span>Pgto: <strong>{lote.metodoPagamento}</strong></span>
                </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/60 p-2">
          <div className="flex gap-2">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowQR(true)} className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl transition-all flex-shrink-0" aria-label="Gerar QR Code">
                <QrCode className="w-4 h-4 text-sky-300" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(lote)} className={`p-2.5 glass-effect rounded-xl transition-all flex-shrink-0 ${isAdmin ? 'hover:bg-slate-700/60' : 'opacity-50 cursor-not-allowed'}`} aria-label="Editar Lote" disabled={!isAdmin}>
                <Edit className="w-4 h-4 text-sky-300" />
            </motion.button>
            
            <motion.button whileHover={{ scale: isReadyForDelivery ? 1.02 : 1 }} whileTap={{ scale: isReadyForDelivery ? 0.98 : 1 }} onClick={() => onMarcarEntregue(lote.id)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isReadyForDelivery ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30' : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'}`}>
              <Truck className="w-4 h-4" />
              Entregar
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (window.confirm('Tem certeza que deseja excluir este lote?')) { onDelete(lote.id); } }} className={`p-2.5 glass-effect rounded-xl transition-all flex-shrink-0 text-slate-400 ${isAdmin ? 'hover:bg-red-500/20 hover:text-red-400' : 'opacity-50 cursor-not-allowed'}`} aria-label="Excluir Lote" disabled={!isAdmin}>
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {showQR && (
        <QRCodeGenerator
          loteId={lote.id}
          cliente={lote.cliente}
          onClose={() => setShowQR(false)}
        />
      )}

      {showImage && lote.foto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImage(false)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowImage(false)} className="absolute -top-12 right-0 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-all text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </motion.button>
            <img src={lote.foto} alt={`Lote ${lote.cliente}`} className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default LoteCard;