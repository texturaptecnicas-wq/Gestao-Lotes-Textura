import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Ruler, Truck, QrCode, Trash2, X, Edit, CalendarCheck, Calendar as CalendarIcon, CheckCircle2, FileText, CreditCard, FileImage as ImageIcon } from 'lucide-react';

import QRCodeGenerator from '@/components/QRCodeGenerator';

const StatusButton = ({ Icon, label, isActive, onClick, colorClass }) => {
  const colorMap = {
    pago: { bg: 'bg-emerald-500', text: 'text-emerald-50', ring: 'ring-emerald-500' },
    medida: { bg: 'bg-blue-500', text: 'text-blue-50', ring: 'ring-blue-500' },
    programado: { bg: 'bg-amber-500', text: 'text-amber-50', ring: 'ring-amber-500' },
    pronto: { bg: 'bg-green-500', text: 'text-green-50', ring: 'ring-green-500' },
  };

  const activeClasses = colorMap[colorClass];
  
  const inactiveBg = 'bg-slate-700/50';
  const inactiveText = 'text-slate-400';
  const inactiveRing = 'ring-transparent';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2 ${isActive ? activeClasses.ring : inactiveRing} ${isActive ? activeClasses.bg : inactiveBg}`}
    >
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

const LoteCard = ({ lote, index, onUpdateStatus, onMarcarEntregue, onDelete, onEdit }) => {
  const [showQR, setShowQR] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const handleToggleStatus = (field) => {
    onUpdateStatus(lote.id, { [field]: !lote[field] });
  };

  const getStatusText = () => {
    if (lote.pintado) return 'Pronto';
    if (lote.programado) return 'Programado p/ Hoje';
    return 'Recebido';
  };

  const getStatusColor = () => {
    if (lote.pintado) return 'bg-green-500/80';
    if (lote.programado) return 'bg-amber-500/80';
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
        <div className="p-4 flex flex-col gap-4">
          <div className="flex gap-3">
              <div
                className="relative w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => lote.foto && setShowImage(true)}
              >
                  {lote.foto ? (
                    <img
                      src={lote.foto}
                      alt={`Lote ${lote.cliente}`}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  {lote.foto && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />}
              </div>
              <div className="flex-grow min-w-0">
                  <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getStatusColor()} mb-1 shadow-md`}>
                      {getStatusText()}
                  </div>
                  <h3 className="text-base font-bold text-shadow-lg text-slate-100 truncate">{lote.cliente}</h3>
                  <p className="text-xs text-slate-300 text-shadow truncate">
                      {lote.cor} • {lote.quantidade} peças
                  </p>
                  {lote.prazoEntrega && (
                  <div className="mt-1 glass-effect px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <CalendarIcon className="w-3 h-3 text-sky-300" />
                      <span>{formatDate(lote.prazoEntrega)}</span>
                  </div>
                )}
              </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
             <StatusButton Icon={DollarSign} label="Pago" isActive={lote.pago} onClick={() => handleToggleStatus('pago')} colorClass="pago" />
             <StatusButton Icon={Ruler} label="Medida" isActive={lote.medida} onClick={() => handleToggleStatus('medida')} colorClass="medida" />
             <StatusButton Icon={CalendarCheck} label="Progr." isActive={lote.programado} onClick={() => handleToggleStatus('programado')} colorClass="programado" />
             <StatusButton Icon={CheckCircle2} label="Pronto" isActive={lote.pintado} onClick={() => handleToggleStatus('pintado')} colorClass="pronto" />
          </div>

          {(lote.notaFiscal === 'sim' || lote.metodoPagamento) && (
            <div className="glass-effect rounded-lg p-2 text-[11px] space-y-1">
                {lote.notaFiscal === 'sim' && (
                    <div className="flex items-center gap-2 text-slate-300">
                        <FileText className="w-3 h-3 flex-shrink-0 text-sky-300" />
                        <span>Requer Nota Fiscal</span>
                    </div>
                )}
                {lote.metodoPagamento && (
                    <div className="flex items-center gap-2 text-slate-300">
                        <CreditCard className="w-3 h-3 flex-shrink-0 text-sky-300" />
                        <span>Pgto: <strong>{lote.metodoPagamento}</strong></span>
                    </div>
                )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/60 p-2">
          <div className="flex gap-2">
             <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQR(true)}
                className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl transition-all flex-shrink-0"
                aria-label="Gerar QR Code"
             >
                <QrCode className="w-4 h-4 text-sky-300" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(lote)}
                className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl transition-all flex-shrink-0"
                aria-label="Editar Lote"
             >
                <Edit className="w-4 h-4 text-sky-300" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: isReadyForDelivery ? 1.02 : 1 }}
              whileTap={{ scale: isReadyForDelivery ? 0.98 : 1 }}
              onClick={() => onMarcarEntregue(lote.id)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                isReadyForDelivery
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30'
                  : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Truck className="w-4 h-4" />
              Entregar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir este lote?')) {
                  onDelete(lote.id);
                }
              }}
              className="p-2.5 glass-effect hover:bg-red-500/20 rounded-xl transition-all flex-shrink-0 text-slate-400 hover:text-red-400"
              aria-label="Excluir Lote"
            >
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowImage(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowImage(false)}
              className="absolute -top-12 right-0 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-all text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <img
              src={lote.foto}
              alt={`Lote ${lote.cliente}`}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default LoteCard;