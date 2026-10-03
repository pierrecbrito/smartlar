import React, { useEffect, useState, useMemo } from 'react';
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Play,
  History,
  Eye,
  X,
  CreditCard,
  User,
  Clock,
  ArrowRight,
  FolderKanban,
  List,
  Search,
  AlertCircle,
  AlertTriangle,
  Lock,
  FileText,
  Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, StatusPedido, HistoricoStatus } from '../types/database';
import { formatCurrency, formatDateTime, formatDate, formatPhone, formatOrderCode, getCurrentDateTimeLocal, STATUS_CONFIG, PROXIMOS_STATUS } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ModalPortal } from '../components/ModalPortal';
import { OrcamentoPdfModal } from '../components/OrcamentoPdfModal';

const KANBAN_COLUMNS: StatusPedido[] = [
  'orcamento',
  'aprovado',
  'agendado',
  'em_andamento',
  'concluido',
  'cancelado',
];

export const PedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [search, setSearch] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatusPedido | null>(null);

  // Modal de Agendamento
  const [schedulingOrder, setSchedulingOrder] = useState<Pedido | null>(null);
  const [scheduleTecnicoId, setScheduleTecnicoId] = useState('');
  const [scheduleData, setScheduleData] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Modal de Histórico de Auditoria
  const [historyOrder, setHistoryOrder] = useState<Pedido | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoricoStatus[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal de Detalhes dos Itens do Pedido
  const [viewingOrder, setViewingOrder] = useState<Pedido | null>(null);

  // Modal de Proposta PDF e Envio WhatsApp
  const [pdfModalOrder, setPdfModalOrder] = useState<Pedido | null>(null);

  const { showToast } = useToast();

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pedidosRes, tecnicosRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(*),
            tecnico:tecnicos(*),
            itens:itens_pedido(*, produto:produtos(*))
          `)
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setPedidos(pedidosRes.data || []);
      setTecnicos(tecnicosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao listar pedidos:', err);
      showToast('error', 'Falha ao carregar pedidos', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPedidos = pedidos.filter((p) => {
    const matchStatus =
      viewMode === 'kanban' || selectedStatusFilter === 'todos' || p.status === selectedStatusFilter;
    const searchClean = search.trim().toLowerCase().replace('#', '');
    const matchSearch =
      search.trim() === '' ||
      p.numero_pedido?.toString().includes(searchClean) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.tecnico?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.observacoes?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const schedulingConflict = useMemo(() => {
    if (!schedulingOrder || !scheduleTecnicoId || !scheduleData) return null;
    const targetTime = new Date(scheduleData).getTime();
    if (isNaN(targetTime)) return null;

    return pedidos.find((p) => {
      if (p.id === schedulingOrder.id) return false;
      if (p.tecnico_id !== scheduleTecnicoId) return false;
      if (p.status !== 'agendado' && p.status !== 'em_andamento') return false;
      if (!p.data_instalacao) return false;

      const orderTime = new Date(p.data_instalacao).getTime();
      const diffHours = Math.abs(orderTime - targetTime) / (1000 * 60 * 60);
      return diffHours < 2;
    });
  }, [schedulingOrder, scheduleTecnicoId, scheduleData, pedidos]);

  const draggedOrder = draggedOrderId ? pedidos.find((p) => p.id === draggedOrderId) || null : null;
  const allowedNextStatuses = draggedOrder ? (PROXIMOS_STATUS[draggedOrder.status] || []) : [];

  const handleDragStart = (e: React.DragEvent, pedido: Pedido) => {
    const allowed = PROXIMOS_STATUS[pedido.status] || [];
    if (allowed.length === 0) {
      e.preventDefault();
      showToast('info', 'Status final', 'Pedidos concluídos ou cancelados não podem ser alterados.');
      return;
    }
    e.dataTransfer.setData('text/plain', pedido.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(pedido.id);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusPedido) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (!orderId) {
      setDraggedOrderId(null);
      return;
    }

    const pedido = pedidos.find((p) => p.id === orderId);
    if (!pedido) {
      setDraggedOrderId(null);
      return;
    }

    if (pedido.status === targetStatus) {
      setDraggedOrderId(null);
      return;
    }

    const allowed = PROXIMOS_STATUS[pedido.status] || [];
    if (!allowed.includes(targetStatus)) {
      showToast(
        'error',
        'Transição não permitida',
        `Apenas a próxima fase é permitida. Este pedido só pode avançar para: ${
          allowed.length > 0
            ? allowed.map((s) => `"${STATUS_CONFIG[s].label}"`).join(' ou ')
            : 'Nenhuma (status final)'
        }.`
      );
      setDraggedOrderId(null);
      return;
    }

    setDraggedOrderId(null);
    handleTransitionStatus(pedido, targetStatus);
  };

  const handleTransitionStatus = async (pedido: Pedido, novoStatus: StatusPedido) => {
    if (novoStatus === 'agendado') {
      setSchedulingOrder(pedido);
      setScheduleTecnicoId(pedido.tecnico_id || (tecnicos[0]?.id || ''));
      setScheduleData('');
      return;
    }

    // Atualização otimista imediata para transição instantânea e fluida
    const previousPedidos = [...pedidos];
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p))
    );

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedido.id);

      if (error) throw error;

      showToast(
        'success',
        `Status atualizado para "${STATUS_CONFIG[novoStatus].label}"`,
        `Pedido ${formatOrderCode(pedido)} avançou no fluxo.`
      );

      // Sincroniza em background sem recriar o esqueleto do Kanban
      loadData(true);
    } catch (err: any) {
      // Reverte a alteração otimista caso o banco rejeite
      setPedidos(previousPedidos);
      console.error('Erro na transição:', err);
      showToast(
        'error',
        'Transição de status não permitida',
        err.message || 'Verifique as regras de fluxo do pedido.'
      );
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingOrder) return;

    if (!scheduleTecnicoId || !scheduleData) {
      showToast('error', 'Campos obrigatórios', 'Técnico e Data/Horário são obrigatórios para agendar.');
      return;
    }

    const selectedTime = new Date(scheduleData).getTime();
    if (isNaN(selectedTime) || selectedTime < Date.now() - 60000) {
      showToast('error', 'Data retroativa', 'A data e horário de instalação não podem ser no passado.');
      return;
    }

    setSavingSchedule(true);
    try {
      const isoDate = new Date(scheduleData).toISOString();
      const tecnicoObj = tecnicos.find((t) => t.id === scheduleTecnicoId);

      // Atualização otimista no estado local
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === schedulingOrder.id
            ? {
                ...p,
                status: 'agendado',
                tecnico_id: scheduleTecnicoId,
                tecnico: tecnicoObj || p.tecnico,
                data_instalacao: isoDate,
              }
            : p
        )
      );

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'agendado',
          tecnico_id: scheduleTecnicoId,
          data_instalacao: isoDate,
        })
        .eq('id', schedulingOrder.id);

      if (error) throw error;

      showToast(
        'success',
        'Instalação agendada com sucesso!',
        `Data e técnico registrados com sucesso no sistema.`
      );

      setSchedulingOrder(null);
      loadData(true);
    } catch (err: any) {
      loadData(true);
      console.error('Erro ao agendar:', err);
      showToast('error', 'Falha ao gravar agendamento', err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenHistory = async (pedido: Pedido) => {
    setHistoryOrder(pedido);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('historico_status')
        .select('*')
        .eq('pedido_id', pedido.id)
        .order('alterado_em', { ascending: true });

      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      showToast('error', 'Erro ao carregar histórico', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const statusOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'orcamento', label: 'Orçamentos' },
    { id: 'aprovado', label: 'Aprovados' },
    { id: 'agendado', label: 'Agendados' },
    { id: 'em_andamento', label: 'Em Andamento' },
    { id: 'concluido', label: 'Concluídos' },
    { id: 'cancelado', label: 'Cancelados' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            FLUXO OPERACIONAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento e controle de status dos atendimentos
          </p>
        </div>

        {/* Top Controls: Search + View Switch */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, número, técnico..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 shadow-2xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Se estiver no modo lista, exibe os filtros de status pills */}
      {viewMode === 'lista' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusOptions.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatusFilter(st.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Visualização KANBAN */}
      {viewMode === 'kanban' ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col} className="h-96 bg-white/60 border border-slate-200/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[580px] scrollbar-thin">
            {KANBAN_COLUMNS.map((colStatus) => {
              const colConfig = STATUS_CONFIG[colStatus];
              const colPedidos = filteredPedidos.filter((p) => p.status === colStatus);
              const colTotal = colPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);

              const isDragging = draggedOrder !== null;
              const isCurrentCol = draggedOrder?.status === colStatus;
              const isAllowedTarget = isDragging && allowedNextStatuses.includes(colStatus);
              const isDisallowedTarget = isDragging && !isAllowedTarget && !isCurrentCol;
              const isOver = dragOverColumn === colStatus && isAllowedTarget;

              return (
                <div
                  key={colStatus}
                  onDragOver={(e) => {
                    if (!draggedOrder || !isAllowedTarget) {
                      e.dataTransfer.dropEffect = 'none';
                      return;
                    }
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColumn !== colStatus) {
                      setDragOverColumn(colStatus);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverColumn === colStatus) setDragOverColumn(null);
                  }}
                  onDrop={(e) => {
                    if (!isAllowedTarget) {
                      e.preventDefault();
                      setDragOverColumn(null);
                      showToast(
                        'error',
                        'Transição não permitida',
                        `Não é permitido pular fases. O pedido só pode avançar para: ${
                          allowedNextStatuses.length > 0
                            ? allowedNextStatuses.map((s) => STATUS_CONFIG[s]?.label).join(' ou ')
                            : 'Nenhuma'
                        }.`
                      );
                      return;
                    }
                    handleDrop(e, colStatus);
                  }}
                  className={`w-[290px] min-w-[290px] shrink-0 rounded-2xl border transition-all flex flex-col max-h-[calc(100vh-230px)] ${
                    isOver
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-md'
                      : isAllowedTarget
                      ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-400/20 shadow-xs'
                      : isDisallowedTarget
                      ? 'opacity-40 border-dashed border-slate-300 bg-slate-100/40 select-none'
                      : 'bg-slate-100/70 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Cabeçalho da Coluna Kanban */}
                  <div
                    className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between transition-colors ${
                      isAllowedTarget
                        ? 'border-blue-200 bg-blue-100/60'
                        : 'border-slate-200/80 bg-white/70 backdrop-blur-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colConfig.dot}`} />
                      <span className="font-extrabold text-xs text-slate-800 tracking-tight">
                        {colConfig.label}
                      </span>
                      <span className="bg-slate-200/80 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {colPedidos.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAllowedTarget && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white/95 px-2 py-0.5 rounded-full border border-blue-300 shadow-2xs animate-pulse">
                          <ArrowRight className="w-2.5 h-2.5" /> Próxima fase
                        </span>
                      )}
                      {isDisallowedTarget && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                      {!isDragging && (
                        <span className="text-[11px] font-bold text-slate-500">
                          {formatCurrency(colTotal)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drop helper visual indicator */}
                  {isOver && (
                    <div className="mx-2.5 mt-2 border-2 border-dashed border-blue-500 bg-blue-100/70 rounded-xl p-2 text-center text-xs font-bold text-blue-800 shadow-inner animate-pulse">
                      Solte aqui para avançar para {colConfig.label}
                    </div>
                  )}

                  {/* Lista de Cards da Coluna com Espaçamento Limpo */}
                  <div className="p-2.5 space-y-3 overflow-y-auto flex-1 min-h-[140px]">
                    {colPedidos.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                        <span className="text-xs">Nenhum pedido</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {isAllowedTarget ? 'Solte o card aqui' : 'Vazio'}
                        </span>
                      </div>
                    ) : (
                      colPedidos.map((pedido) => {
                        const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
                        const canDrag = allowedTransitions.length > 0;
                        const isThisDragged = draggedOrderId === pedido.id;

                        return (
                          <div
                            key={pedido.id}
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, pedido)}
                            onDragEnd={() => {
                              setDraggedOrderId(null);
                              setDragOverColumn(null);
                            }}
                            style={{ borderBottom: '2px solid rgb(42 108 184 / 0.35)' }}
                            className={`bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition-all group space-y-2.5 overflow-hidden ${
                              isThisDragged
                                ? 'opacity-30 border-dashed border-blue-400 scale-[0.98]'
                                : canDrag
                                ? 'cursor-grab active:cursor-grabbing hover:border-slate-300'
                                : 'cursor-default hover:border-slate-200'
                            }`}
                          >
                            {/* Card Top: ID + Data + Cancelar (se permitido) */}
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${colConfig.dot}`} />
                                <span className="font-mono font-bold text-slate-800 truncate">
                                  {formatOrderCode(pedido)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-slate-400 font-medium text-[10px]">
                                  {formatDate(pedido.created_at)}
                                </span>
                                {allowedTransitions.includes('cancelado') && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Deseja realmente cancelar este pedido?')) {
                                        handleTransitionStatus(pedido, 'cancelado');
                                      }
                                    }}
                                    className="p-1 -mr-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Cancelar Pedido"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Cliente */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {pedido.cliente?.nome || 'Cliente não informado'}
                                </span>
                              </div>
                              {pedido.cliente?.telefone && (
                                <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                                  {formatPhone(pedido.cliente.telefone)}
                                </p>
                              )}
                            </div>

                            {/* Informações de Instalação / Técnico */}
                            {(pedido.tecnico || pedido.data_instalacao) && (
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-1">
                                {pedido.tecnico && (
                                  <div className="flex items-center gap-1.5 text-slate-700">
                                    <span className="text-xs">🛠️</span>
                                    <span className="font-semibold truncate">{pedido.tecnico.nome}</span>
                                  </div>
                                )}
                                {pedido.data_instalacao && (
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{formatDateTime(pedido.data_instalacao)}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Rodapé do Card: Total e Ações */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-nowrap">
                              <div className="shrink-0">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">Total</span>
                                <span className="text-xs font-extrabold text-slate-900 leading-none">
                                  {formatCurrency(pedido.valor_total)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingOrder(pedido)}
                                  title="Ver Itens"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(pedido)}
                                  title="Histórico de Alterações"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPdfModalOrder(pedido)}
                                  title="Gerar Proposta PDF / WhatsApp"
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>

                                {allowedTransitions.filter((s) => s !== 'cancelado').map((nextStatus) => {
                                  if (nextStatus === 'aprovado') {
                                    return (
                                      <button
                                        key={nextStatus}
                                        type="button"
                                        onClick={() => handleTransitionStatus(pedido, 'aprovado')}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Aprovar Orçamento"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Aprovar
                                      </button>
                                    );
                                  }
                                  if (nextStatus === 'agendado') {
                                    return (
                                      <button
                                        key={nextStatus}
                                        type="button"
                                        onClick={() => handleTransitionStatus(pedido, 'agendado')}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Agendar Técnico"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        Agendar
                                      </button>
                                    );
                                  }
                                  if (nextStatus === 'em_andamento') {
                                    return (
                                      <button
                                        key={nextStatus}
                                        type="button"
                                        onClick={() => handleTransitionStatus(pedido, 'em_andamento')}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Iniciar Instalação"
                                      >
                                        <Play className="w-3 h-3" />
                                        Iniciar
                                      </button>
                                    );
                                  }
                                  if (nextStatus === 'concluido') {
                                    return (
                                      <button
                                        key={nextStatus}
                                        type="button"
                                        onClick={() => handleTransitionStatus(pedido, 'concluido')}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Concluir Instalação"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Concluir
                                      </button>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Visualização em LISTA TRADICIONAL */
        loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white border border-slate-200/80 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-2xs">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">Nenhum pedido encontrado neste status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPedidos.map((pedido) => {
              const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
              const statusStyle = STATUS_CONFIG[pedido.status];

              return (
                <div
                  key={pedido.id}
                  className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs hover:border-primary-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Dados Principais */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                        {formatOrderCode(pedido)}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Criado em {formatDateTime(pedido.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Cliente</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {pedido.cliente?.nome || 'Cliente não encontrado'}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5">{formatPhone(pedido.cliente?.telefone)}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Técnico Alocado</span>
                        <span className="font-semibold text-slate-700">
                          {pedido.tecnico?.nome ? (
                            `🛠️ ${pedido.tecnico.nome}`
                          ) : (
                            <span className="text-amber-600 font-medium">Não alocado</span>
                          )}
                        </span>
                        {pedido.data_instalacao && (
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            📅 {formatDateTime(pedido.data_instalacao)}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Valor Total</span>
                        <span className="font-extrabold text-base text-slate-900">
                          {formatCurrency(pedido.valor_total)}
                        </span>
                        {pedido.forma_pagamento && (
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold mt-0.5">
                            💳 {pedido.forma_pagamento.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {pedido.observacoes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        💬 "{pedido.observacoes}"
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingOrder(pedido)}
                      className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ver Itens"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span className="hidden sm:inline">Itens</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenHistory(pedido)}
                      className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Histórico"
                    >
                      <History className="w-4 h-4 text-slate-500" />
                      <span className="hidden sm:inline">Histórico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfModalOrder(pedido)}
                      className="p-2.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Proposta em PDF / WhatsApp"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">PDF / WhatsApp</span>
                    </button>

                    {/* Transições permitidas */}
                    {allowedTransitions.map((nextStatus) => {
                      if (nextStatus === 'aprovado') {
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => handleTransitionStatus(pedido, 'aprovado')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aprovar
                          </button>
                        );
                      }

                      if (nextStatus === 'agendado') {
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => handleTransitionStatus(pedido, 'agendado')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-4 h-4" />
                            Agendar
                          </button>
                        );
                      }

                      if (nextStatus === 'em_andamento') {
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => handleTransitionStatus(pedido, 'em_andamento')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar
                          </button>
                        );
                      }

                      if (nextStatus === 'concluido') {
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => handleTransitionStatus(pedido, 'concluido')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Concluir
                          </button>
                        );
                      }

                      if (nextStatus === 'cancelado') {
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => {
                              if (confirm('Deseja realmente cancelar este pedido?')) {
                                handleTransitionStatus(pedido, 'cancelado');
                              }
                            }}
                            className="px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Agendar Instalação */}
      {schedulingOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      Agendar Instalação
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      Pedido {formatOrderCode(schedulingOrder)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSchedulingOrder(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-950 space-y-1">
                  <p><b>Cliente:</b> {schedulingOrder.cliente?.nome}</p>
                  <p><b>Endereço:</b> {schedulingOrder.cliente?.endereco}</p>
                  <p><b>Total do Pedido:</b> {formatCurrency(schedulingOrder.valor_total)}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Técnico Responsável *
                  </label>
                  <select
                    required
                    value={scheduleTecnicoId}
                    onChange={(e) => setScheduleTecnicoId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Selecione o técnico --</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.especialidade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data e Horário *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={getCurrentDateTimeLocal()}
                    value={scheduleData}
                    onChange={(e) => setScheduleData(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {schedulingConflict && (
                  <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Aviso de Proximidade de Horário</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        O técnico selecionado já possui o pedido <b>{formatOrderCode(schedulingConflict)}</b> agendado próximo a esse horário ({formatDateTime(schedulingConflict.data_instalacao)}). Verifique a viabilidade de deslocamento.
                      </p>
                    </div>
                  </div>
                )}



                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSchedulingOrder(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingSchedule}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingSchedule ? 'Salvando agendamento...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Histórico de Auditoria */}
      {historyOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      Histórico do Pedido
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      {formatOrderCode(historyOrder)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryOrder(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto">
                {loadingHistory ? (
                  <div className="py-8 text-center text-xs text-slate-400">Carregando histórico...</div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Nenhum registro de alteração.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {log.status_anterior ? (
                                <>
                                  <span className="text-slate-500">{STATUS_CONFIG[log.status_anterior].label}</span>
                                  <span className="text-slate-400 mx-1">➔</span>
                                </>
                              ) : (
                                <span className="text-slate-500">Criação inicial: </span>
                              )}
                              <span className="text-blue-600">{STATUS_CONFIG[log.status_novo].label}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(log.alterado_em)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Detalhes dos Itens */}
      {viewingOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      Itens do Pedido
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      {formatOrderCode(viewingOrder)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {viewingOrder.itens && viewingOrder.itens.length > 0 ? (
                    viewingOrder.itens.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.produto?.nome || 'Produto'}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Nenhum item vinculado.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500">Total Confirmado:</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(viewingOrder.valor_total)}
                  </span>
                </div>

                {viewingOrder.cliente && (
                  <button
                    type="button"
                    onClick={() => {
                      const orderToOpen = viewingOrder;
                      setViewingOrder(null);
                      setPdfModalOrder(orderToOpen);
                    }}
                    className="w-full mt-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Gerar Proposta PDF / Enviar WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Proposta Comercial em PDF e Envio WhatsApp */}
      {pdfModalOrder && pdfModalOrder.cliente && (
        <OrcamentoPdfModal
          isOpen={Boolean(pdfModalOrder)}
          onClose={() => setPdfModalOrder(null)}
          pedido={pdfModalOrder}
          cliente={pdfModalOrder.cliente}
          itens={pdfModalOrder.itens || []}
          descontoPercentual={0}
          observacoes={pdfModalOrder.observacoes || ''}
          formaPagamento={pdfModalOrder.forma_pagamento || ''}
        />
      )}
    </div>
  );
};
