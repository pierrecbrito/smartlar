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
export const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// Nomes dos dias da semana em português
export const DIAS_SEMANA = [
  { abrev: 'SEG', nome: 'Segunda-feira' },
  { abrev: 'TER', nome: 'Terça-feira' },
  { abrev: 'QUA', nome: 'Quarta-feira' },
  { abrev: 'QUI', nome: 'Quinta-feira' },
  { abrev: 'SEX', nome: 'Sexta-feira' },
  { abrev: 'SÁB', nome: 'Sábado' },
  { abrev: 'DOM', nome: 'Domingo' },
];

/** Estado e regras da Agenda (dados, filtros, navegaÃ§Ã£o de calendÃ¡rio e aÃ§Ãµes). */
export const useAgenda = () => {
  // Dados principais
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosSemData, setPedidosSemData] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);

  // Data de referência do calendário (Inicia em 02 de Outubro de 2026 - Data atual do sistema)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-10-02T12:00:00'));

  // Modos de visualização (No mobile foca em dia por padrão)
  const [viewMode, setViewMode] = useState<'semana' | 'mes' | 'dia'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'dia' : 'semana'
  );

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

    const targetDate = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    if (isNaN(targetDate.getTime()) || targetDate.getTime() < Date.now() - 60000) {
      showToast('error', 'Data retroativa', 'A data e horário de instalação não podem ser no passado.');
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

  const rescheduleConflict = useMemo(() => {
    if (!reschedulingOrder || !rescheduleTecnicoId || !rescheduleDate || !rescheduleTime) return null;
    const targetTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).getTime();
    if (isNaN(targetTime)) return null;

    return pedidos.find((p) => {
      if (p.id === reschedulingOrder.id) return false;
      if (p.tecnico_id !== rescheduleTecnicoId) return false;
      if (p.status !== 'agendado' && p.status !== 'em_andamento') return false;
      if (!p.data_instalacao) return false;

      const orderTime = new Date(p.data_instalacao).getTime();
      const diffHours = Math.abs(orderTime - targetTime) / (1000 * 60 * 60);
      return diffHours < 2;
    });
  }, [reschedulingOrder, rescheduleTecnicoId, rescheduleDate, rescheduleTime, pedidos]);

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

  // Helper de estilização dos cards no estilo Google Calendar (Padronizado no Azul do Sistema)
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
          card: 'bg-blue-50/95 border-l-4 border-l-blue-600 border-blue-200/90 text-blue-950 hover:bg-blue-100/90 shadow-2xs',
          timeBadge: 'bg-blue-600 text-white',
          dot: 'bg-blue-600',
        };
      case 'concluido':
        return {
          card: 'bg-blue-50/95 border-l-4 border-l-blue-600 border-blue-200/90 text-blue-950 hover:bg-blue-100/90 shadow-2xs',
          timeBadge: 'bg-blue-600 text-white',
          dot: 'bg-blue-600',
        };
      default:
        return {
          card: 'bg-slate-50/95 border-l-4 border-l-slate-400 border-slate-200/90 text-slate-800 hover:bg-slate-100/90 shadow-2xs',
          timeBadge: 'bg-slate-600 text-white',
          dot: 'bg-slate-400',
        };
    }
  };

  return {
    pedidos,
    setPedidos,
    pedidosSemData,
    setPedidosSemData,
    tecnicos,
    setTecnicos,
    loading,
    setLoading,
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    selectedTecnicoFilter,
    setSelectedTecnicoFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedEvent,
    setSelectedEvent,
    reschedulingOrder,
    setReschedulingOrder,
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    rescheduleTecnicoId,
    setRescheduleTecnicoId,
    rescheduleObs,
    setRescheduleObs,
    savingReschedule,
    setSavingReschedule,
    showToast,
    loadData,
    conflitosPorTecnico,
    conflitoRemarcacao,
    weekStart,
    weekDays,
    monthDays,
    handlePrev,
    handleNext,
    handleToday,
    isToday,
    isSameDay,
    headerDateTitle,
    filteredPedidos,
    handleOpenReschedule,
    handleSaveReschedule,
    rescheduleConflict,
    handleUpdateStatus,
    getEventBadgeStyle,
  };
};

export type AgendaState = ReturnType<typeof useAgenda>;