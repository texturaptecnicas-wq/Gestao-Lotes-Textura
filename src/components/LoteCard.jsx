
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Ruler, Truck, QrCode, Trash2, X, Edit, CalendarCheck, Calendar as CalendarIcon, CheckCircle, FileText, Lock, Star, MessageSquare, Eye, Loader2, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import WhatsAppMessageModal from '@/components/WhatsAppMessageModal';
import ScheduleModal from '@/components/ScheduleModal';
import FinanceConfirmationToast from '@/components/FinanceConfirmationToast';
import { supabase } from '@/lib/customSupabaseClient';

const StatusButton = React.memo(({ Icon, label, status, onClick, isDisabled = false, isLoading = false }) => {
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
      onClick={isDisabled || isLoading ? undefined : onClick}
      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all w-full text-center relative overflow-hidden ring-2 ${activeClasses.bg} ${activeClasses.ring} ${isDisabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:-translate-y-0.5'}`}
    >
      {isDisabled && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-slate-400" />}
      {isLoading ? (
        <Loader2 className={`w-4 h-4 animate-spin ${activeClasses.text}`} />
      ) : (
        <Icon className={`w-4 h-4 transition-colors ${activeClasses.text}`} />
      )}
      <span className={`text-[10px] font-bold transition-colors ${activeClasses.text}`}>{label}</span>
    </motion.button>
  );
});
StatusButton.displayName = 'StatusButton';

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
SimpleStatusButton.displayName = 'SimpleStatusButton';

const LoteCard = ({ lote, userRole, onUpdateStatus, onMarcarEntregue, onDelete, onEdit, onRegisterFinance }) => {
  const [showQR, setShowQR] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  // Finance Toast State
  const [showFinanceToast, setShowFinanceToast] = useState(false);

  const handleShowImage = async () => {
    if (!lote.foto) { toast({ title: "ℹ️ Sem imagem", description: "Nenhuma imagem foi cadastrada para este lote." }); return; }
    setIsLoadingImage(true);
    setShowImage(true);
    const { data } = supabase.storage.from('fotos-lotes').getPublicUrl(lote.foto);
    if(data.publicUrl) { setImageUrl(`${data.publicUrl}?t=${new Date().getTime()}`); }
    else {
       toast({ title: "❌ Erro ao carregar imagem", variant: "destructive" });
       setIsLoadingImage(false);
       setShowImage(false);
    }
  };

  const onImageLoad = () => setIsLoadingImage(false);

  const handleToggleStatus = (field, currentStatus) => {
    if (userRole !== 'administrador' && ['pago', 'medida', 'nota_fiscal'].includes(field)) {
      toast({ title: "🚫 Acesso Negado", description: "Você não tem permissão para alterar este status.", variant: "destructive" });
      return;
    }

    if (field === 'pago') {
      // 3-state cycle: unanalysed (Grey) -> pending (Red) -> ok (Green) -> unanalysed (Grey)
      const cycle = {
        'unanalysed': 'pending', // First click: Set to Red (Não pago)
        'pending': 'ok',         // Second click: Set to Green (Pago)
        'ok': 'unanalysed'       // Third click: Return to Original/Default (Unanalysed)
      };

      const safeCurrentStatus = ['ok', 'pending', 'unanalysed'].includes(currentStatus) ? currentStatus : 'unanalysed';
      const nextStatus = cycle[safeCurrentStatus];

      // Optimistically update status
      onUpdateStatus(lote.id, { pago: nextStatus });

      // If transitioning to 'ok' (Green), show confirmation toast
      if (nextStatus === 'ok') {
        setShowFinanceToast(true);
      } else {
        // If moving away from 'ok' or to 'pending', ensure toast is closed
        setShowFinanceToast(false);
      }
      return;
    }

    // Standard toggle for other fields
    const nextStatus = { 'unanalysed': 'pending', 'pending': 'ok', 'ok': 'unanalysed' };
    onUpdateStatus(lote.id, { [field]: nextStatus[currentStatus] });
  };

  const handleFinanceConfirm = () => {
    // User clicked "Sim" - Redirect to Finance Module Flow
    setShowFinanceToast(false);
    
    // Call the callback to trigger redirection in App.jsx
    if (onRegisterFinance) {
        onRegisterFinance(lote);
    } else {
        console.error("onRegisterFinance callback not provided to LoteCard");
        toast({ title: "Erro", description: "Funcionalidade de redirecionamento não disponível.", variant: "destructive" });
    }
  };

  const handleFinanceCancel = () => {
    // User clicked "Não" - Revert status back to 'pending' (Red)
    onUpdateStatus(lote.id, { pago: 'pending' });
    setShowFinanceToast(false);
    toast({
      description: "Pagamento não confirmado. Status revertido.",
    });
  };

  const handleFinanceDismiss = () => {
    // Timeout or User clicked X
    // We keep status as Paid (Green) because user manually set it, but didn't want to register record now.
    setShowFinanceToast(false);
  };

  const handleWhatsAppClick = () => {
    const defaultMessage = localStorage.getItem('whatsapp_message_default') || 'Olá! Suas peças estão prontas para retirada. PIX: 95443354000117';
    const encodedMessage = encodeURIComponent(defaultMessage);
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  const handleScheduleClick = () => {
    if (lote.programado) {
      setShowScheduleModal(true);
    } else {
      onUpdateStatus(lote.id, { programado: true });
    }
  };

  const getStatusText = () => {
    if (lote.pintado) return 'Pintado';
    if (lote.promessa) return 'Promessa';
    if (lote.programado) return `Cab. ${lote.cabine}`;
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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  
  const isAdmin = userRole === 'administrador';

  return (
    <>
      <FinanceConfirmationToast 
        isVisible={showFinanceToast}
        onConfirm={handleFinanceConfirm}
        onCancel={handleFinanceCancel}
        onDismiss={handleFinanceDismiss}
      />
      
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
        className={`glass-effect rounded-2xl overflow-hidden group flex flex-col h-full relative ${lote.promessa ? 'ring-2 ring-yellow-400 shadow-yellow-400/30 shadow-lg' : ''}`}
      >
        {lote.promessa && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5 z-10 shadow-lg"><Star className="w-4 h-4" fill="currentColor" /></div>}
        <div className="p-4 flex flex-col flex-grow gap-3">
          <div className="flex items-start gap-2">
              <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                <StatusButton 
                  Icon={DollarSign} 
                  label="Pago" 
                  status={lote.pago} 
                  onClick={() => handleToggleStatus('pago', lote.pago)} 
                  isDisabled={!isAdmin} 
                />
                <StatusButton Icon={Ruler} label="Medida" status={lote.medida} onClick={() => handleToggleStatus('medida', lote.medida)} isDisabled={!isAdmin} />
                {lote.precisa_nota_fiscal && <StatusButton Icon={FileText} label="NF" status={lote.nota_fiscal} onClick={() => handleToggleStatus('nota_fiscal', lote.nota_fiscal)} isDisabled={!isAdmin} />}
              </div>
              <div className="flex-grow min-w-0 text-center flex flex-col items-center">
                  <div className="w-24 h-24 flex-shrink-0 bg-slate-900/50 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden mb-2 group/eye" onClick={handleShowImage}>
                     <div className="flex flex-col items-center justify-center gap-1 text-slate-400 group-hover/eye:text-sky-300 group-hover/eye:scale-110 transition-all duration-300">
                      <Eye className="w-8 h-8"/>
                      <span className="text-xs font-bold">Ver Foto</span>
                     </div>
                  </div>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white ${getStatusColor()} mb-2 shadow-md`}>{getStatusText()}</div>
                  <h3 className="text-lg font-bold text-shadow-lg text-slate-100 truncate w-full">{lote.cliente}</h3>
                  <p className="text-sm text-slate-300 text-shadow truncate w-full mb-2">{lote.cor} • {lote.quantidade ? `${lote.quantidade} peças` : 'N/A'}</p>
              </div>
              <div className="flex flex-col gap-2 w-[48px] flex-shrink-0">
                <SimpleStatusButton Icon={CalendarCheck} label="Progr." isActive={lote.programado} onClick={handleScheduleClick} colorClass="programado" />
                <SimpleStatusButton Icon={CheckCircle} label="Pintado" isActive={lote.pintado} onClick={() => onUpdateStatus(lote.id, { pintado: !lote.pintado })} colorClass="pintado" />
                <motion.button whileHover={{scale: 1.05, y: -2}} whileTap={{scale: 0.95}} onClick={() => onUpdateStatus(lote.id, { promessa: !lote.promessa })} className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1.5 w-full ring-2 ${lote.promessa ? 'bg-yellow-400 ring-yellow-400' : 'bg-slate-700/50 ring-transparent'}`}>
                    <Star className={`w-4 h-4 transition-colors ${lote.promessa ? 'text-yellow-900' : 'text-slate-400'}`}/>
                    <span className={`text-[10px] font-bold transition-colors ${lote.promessa ? 'text-yellow-900' : 'text-slate-400'}`}>Promessa</span>
                </motion.button>
              </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 text-center -mt-1">
            {/* Corrected: Using data_criacao instead of created_at */}
            <div className="glass-effect px-2 py-1 rounded-md inline-flex items-center justify-center gap-1.5"><CalendarIcon className="w-3 h-3 text-sky-300" /><span>{formatDate(lote.data_criacao)}</span></div>
            {lote.data_pintura ? 
                <div className="glass-effect px-2 py-1 rounded-md inline-flex items-center justify-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-400" /><span>{formatDate(lote.data_pintura)}</span></div> : <div />
            }
            {lote.prazo_entrega ?
                <div className="glass-effect px-2 py-1 rounded-md inline-flex items-center justify-center gap-1.5 bg-red-500/20 text-red-300 font-semibold"><Truck className="w-3 h-3" /><span>{formatDate(lote.prazo_entrega)}</span></div> : <div />
            }
          </div>

          {(lote.metodo_pagamento || lote.observacao) && (
            <div className="glass-effect rounded-lg p-2 text-xs mt-auto space-y-1">
                {lote.metodo_pagamento && <div className="flex items-center gap-2 text-slate-300"><DollarSign className="w-3 h-3 flex-shrink-0 text-emerald-300" /><span>Pgto: <strong>{lote.metodo_pagamento}</strong></span></div>}
                {lote.observacao && <div className="flex items-start gap-2 text-slate-300"><MessageSquare className="w-3 h-3 flex-shrink-0 text-amber-300 mt-0.5" /><span className="line-clamp-2">{lote.observacao}</span></div>}
            </div>
          )}
        </div>
        <div className="border-t border-slate-700/60 p-2">
          <div className="flex gap-2">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowQR(true)} className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl" aria-label="Gerar QR Code"><QrCode className="w-4 h-4 text-sky-300" /></motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(lote)} className="p-2.5 glass-effect hover:bg-slate-700/60 rounded-xl" aria-label="Editar Lote"><Edit className="w-4 h-4 text-sky-300" /></motion.button>
            
            {lote.pintado && (
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={handleWhatsAppClick}
                onContextMenu={(e) => { e.preventDefault(); setShowWhatsAppModal(true); }}
                className="p-2.5 glass-effect hover:bg-green-500/20 rounded-xl group/whats" 
                aria-label="Enviar WhatsApp"
                title="Clique direito para editar mensagem"
              >
                <MessageCircle className="w-4 h-4 text-green-400 group-hover/whats:scale-110 transition-transform" />
              </motion.button>
            )}
            
            <motion.button whileHover={{ scale: isReadyForDelivery ? 1.02 : 1 }} whileTap={{ scale: isReadyForDelivery ? 0.98 : 1 }} onClick={() => onMarcarEntregue(lote.id)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${isReadyForDelivery ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30' : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'}`}><Truck className="w-4 h-4" />Entregar</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (window.confirm('Tem certeza?')) { onDelete(lote.id); } }} className={`p-2.5 glass-effect rounded-xl text-slate-400 ${isAdmin ? 'hover:bg-red-500/20 hover:text-red-400' : 'opacity-50 cursor-not-allowed'}`} aria-label="Excluir Lote" disabled={!isAdmin}><Trash2 className="w-4 h-4" /></motion.button>
          </div>
        </div>
      </motion.div>
      {showQR && <QRCodeGenerator loteId={lote.id} cliente={lote.cliente} onClose={() => setShowQR(false)} />}
      {showWhatsAppModal && <WhatsAppMessageModal isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} onSave={() => {}} />}
      {showScheduleModal && <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} loteId={lote.id} currentCabine={lote.cabine} />}
      {showImage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImage(false)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full flex items-center justify-center">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowImage(false)} className="absolute -top-12 right-0 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white/80 z-10"><X className="w-6 h-6" /></motion.button>
            {isLoadingImage && <Loader2 className="w-16 h-16 text-white animate-spin absolute" />}
            <img src={imageUrl} alt={`Lote ${lote.cliente}`} className={`w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-opacity ${isLoadingImage ? 'opacity-0' : 'opacity-100'}`} onLoad={onImageLoad} style={{ display: imageUrl ? 'block' : 'none' }} />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default React.memo(LoteCard);
LoteCard.displayName = 'LoteCard';
