import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Phone,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  X,
  ExternalLink,
  MessageSquare,
  Package,
  ArrowRight,
  Check,
  Filter,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, StatusPedido, TipoPagamento } from '../types/database';
import { formatCurrency, formatDateTime, formatDate, formatPhone, formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ModalPortal } from '../components/ModalPortal';

// Horas exibidas na grade do Google Calendar (08:00 às 18:00)
const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// Nomes dos dias da semana em português
const DIAS_SEMANA = [
  { abrev: 'SEG', nome: 'Segunda-feira' },
  { abrev: 'TER', nome: 'Terça-feira' },
  { abrev: 'QUA', nome: 'Quarta-feira' },
  { abrev: 'QUI', nome: 'Quinta-feira' },
  { abrev: 'SEX', nome: 'Sexta-feira' },
  { abrev: 'SÁB', nome: 'Sábado' },
  { abrev: 'DOM', nome: 'Domingo' },
];

export const AgendaPage: React.FC = () => {
  // Dados principais
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosSemData, setPedidosSemData] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);

  // Data de referência do calendário (Inicia em 02 de Outubro de 2026 - Data atual do sistema)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-10-02T12:00:00'));

  // Modos de visualização
  const [viewMode, setViewMode] = useState<'semana' | 'mes' | 'dia'>('semana');

  // Filtros
  const [selectedTecnicoFilter, setSelectedTecnicoFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [selectedEvent, setSelectedEvent] = useState<Pedido | null>(null);
  const [reschedulingOrder, setReschedulingOrder] = useState<Pedido | null>(null);

  // Formulário de Remarcação
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleTecnicoId, setRescheduleTecnicoId] = useState('');
  const [rescheduleObs, setRescheduleObs] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Toast
  const { showToast } = useToast();

  // Carregamento de dados com relacionamentos completos
  const loadData = async () => {
    setLoading(true);
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
          .order('data_instalacao', { ascending: true }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      const all = (pedidosRes.data || []) as unknown as Pedido[];
      setPedidos(all.filter((p) => p.data_instalacao !== null));
      setPedidosSemData(all.filter((p) => p.data_instalacao === null && p.status === 'aprovado'));
      setTecnicos(tecnicosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados da agenda:', err);
      showToast('error', 'Falha ao sincronizar agenda', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Detecção de conflitos de horário entre instalações do mesmo técnico (< 2h de intervalo)
  const conflitosPorTecnico = useMemo(() => {
    const conflitos = new Set<string>();
    const agrupadoPorTecnico: Record<string, Pedido[]> = {};

    pedidos.forEach((p) => {
      if (!p.tecnico_id || !p.data_instalacao || p.status === 'cancelado' || p.status === 'concluido') return;
      if (!agrupadoPorTecnico[p.tecnico_id]) agrupadoPorTecnico[p.tecnico_id] = [];
      agrupadoPorTecnico[p.tecnico_id].push(p);
    });

    Object.values(agrupadoPorTecnico).forEach((lista) => {
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          const t1 = new Date(lista[i].data_instalacao!).getTime();
          const t2 = new Date(lista[j].data_instalacao!).getTime();
          if (Math.abs(t1 - t2) < 7200000) {
            conflitos.add(lista[i].id);
            conflitos.add(lista[j].id);
          }
        }
      }
    });

    return conflitos;
  }, [pedidos]);

  // Checagem de conflito dinâmico no modal de remarcação
  const conflitoRemarcacao = useMemo(() => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleTecnicoId) return null;
    const targetTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).getTime();

    const conflictingOrder = pedidos.find((p) => {
      if (!p.data_instalacao || p.id === reschedulingOrder?.id) return false;
      if (p.tecnico_id !== rescheduleTecnicoId) return false;
      if (p.status === 'cancelado' || p.status === 'concluido') return false;

      const orderTime = new Date(p.data_instalacao).getTime();
      return Math.abs(orderTime - targetTime) < 7200000; // menos de 2 horas
    });

    if (conflictingOrder) {
      const tecnicoNome = tecnicos.find((t) => t.id === rescheduleTecnicoId)?.nome || 'O técnico';
      const orderDate = new Date(conflictingOrder.data_instalacao!);
      const horaStr = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${tecnicoNome} já possui uma instalação agendada para ${conflictingOrder.cliente?.nome || 'outro cliente'} às ${horaStr} neste mesmo dia.`;
    }
    return null;
  }, [rescheduleDate, rescheduleTime, rescheduleTecnicoId, reschedulingOrder, pedidos, tecnicos]);

  // Cálculos de datas da semana atual (Segunda a Domingo)
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 = Domingo, 1 = Segunda...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Cálculos do mês atual (Google Calendar Month Grid)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Encontra a segunda-feira inicial da primeira semana do mês
    const startDayOfWeek = firstDay.getDay();
    const prefixDaysCount = (startDayOfWeek + 6) % 7; // Seg = 0, Ter = 1... Dom = 6

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = prefixDaysCount; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Navegação
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'semana') next.setDate(next.getDate() - 7);
    else if (viewMode === 'mes') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'dia') next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'semana') next.setDate(next.getDate() + 7);
    else if (viewMode === 'mes') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'dia') next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-10-02T12:00:00'));
  };

  // Comparador de "Hoje" (2 de Outubro de 2026)
  const isToday = (date: Date) => {
    const today = new Date('2026-10-02T12:00:00');
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Comparador de mesmo dia
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Título dinâmico do período (estilo Google Calendar)
  const headerDateTitle = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    if (viewMode === 'mes') {
      return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    }

    if (viewMode === 'semana') {
      const endOfWeek = weekDays[6];
      if (weekDays[0].getMonth() === endOfWeek.getMonth()) {
        return `${months[weekDays[0].getMonth()]} de ${weekDays[0].getFullYear()}`;
      }
      return `${months[weekDays[0].getMonth()].slice(0, 3)} – ${months[endOfWeek.getMonth()].slice(0, 3)} de ${endOfWeek.getFullYear()}`;
    }

    // Dia
    return currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate, viewMode, weekDays]);

  // Filtragem de pedidos
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      const matchTecnico =
        selectedTecnicoFilter === 'todos' || p.tecnico_id === selectedTecnicoFilter;
      const matchStatus =
        selectedStatusFilter === 'todos' || p.status === selectedStatusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.cliente?.nome && p.cliente.nome.toLowerCase().includes(q)) ||
        (p.cliente?.endereco && p.cliente.endereco.toLowerCase().includes(q)) ||
        (p.tecnico?.nome && p.tecnico.nome.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q);

      return matchTecnico && matchStatus && matchSearch;
    });
  }, [pedidos, selectedTecnicoFilter, selectedStatusFilter, searchQuery]);

  // Abertura do Modal de Remarcação
  const handleOpenReschedule = (order: Pedido, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReschedulingOrder(order);

    if (order.data_instalacao) {
      const d = new Date(order.data_instalacao);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setRescheduleDate(`${yyyy}-${mm}-${dd}`);
      setRescheduleTime(`${hh}:${min}`);
    } else {
      setRescheduleDate('2026-10-02');
      setRescheduleTime('09:00');
    }

    setRescheduleTecnicoId(order.tecnico_id || (tecnicos[0]?.id ?? ''));
    setRescheduleObs(order.observacoes || '');
  };

  // Salvar Remarcação no Supabase
  const handleSaveReschedule = async () => {
    if (!reschedulingOrder || !rescheduleDate || !rescheduleTime) {
      showToast('error', 'Preencha a data e o horário para remarcar');
      return;
    }

    setSavingReschedule(true);
    try {
      const combinedDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();

      const { error } = await supabase
        .from('pedidos')
        .update({
          data_instalacao: combinedDateTime,
          tecnico_id: rescheduleTecnicoId || null,
          observacoes: rescheduleObs || null,
          status: reschedulingOrder.status === 'orcamento' ? 'agendado' : reschedulingOrder.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reschedulingOrder.id);

      if (error) throw error;

      showToast(
        'success',
        'Instalação remarcada com sucesso!',
        `Novo horário: ${formatDateTime(combinedDateTime)}`
      );

      // Fecha modais e recarrega os dados
      setReschedulingOrder(null);
      if (selectedEvent?.id === reschedulingOrder.id) {
        setSelectedEvent(null);
      }
      await loadData();
    } catch (err: any) {
      console.error('Erro ao remarcar instalação:', err);
      showToast('error', 'Falha ao remarcar instalação', err.message);
    } finally {
      setSavingReschedule(false);
    }
  };

  // Atualização rápida de status (Iniciar / Concluir)
  const handleUpdateStatus = async (pedidoId: string, novoStatus: StatusPedido, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: novoStatus,
          concluido_em: novoStatus === 'concluido' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (error) throw error;

      showToast(
        'success',
        `Instalação atualizada para "${STATUS_CONFIG[novoStatus].label}"`
      );

      if (selectedEvent?.id === pedidoId) {
        setSelectedEvent((prev) => (prev ? { ...prev, status: novoStatus } : null));
      }
      loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar status na agenda:', err);
      showToast('error', 'Erro ao alterar status', err.message);
    }
  };

  // Helper de estilização dos cards no estilo Google Calendar
  const getEventBadgeStyle = (status: StatusPedido) => {
    switch (status) {
      case 'agendado':
        return {
          card: 'bg-blue-50/95 border-l-4 border-l-blue-600 border-blue-200/90 text-blue-950 hover:bg-blue-100/90 shadow-2xs',
          timeBadge: 'bg-blue-600 text-white',
          dot: 'bg-blue-600',
        };
      case 'em_andamento':
        return {
          card: 'bg-amber-50/95 border-l-4 border-l-amber-500 border-amber-200/90 text-amber-950 hover:bg-amber-100/90 shadow-2xs',
          timeBadge: 'bg-amber-600 text-white',
          dot: 'bg-amber-500',
        };
      case 'concluido':
        return {
          card: 'bg-emerald-50/95 border-l-4 border-l-emerald-600 border-emerald-200/90 text-emerald-950 hover:bg-emerald-100/90 shadow-2xs',
          timeBadge: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          card: 'bg-slate-50/95 border-l-4 border-l-slate-400 border-slate-200/90 text-slate-800 hover:bg-slate-100/90 shadow-2xs',
          timeBadge: 'bg-slate-600 text-white',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-800 pb-12">
      {/* ============================================================== */}
      {/* 1. TOP BAR / NAVBAR ESTILO GOOGLE CALENDAR                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificação & Navegação */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                SmartLar Agenda
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Instalações
              </h1>
            </div>
          </div>

          {/* Botão "Hoje" */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
          >
            Hoje
          </button>

          {/* Chevrons < e > */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Título do Mês / Período (ex: "Outubro de 2026") */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize ml-1 min-w-44">
            {headerDateTitle}
          </h2>
        </div>

        {/* Lado Direito: Filtros, Seletor de Modo (Semana, Mês, Dia) & Sincronização */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente ou técnico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtro de Técnico */}
          <div className="relative">
            <select
              value={selectedTecnicoFilter}
              onChange={(e) => setSelectedTecnicoFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="todos">Todos os Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Modo: Semana | Mês | Dia (Google Calendar Style) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mes')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dia')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
          </div>

          {/* Sincronizar */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Atualizar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de pedidos aprovados aguardando agendamento (se houver) */}
      {pedidosSemData.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Há <b>{pedidosSemData.length}</b> {pedidosSemData.length === 1 ? 'instalação aprovada' : 'instalações aprovadas'} aguardando definição de data e técnico.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenReschedule(pedidosSemData[0])}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
          >
            Agendar Agora
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VISUALIZAÇÃO: SEMANA (GOOGLE CALENDAR 7 COLUNAS)           */}
      {/* ============================================================== */}
      {viewMode === 'semana' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cabeçalho dos 7 Dias da Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
            {weekDays.map((day, idx) => {
              const hoje = isToday(day);
              const countInstalacoes = filteredPedidos.filter((p) =>
                p.data_instalacao && isSameDay(new Date(p.data_instalacao), day)
              ).length;

              return (
                <div
                  key={idx}
                  className={`py-3.5 px-2 text-center border-r last:border-r-0 border-slate-100 flex flex-col items-center justify-center transition-colors ${
                    hoje ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <span
                    className={`text-[11px] font-extrabold tracking-wider uppercase ${
                      hoje ? 'text-blue-600 font-black' : 'text-slate-400'
                    }`}
                  >
                    {DIAS_SEMANA[idx].abrev}
                  </span>

                  {/* Número do Dia com destaque circular de "Hoje" estilo Google Calendar */}
                  <div className="mt-1 flex items-center justify-center">
                    <span
                      className={`text-sm font-extrabold flex items-center justify-center rounded-full transition-all ${
                        hoje
                          ? 'w-8 h-8 bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Badge de quantidade de instalações do dia */}
                  {countInstalacoes > 0 ? (
                    <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800">
                      {countInstalacoes} {countInstalacoes === 1 ? 'serviço' : 'serviços'}
                    </span>
                  ) : (
                    <span className="mt-1 text-[10px] text-slate-300">Livre</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grade de 7 Colunas com as Instalações do Dia */}
          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[580px] bg-slate-50/20">
            {weekDays.map((day, dayIndex) => {
              const hoje = isToday(day);
              const dayOrders = filteredPedidos
                .filter((p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), day))
                .sort((a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime());

              return (
                <div
                  key={dayIndex}
                  className={`p-2.5 space-y-2.5 transition-colors flex flex-col justify-start relative ${
                    hoje ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {/* Linha indicadora sutil se for hoje */}
                  {hoje && (
                    <div className="text-[10px] font-extrabold text-blue-600 text-center py-0.5 bg-blue-100/50 rounded-lg mb-1">
                      Dia Atual
                    </div>
                  )}

                  {dayOrders.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-12 text-center text-slate-300">
                      <p className="text-[11px] font-medium">Sem agendamentos</p>
                    </div>
                  ) : (
                    dayOrders.map((order) => {
                      const styles = getEventBadgeStyle(order.status);
                      const hasConflict = conflitosPorTecnico.has(order.id);
                      const orderDate = new Date(order.data_instalacao!);
                      const timeString = orderDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedEvent(order)}
                          className={`rounded-2xl p-2.5 border transition-all cursor-pointer hover:shadow-md group relative ${styles.card} ${
                            hasConflict ? 'ring-2 ring-amber-400' : ''
                          }`}
                        >
                          {/* Topo do Card: Horário & Badge de Status */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${styles.timeBadge}`}>
                              <Clock className="w-2.5 h-2.5" />
                              {timeString}
                            </span>

                            {hasConflict && (
                              <span
                                title="Alerta de sobreposição com outro serviço deste técnico"
                                className="p-0.5 text-amber-600 bg-amber-100 rounded-md"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          {/* Nome do Cliente */}
                          <p className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                            {order.cliente?.nome || 'Cliente não identificado'}
                          </p>

                          {/* Técnico Alocado */}
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold">
                              {order.tecnico?.nome || 'A definir'}
                            </span>
                          </div>

                          {/* Endereço / Local */}
                          {order.cliente?.endereco && (
                            <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-500">
                              <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{order.cliente.endereco}</span>
                            </div>
                          )}

                          {/* Botões de Ação Rápida no Hover: Expandir e Remarcar */}
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5">
                              Detalhes <ArrowRight className="w-2.5 h-2.5" />
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleOpenReschedule(order, e)}
                              className="px-2 py-0.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-lg font-bold shadow-2xs transition-colors cursor-pointer"
                              title="Remarcar esta instalação"
                            >
                              Remarcar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VISUALIZAÇÃO: MÊS (GRADE 7x5 GOOGLE CALENDAR)               */}
      {/* ============================================================== */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cabeçalho dos Dias (SEG a DOM) */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i}>{d.abrev}</div>
            ))}
          </div>

          {/* Grade de Dias do Mês */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const hoje = isToday(date);
              const dayOrders = filteredPedidos.filter(
                (p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), date)
              );

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('dia');
                  }}
                  className={`p-1.5 sm:p-2 min-h-24 sm:min-h-28 transition-colors flex flex-col justify-between cursor-pointer hover:bg-blue-50/30 ${
                    !isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'
                  } ${hoje ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        hoje
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {dayOrders.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* Pílulas de Instalações dentro do dia */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                    {dayOrders.slice(0, 3).map((order) => {
                      const styles = getEventBadgeStyle(order.status);
                      const timeStr = new Date(order.data_instalacao!).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(order);
                          }}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 border cursor-pointer hover:opacity-90 ${styles.card}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
                          <span className="font-mono text-[9px]">{timeStr}</span>
                          <span className="truncate">{order.cliente?.nome}</span>
                        </div>
                      );
                    })}

                    {dayOrders.length > 3 && (
                      <div className="text-[10px] font-bold text-blue-600 pl-1">
                        + {dayOrders.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. VISUALIZAÇÃO: DIA (TIMELINE COMPLETA COM HORAS)             */}
      {/* ============================================================== */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 block">
                Agenda Diária
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 capitalize">
                {currentDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Voltar para Semana
            </button>
          </div>

          {/* Horários do Dia */}
          <div className="space-y-3 divide-y divide-slate-100">
            {CALENDAR_HOURS.map((hour) => {
              const hourOrders = filteredPedidos.filter((p) => {
                if (!p.data_instalacao || !isSameDay(new Date(p.data_instalacao), currentDate)) return false;
                const h = new Date(p.data_instalacao).getHours();
                return h === hour;
              });

              return (
                <div key={hour} className="pt-3 flex items-start gap-4">
                  {/* Coluna da Hora */}
                  <div className="w-16 shrink-0 text-xs font-bold text-slate-400 font-mono pt-1">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Conteúdo da Hora */}
                  <div className="flex-1">
                    {hourOrders.length === 0 ? (
                      <div className="h-8 border-b border-dashed border-slate-100 flex items-center text-[11px] text-slate-300">
                        Disponível
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hourOrders.map((order) => {
                          const styles = getEventBadgeStyle(order.status);
                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedEvent(order)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${styles.card}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${styles.timeBadge}`}>
                                  {new Date(order.data_instalacao!).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenReschedule(order, e)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                                >
                                  Remarcar
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                                {order.cliente?.nome}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                Técnico: <b>{order.tecnico?.nome || 'A definir'}</b>
                              </p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                {order.cliente?.endereco}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL EXPANSÃO DE DETALHES (GOOGLE CALENDAR EVENT DETAILS)  */}
      {/* ============================================================== */}
      {selectedEvent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Cabeçalho */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {formatOrderCode(selectedEvent)}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                    STATUS_CONFIG[selectedEvent.status].bg
                  } ${STATUS_CONFIG[selectedEvent.status].text} ${
                    STATUS_CONFIG[selectedEvent.status].border
                  }`}
                >
                  {STATUS_CONFIG[selectedEvent.status].label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Data e Horário em Destaque */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                      Data & Horário Agendado
                    </span>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {formatDateTime(selectedEvent.data_instalacao)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenReschedule(selectedEvent);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Remarcar
                </button>
              </div>

              {/* Informações do Cliente & Local */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Cliente & Contato
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {selectedEvent.cliente?.nome}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {formatPhone(selectedEvent.cliente?.telefone)}
                    </span>
                    {selectedEvent.cliente?.telefone && (
                      <a
                        href={`https://wa.me/55${selectedEvent.cliente.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Endereço de Instalação
                      </span>
                      <p className="text-slate-800 font-semibold mt-0.5">
                        {selectedEvent.cliente?.endereco || 'Endereço não cadastrado'}
                      </p>
                    </div>
                    {selectedEvent.cliente?.endereco && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedEvent.cliente.endereco
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                        title="Abrir no Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Técnico Responsável */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Técnico Alocado
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                    {selectedEvent.tecnico?.nome || 'A definir / Não alocado'}
                  </p>
                  {selectedEvent.tecnico?.especialidade && (
                    <p className="text-[11px] text-slate-500">
                      Especialidade: {selectedEvent.tecnico.especialidade}
                    </p>
                  )}
                </div>

                {selectedEvent.tecnico?.telefone && (
                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
                    {formatPhone(selectedEvent.tecnico.telefone)}
                  </span>
                )}
              </div>

              {/* Itens do Pedido */}
              {selectedEvent.itens && selectedEvent.itens.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Produtos a Instalar ({selectedEvent.itens.length})
                  </span>
                  <div className="divide-y divide-slate-100 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3">
                    {selectedEvent.itens.map((item) => (
                      <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{item.produto?.nome}</p>
                          <span className="text-[10px] text-slate-500">
                            {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedEvent.observacoes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl text-xs text-amber-900">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-0.5">
                    Observações da Instalação
                  </span>
                  <p>{selectedEvent.observacoes}</p>
                </div>
              )}

              {/* Valor Total & Pagamento */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Forma de Pagamento
                  </span>
                  <span className="font-bold text-slate-800 uppercase text-xs">
                    {selectedEvent.forma_pagamento || 'A definir'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Valor Total
                  </span>
                  <span className="text-xl font-extrabold text-blue-700">
                    {formatCurrency(selectedEvent.valor_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
              {/* Botões de Avanço de Status */}
              <div>
                {selectedEvent.status === 'agendado' && (
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(selectedEvent.id, 'em_andamento', e)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Iniciar Instalação
                  </button>
                )}

                {selectedEvent.status === 'em_andamento' && (
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(selectedEvent.id, 'concluido', e)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir Instalação
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReschedule(selectedEvent)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Remarcar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL DE REMARCAÇÃO ("ALÉM DISSO, PODE REMARCAR")           */}
      {/* ============================================================== */}
      {reschedulingOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Remarcar Instalação
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {reschedulingOrder.cliente?.nome} • {formatOrderCode(reschedulingOrder)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReschedulingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <div className="p-6 space-y-4 text-xs">
              {/* Alerta de Conflito em tempo real */}
              {conflitoRemarcacao && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-extrabold block">Conflito de Horário Detectado!</span>
                    <p className="text-[11px] mt-0.5 leading-snug">{conflitoRemarcacao}</p>
                  </div>
                </div>
              )}

              {/* 1. Nova Data */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nova Data da Instalação *
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />

                {/* Atalhos Rápidos de Data */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-02')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Hoje (02/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-03')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Amanhã (03/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-05')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Segunda (05/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(rescheduleDate || '2026-10-02');
                      d.setDate(d.getDate() + 7);
                      setRescheduleDate(d.toISOString().slice(0, 10));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    +7 dias
                  </button>
                </div>
              </div>

              {/* 2. Novo Horário */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />

                {/* Atalhos de Horário */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleTime(slot)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        rescheduleTime === slot
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Técnico Responsável */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Técnico Alocado
                </label>
                <select
                  value={rescheduleTecnicoId}
                  onChange={(e) => setRescheduleTecnicoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione um técnico...</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Motivo / Observação da Remarcação */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Motivo ou Observação do Reagendamento
                </label>
                <textarea
                  rows={2}
                  value={rescheduleObs}
                  onChange={(e) => setRescheduleObs(e.target.value)}
                  placeholder="Ex: Cliente solicitou alteração para turno da tarde..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingOrder(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                disabled={savingReschedule}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingReschedule ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Remarcação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
