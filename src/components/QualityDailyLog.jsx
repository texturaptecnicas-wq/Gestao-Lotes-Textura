import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, RefreshCw, Maximize2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  getDailyLogByDate, 
  getDailyLogDates,
  deleteDailyLogEntry,
  getLogsForPeriod
} from '@/services/qualityService';

import DateTimeline from './DateTimeline';
import QualityRecordCard from './QualityRecordCard';
import SearchAndFilterBar from './SearchAndFilterBar';
import EditDailyLogModal from './EditDailyLogModal';
import ConvertToAlertModal from './ConvertToAlertModal';
import FullscreenQualityView from './FullscreenQualityView';
import FullscreenCardModal from './FullscreenCardModal';

const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatSafeDate = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const QualityDailyLog = ({ userRole }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [logs, setLogs] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [cabineFilter, setCabineFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Modals state
  const [editingLog, setEditingLog] = useState(null);
  const [alertingLog, setAlertingLog] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      const dates = await getDailyLogDates();
      const today = getLocalToday();
      if (!dates.includes(today)) {
        dates.unshift(today);
      }
      setAvailableDates(dates);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar datas.", variant: "destructive" });
    } finally {
      setLoadingDates(false);
    }
  }, []);

  const fetchLogs = useCallback(async (date) => {
    setLoadingLogs(true);
    try {
      const data = await getDailyLogByDate(date);
      setLogs(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar registros do dia.", variant: "destructive" });
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchLogsForRange = useCallback(async (start, end) => {
    setLoadingLogs(true);
    try {
      const data = await getLogsForPeriod(start, end);
      setLogs(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar registros por período.", variant: "destructive" });
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchLogsForRange(dateRange.start, dateRange.end);
    } else {
      fetchLogs(selectedDate);
    }
  }, [selectedDate, dateRange, fetchLogs, fetchLogsForRange]);

  const handleCreateNew = () => {
    setEditingLog({
      isNew: true,
      date: selectedDate || getLocalToday(),
      cabine: 1,
      tamanho_peca: null
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await deleteDailyLogEntry(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      if (expandedCard?.id === id) setExpandedCard(null);
      toast({ title: "Excluído", description: "Registro removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
    }
  };

  const handleLogUpdated = async (savedLog, isNew) => {
    await fetchDates();
    
    if (savedLog.date !== selectedDate && (!dateRange.start || !dateRange.end)) {
      setSelectedDate(savedLog.date);
    } else {
      if (!dateRange.start || !dateRange.end) {
        if (isNew) {
          setLogs(prev => [...prev, savedLog]);
        } else {
          setLogs(prev => prev.map(l => l.id === savedLog.id ? savedLog : l));
        }
      } else {
        fetchLogsForRange(dateRange.start, dateRange.end);
      }
    }
    
    if (expandedCard && expandedCard.id === savedLog.id) {
      setExpandedCard(savedLog);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (dateRange.start || dateRange.end) {
      setDateRange({ start: '', end: '' });
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        (log.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (log.cor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (log.pintor?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesCabine = cabineFilter === 'all' || log.cabine?.toString() === cabineFilter;
      
      const matchesSize = sizeFilter === 'all' || log.tamanho_peca === sizeFilter;
      
      return matchesSearch && matchesCabine && matchesSize;
    });
  }, [logs, searchTerm, cabineFilter, sizeFilter]);

  const getTitleText = () => {
    return dateRange.start && dateRange.end 
      ? `Registros de ${formatSafeDate(dateRange.start)} até ${formatSafeDate(dateRange.end)}`
      : `Registros do Dia ${formatSafeDate(selectedDate)}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800">
      
      {/* Top Header & Search */}
      <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/80 flex flex-col xl:flex-row gap-3 md:gap-4 justify-between items-center shrink-0">
        <div className="flex-1 w-full xl:max-w-[70%]">
          <SearchAndFilterBar 
            searchTerm={searchTerm} 
            onSearch={setSearchTerm} 
            cabineFilter={cabineFilter} 
            onFilterCabine={setCabineFilter} 
            sizeFilter={sizeFilter}
            onFilterSize={setSizeFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
          <button 
            onClick={() => setIsFullscreen(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 touch-target"
            title="Modo Tela Cheia Geral"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              fetchDates();
              if (dateRange.start && dateRange.end) fetchLogsForRange(dateRange.start, dateRange.end);
              else fetchLogs(selectedDate);
            }} 
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors border border-slate-700 touch-target"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleCreateNew}
            className="flex-1 md:flex-none px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 touch-target"
          >
            <Plus className="w-5 h-5" /> Novo Registro
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Sidebar - Timeline (Horizontal on Mobile, Vertical on Desktop) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/30 shrink-0 flex items-center h-[76px] md:h-auto overflow-hidden p-2 md:p-3 relative z-10">
          {dateRange.start && dateRange.end && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[2px] z-20 flex flex-col md:flex-col items-center justify-center p-2 md:p-4 text-center">
              <span className="text-sky-400 mb-1 md:mb-2 text-sm font-semibold">Período Ativo</span>
              <p className="text-[10px] md:text-xs text-slate-400 hidden md:block mb-4">A linha do tempo está desativada enquanto a busca por intervalo for usada.</p>
              <button 
                onClick={() => setDateRange({start: '', end: ''})}
                className="px-3 py-1 md:px-4 md:py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs md:text-sm text-white touch-target"
              >
                Limpar
              </button>
            </div>
          )}
          {loadingDates ? (
            <div className="flex justify-center items-center h-full w-full"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : (
            <DateTimeline 
              dates={availableDates} 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect} 
            />
          )}
        </div>

        {/* Right Content - Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar bg-slate-950/50">
          <div className="mb-4 md:mb-6 flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              {dateRange.start && dateRange.end ? (
                <>De <span className="text-sky-400">{formatSafeDate(dateRange.start)} a {formatSafeDate(dateRange.end)}</span></>
              ) : (
                <>Dia <span className="text-sky-400">{formatSafeDate(selectedDate)}</span></>
              )}
            </h2>
            <span className="text-sm text-slate-400">{filteredLogs.length} registro(s)</span>
          </div>

          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p>Carregando registros...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-4 text-center">
              <p className="text-base md:text-lg">Nenhum registro encontrado para esta data e filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filteredLogs.map(log => (
                <QualityRecordCard 
                  key={log.id} 
                  log={log} 
                  onEdit={setEditingLog}
                  onDelete={handleDelete}
                  onConvertToAlert={setAlertingLog}
                  onExpand={setExpandedCard}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FullscreenQualityView 
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        logs={filteredLogs}
        title={getTitleText()}
        onEdit={(log) => { setEditingLog(log); setIsFullscreen(false); }}
        onDelete={(id) => { handleDelete(id); setIsFullscreen(false); }}
        onConvertToAlert={(log) => { setAlertingLog(log); setIsFullscreen(false); }}
      />

      <FullscreenCardModal 
        isOpen={!!expandedCard}
        onClose={() => setExpandedCard(null)}
        log={expandedCard}
        onEdit={(log) => { setEditingLog(log); setExpandedCard(null); }}
        onDelete={(id) => { handleDelete(id); setExpandedCard(null); }}
        onConvertToAlert={(log) => { setAlertingLog(log); setExpandedCard(null); }}
      />

      <EditDailyLogModal 
        isOpen={!!editingLog} 
        onClose={() => setEditingLog(null)} 
        logData={editingLog} 
        onSaved={handleLogUpdated} 
      />

      <ConvertToAlertModal 
        isOpen={!!alertingLog} 
        onClose={() => setAlertingLog(null)} 
        logData={alertingLog} 
      />

    </div>
  );
};

export default QualityDailyLog;