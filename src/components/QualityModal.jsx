
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Plus, Loader2, ListTodo, ShieldAlert, Camera, UploadCloud, Trash2, PieChart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createQualityAlert, getAllAlerts, deactivateAlert, uploadAlertImage } from '@/services/qualityService';
import QualityDailyLog from './QualityDailyLog';
import QualityReports from './QualityReports';
import AlertBadge from './AlertBadge';
import EditAlertModal from './EditAlertModal';

const QualityModal = ({
  isOpen,
  onClose,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState('alertas'); // 'alertas' | 'diario' | 'relatorios'
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    cor: '',
    description: '',
    image_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'alertas') {
      fetchAlerts();
    }
  }, [isOpen, activeTab]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAllAlerts();
      setAlerts(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar alertas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async id => {
    try {
      await deactivateAlert(id);
      toast({
        title: "✅ Resolvido",
        description: "Alerta desativado com sucesso."
      });
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desativar o alerta.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas imagens.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.client_name.trim()) {
      toast({
        title: "Aviso",
        description: "Nome do cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    let finalImageUrl = formData.image_url;
    try {
      if (selectedFile) {
        setUploadProgress(true);
        try {
          finalImageUrl = await uploadAlertImage(selectedFile);
        } catch (uploadError) {
          toast({
            title: "Erro no Upload",
            description: uploadError.message,
            variant: "destructive"
          });
          setSubmitting(false);
          setUploadProgress(false);
          return;
        }
        setUploadProgress(false);
      }
      await createQualityAlert({
        ...formData,
        image_url: finalImageUrl,
        created_by: userRole || 'usuário'
      });
      toast({
        title: "✅ Alerta Criado",
        description: "O alerta de qualidade foi registrado."
      });

      // Reset form
      setFormData({
        client_name: '',
        cor: '',
        description: '',
        image_url: ''
      });
      removeSelectedFile();
      fetchAlerts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o alerta.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
    }
  };

  if (!isOpen) return null;
  const isAdmin = userRole === 'administrador';

  return <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={e => e.stopPropagation()} className="glass-effect rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden bg-slate-900 border border-slate-800">
          <div className="flex flex-col border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between p-4 px-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Controle de Qualidade</h2>
              </div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="flex px-6 gap-2 pt-2 overflow-x-auto custom-scrollbar pb-1">
                <button onClick={() => setActiveTab('alertas')} className={`px-4 py-2.5 rounded-t-lg font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'alertas' ? 'bg-slate-800/50 text-white border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}`}>
                  <AlertTriangle className="w-4 h-4" /> Alertas Ativos
                </button>
                <button onClick={() => setActiveTab('diario')} className={`px-4 py-2.5 rounded-t-lg font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'diario' ? 'bg-slate-800/50 text-white border-sky-500' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}`}>
                  <ListTodo className="w-4 h-4" /> Registro Diário
                </button>
                <button onClick={() => setActiveTab('relatorios')} className={`px-4 py-2.5 rounded-t-lg font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'relatorios' ? 'bg-slate-800/50 text-white border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}`}>
                  <PieChart className="w-4 h-4" /> Relatórios
                </button>
            </div>
          </div>

          <div className="flex-grow overflow-hidden relative">
             <AnimatePresence mode="wait">
               {activeTab === 'alertas' && <motion.div key="tab-alertas" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/3 p-6 border-r border-slate-800 bg-slate-900/30 overflow-y-auto custom-scrollbar">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-amber-500" />
                        Novo Alerta
                      </h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Cliente *</label>
                          <input type="text" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm" placeholder="Nome do cliente" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Cor (Opcional)</label>
                          <input
                            type="text"
                            value={formData.cor}
                            onChange={e => setFormData({ ...formData, cor: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm"
                            placeholder="Ex: Branco, Preto (Vazio = qualquer cor)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500 text-sm min-h-[100px]" placeholder="Detalhes críticos sobre qualidade, atenção especial..." />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-400 mb-1">Evidência Visual (Imagem)</label>
                          
                          {!previewUrl ? <div className="flex flex-col gap-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors">
                                  <Camera className="w-4 h-4" />
                                  Tirar Foto
                                </button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors">
                                  <UploadCloud className="w-4 h-4" />
                                  Escolher
                                </button>
                              </div>
                              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
                              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </div> : <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950">
                              <img src={previewUrl} alt="Preview" className="w-full h-32 object-contain bg-black/50" />
                              <button type="button" onClick={removeSelectedFile} className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors" title="Remover Imagem">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>}
                          <p className="text-xs text-slate-500">Max 5MB. Formatos: JPEG, PNG, etc.</p>
                        </div>
                        
                        <div className="pt-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Ou informe uma URL</label>
                          <input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} disabled={!!selectedFile} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 focus:ring-1 focus:ring-amber-500 text-xs disabled:opacity-50" placeholder="https://..." />
                        </div>

                        <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-amber-500/20">
                          {submitting ? <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {uploadProgress ? 'Enviando imagem...' : 'Salvando...'}
                            </> : 'Salvar Alerta'}
                        </button>
                      </form>
                    </div>

                    <div className="w-full md:w-2/3 p-6 overflow-y-auto custom-scrollbar">
                      <h3 className="text-lg font-bold text-white mb-4">Alertas Ativos</h3>
                      
                      {loading ? <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <p>Carregando alertas...</p>
                        </div> : alerts.length === 0 ? <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                          <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-2" />
                          <p>Nenhum alerta de qualidade ativo.</p>
                        </div> : <div className="space-y-4">
                          {alerts.map(alert => (
                            <AlertBadge 
                              key={alert.id} 
                              alert={alert} 
                              isAdmin={isAdmin} 
                              onDeactivate={handleDeactivate} 
                              onEdit={(a) => setEditingAlert(a)}
                              isModal={true} 
                            />
                          ))}
                        </div>}
                    </div>
                 </motion.div>}

               {activeTab === 'diario' && <motion.div key="tab-diario" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="absolute inset-0 p-6 overflow-hidden">
                     <QualityDailyLog userRole={userRole} />
                  </motion.div>}
               
               {activeTab === 'relatorios' && <motion.div key="tab-relatorios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 overflow-hidden">
                     <QualityReports />
                  </motion.div>}
             </AnimatePresence>
          </div>
        </motion.div>
        
        {editingAlert && (
          <EditAlertModal 
            isOpen={true} 
            alert={editingAlert} 
            onClose={() => setEditingAlert(null)} 
            onUpdateSuccess={fetchAlerts} 
          />
        )}
      </motion.div>
    </AnimatePresence>;
};

export default QualityModal;
