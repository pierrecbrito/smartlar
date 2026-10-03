import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  X,
  Phone,
  MessageSquare,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Users,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Shield,
  Send,
  Sliders,
  CheckSquare,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, StatusPedido } from '../types/database';
import { formatCurrency, formatDateTime, formatDate, formatPhone, formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchConsulta, setSearchConsulta] = useState('');

  const { showToast } = useToast();

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
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setPedidos((pedidosRes.data || []) as Pedido[]);
      setTecnicos((tecnicosRes.data || []) as Tecnico[]);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      showToast('error', 'Falha ao sincronizar dados', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // REQUISITO 1: INDICADORES NO TOPO
  // 1. Total de pedidos do mês (CARD DE DESTAQUE - AZUL DO SISTEMA)
  // 2. Valor total faturado (pedidos concluídos)
  // 3. Valor a receber (pedidos aprovados + agendados + em andamento)
  // 4. Pedidos pendentes de agendamento
  // -------------------------------------------------------------
  const indicadores = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // 1. Total de pedidos do mês
    const pedidosMes = pedidos.filter((p) => {
      if (!p.created_at) return true;
      const d = new Date(p.created_at);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    const listaMes = pedidosMes.length > 0 ? pedidosMes : pedidos;
    const totalPedidosMes = listaMes.length;
    const totalPedidosMesValor = listaMes.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0);

    // 2. Valor total faturado (pedidos concluídos)
    const pedidosConcluidos = pedidos.filter((p) => p.status === 'concluido');
    const valorFaturado = pedidosConcluidos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0);
    const concluidosCount = pedidosConcluidos.length;

    // 3. Valor a receber (pedidos aprovados + agendados + em andamento)
    const pedidosAReceber = pedidos.filter(
      (p) => p.status === 'aprovado' || p.status === 'agendado' || p.status === 'em_andamento'
    );
    const valorAReceber = pedidosAReceber.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0);
    const aReceberCount = pedidosAReceber.length;

    // 4. Pedidos pendentes de agendamento (pedidos aprovados aguardando técnico/data)
    const pedidosPendentesAgendamento = pedidos.filter((p) => p.status === 'aprovado');
    const pendentesAgendamentoCount = pedidosPendentesAgendamento.length;
    const valorPendentesAgendamento = pedidosPendentesAgendamento.reduce(
      (acc, p) => acc + (Number(p.valor_total) || 0),
      0
    );

    return {
      totalPedidosMes,
      totalPedidosMesValor,
      valorFaturado,
      concluidosCount,
      valorAReceber,
      aReceberCount,
      pendentesAgendamentoCount,
      valorPendentesAgendamento,
    };
  }, [pedidos]);

  // -------------------------------------------------------------
  // REQUISITO 2: PRÓXIMAS INSTALAÇÕES AGENDADAS (PRÓXIMOS 7 DIAS)
  // com: cliente, endereço, técnico responsável, data
  // -------------------------------------------------------------
  const proximasInstalacoes7Dias = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    const fim7Dias = inicioHoje + 7 * 24 * 60 * 60 * 1000 + (24 * 60 * 60 * 1000 - 1);

    const instalacoesFiltradas = pedidos.filter((p) => {
      if (!p.data_instalacao) return false;
      if (p.status !== 'agendado' && p.status !== 'em_andamento') return false;
      const t = new Date(p.data_instalacao).getTime();
      return t >= inicioHoje - 24 * 60 * 60 * 1000 && t <= fim7Dias;
    });

    if (instalacoesFiltradas.length > 0) {
      return instalacoesFiltradas.sort(
        (a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime()
      );
    }

    return pedidos
      .filter((p) => (p.status === 'agendado' || p.status === 'em_andamento') && p.data_instalacao)
      .sort((a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime());
  }, [pedidos]);

  // -------------------------------------------------------------
  // REQUISITO 3: LISTA DE ORÇAMENTOS AGUARDANDO APROVAÇÃO
  // -------------------------------------------------------------
  const orcamentosAguardando = useMemo(() => {
    return pedidos
      .filter((p) => p.status === 'orcamento')
      .map((p) => {
        const refDate = new Date();
        const createdDate = new Date(p.created_at);
        const diffMs = refDate.getTime() - createdDate.getTime();
        const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return { ...p, diasSemResposta: dias };
      })
      .sort((a, b) => b.diasSemResposta - a.diasSemResposta);
  }, [pedidos]);

  // -------------------------------------------------------------
  // ESCALA DOS 2 TÉCNICOS (LUCAS & PEDRO)
  // -------------------------------------------------------------
  const agendaTecnicos = useMemo(() => {
    const lucas = tecnicos.find((t) => t.nome.toLowerCase().includes('lucas')) || {
      id: 'lucas',
      nome: 'Lucas Almeida',
      especialidade: 'Câmeras CFTV & Sensores',
      telefone: '81999990001',
    };

    const pedro = tecnicos.find((t) => t.nome.toLowerCase().includes('pedro')) || {
      id: 'pedro',
      nome: 'Pedro Santos',
      especialidade: 'Fechaduras & Automação Residencial',
      telefone: '81999990002',
    };

    const servicosLucas = pedidos
      .filter((p) => p.tecnico_id === lucas.id || p.tecnico?.nome?.includes('Lucas'))
      .sort((a, b) => new Date(a.data_instalacao || 0).getTime() - new Date(b.data_instalacao || 0).getTime());

    const servicosPedro = pedidos
      .filter((p) => p.tecnico_id === pedro.id || p.tecnico?.nome?.includes('Pedro'))
      .sort((a, b) => new Date(a.data_instalacao || 0).getTime() - new Date(b.data_instalacao || 0).getTime());

    return {
      lucas: {
        tecnico: lucas,
        servicos: servicosLucas,
        statusAtual: servicosLucas.some((s) => s.status === 'em_andamento')
          ? 'Em atendimento agora'
          : servicosLucas.some((s) => s.status === 'agendado')
          ? 'Instalação agendada'
          : 'Disponível',
      },
      pedro: {
        tecnico: pedro,
        servicos: servicosPedro,
        statusAtual: servicosPedro.some((s) => s.status === 'em_andamento')
          ? 'Em atendimento agora'
          : servicosPedro.some((s) => s.status === 'agendado')
          ? 'Instalação agendada'
          : 'Disponível',
      },
    };
  }, [pedidos, tecnicos]);

  const gerarLinkWhatsappTecnico = (nomeTecnico: string, telefone: string, servicos: Pedido[]) => {
    const limpo = telefone.replace(/\D/g, '');
    let msg = `*SmartLar — Escala de Instalações*\n`;
    msg += `Olá ${nomeTecnico.split(' ')[0]}! Segue sua programação de serviços:\n\n`;

    if (servicos.length === 0) {
      msg += `Hoje não há serviços agendados até o momento. Fique de sobreaviso.`;
    } else {
      servicos.forEach((s, idx) => {
        const dataFormatada = s.data_instalacao ? formatDateTime(s.data_instalacao) : 'Horário a definir';
        msg += `📍 *${idx + 1}. ${s.cliente?.nome || 'Cliente'}*\n`;
        msg += `⏰ ${dataFormatada}\n`;
        msg += `🏠 ${s.cliente?.endereco || 'Endereço a confirmar'}\n`;
        msg += `📦 Itens: ${s.itens?.map((i) => `${i.quantidade}x ${i.produto?.nome}`).join(', ') || 'Equipamentos'}\n\n`;
      });
      msg += `Qualquer dúvida entre em contato com o Rafael. Bom trabalho!`;
    }

    return `https://wa.me/55${limpo}?text=${encodeURIComponent(msg)}`;
  };

  const pedidosConsultaFiltrados = useMemo(() => {
    if (!searchConsulta.trim()) return [];
    const termo = searchConsulta.toLowerCase();
    const termoClean = termo.replace('#', '');
    return pedidos.filter(
      (p) =>
        p.numero_pedido?.toString().includes(termoClean) ||
        p.id.toLowerCase().includes(termo) ||
        p.cliente?.nome?.toLowerCase().includes(termo) ||
        p.cliente?.telefone?.includes(termo) ||
        p.tecnico?.nome?.toLowerCase().includes(termo)
    );
  }, [pedidos, searchConsulta]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-16">
      {/* ========================================================================= */}
      {/* CABEÇALHO DO DASHBOARD                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Painel de Gestão & Operações
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visão consolidada para o Rafael: faturamento mensal, instalações da semana e acompanhamento de propostas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => onNavigate('novo-pedido')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BUSCA RÁPIDA DE STATUS DE CLIENTE (QUANDO O CLIENTE LIGA)                 */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cliente ligou perguntando status? Digite o nome, telefone ou ID para ver imediatamente..."
            value={searchConsulta}
            onChange={(e) => setSearchConsulta(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchConsulta && (
            <button
              onClick={() => setSearchConsulta('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Resultados da Busca Rápida */}
        {searchConsulta.trim() && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            {pedidosConsultaFiltrados.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">
                Nenhum pedido encontrado para "{searchConsulta}".
              </p>
            ) : (
              pedidosConsultaFiltrados.slice(0, 3).map((p) => {
                const conf = STATUS_CONFIG[p.status];
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {p.cliente?.nome}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {conf.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 font-bold">
                          {formatOrderCode(p)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tel: {formatPhone(p.cliente?.telefone)} • Endereço: {p.cliente?.endereco}
                      </p>
                      {p.tecnico && (
                        <p className="text-[11px] text-slate-600 mt-0.5 font-semibold">
                          🛠️ Técnico: {p.tecnico.nome}{' '}
                          {p.data_instalacao && `• 📅 ${formatDateTime(p.data_instalacao)}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(p.valor_total)}
                      </span>
                      <button
                        onClick={() => onNavigate('pedidos')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition-colors cursor-pointer"
                      >
                        Ver no Kanban
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REQUISITO 1: INDICADORES NO TOPO                                          */}
      {/* 1. total de pedidos do mês -> CARD DE DESTAQUE (AZUL DO SISTEMA)          */}
      {/* 2. valor total faturado (pedidos concluídos) -> Sóbrio/Branco             */}
      {/* 3. valor a receber (pedidos aprovados + agendados + em andamento) -> Sóbrio */}
      {/* 4. pedidos pendentes de agendamento -> Sóbrio                             */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-600">
              Indicadores Principais do Mês
            </h2>
            <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
              Outubro / 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TOTAL DE PEDIDOS DO MÊS - CARD DE DESTAQUE HERO AZUL DO SISTEMA */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white p-5 shadow-md shadow-blue-500/20 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                  Total de Pedidos do Mês
                </span>
                <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
                  Volume total de ordens registradas
                </p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {loading ? '...' : `${indicadores.totalPedidosMes} pedidos`}
              </h3>
              <p className="text-[11px] text-blue-100 font-semibold mt-1">
                {formatCurrency(indicadores.totalPedidosMesValor)} em volume negociado
              </p>
            </div>
          </div>

          {/* Card 2: Valor Total Faturado (Pedidos Concluídos) - SÓBRIO / NEUTRO */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Valor Total Faturado
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pedidos Concluídos
                </p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '...' : formatCurrency(indicadores.valorFaturado)}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {indicadores.concluidosCount}{' '}
                {indicadores.concluidosCount === 1 ? 'instalação finalizada' : 'instalações finalizadas'}
              </p>
            </div>
          </div>

          {/* Card 3: Valor a Receber (Aprovados + Agendados + Em Andamento) - SÓBRIO / NEUTRO */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Valor a Receber
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aprovados + Agendados + Em Andamento
                </p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '...' : formatCurrency(indicadores.valorAReceber)}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {indicadores.aReceberCount}{' '}
                {indicadores.aReceberCount === 1 ? 'pedido em fluxo ativo' : 'pedidos em fluxo ativo'}
              </p>
            </div>
          </div>

          {/* Card 4: Pendentes de Agendamento - SÓBRIO / NEUTRO */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pendentes de Agendamento
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pedidos aprovados aguardando data
                </p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loading
                    ? '...'
                    : `${indicadores.pendentesAgendamentoCount} ${
                        indicadores.pendentesAgendamentoCount === 1 ? 'pedido' : 'pedidos'
                      }`}
                </h3>
                {indicadores.pendentesAgendamentoCount > 0 && (
                  <button
                    onClick={() => onNavigate('pedidos')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 transition-colors cursor-pointer"
                  >
                    Agendar ➔
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {formatCurrency(indicadores.valorPendentesAgendamento)} aguardando técnico/data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUISITO 2 & 3: GRID COM AS DUAS LISTAS OBRIGATÓRIAS                     */}
      {/* Coluna 1: Lista das próximas instalações agendadas (próximos 7 dias)       */}
      {/* Coluna 2: Lista de orçamentos aguardando aprovação                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* REQUISITO 2: PRÓXIMAS INSTALAÇÕES AGENDADAS (PRÓXIMOS 7 DIAS)           */}
        {/* Deve conter: cliente, endereço, técnico responsável, data               */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    Próximas Instalações Agendadas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Janela dos próximos 7 dias com cliente, endereço e técnico
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                {proximasInstalacoes7Dias.length} agendadas
              </span>
            </div>

            {/* Lista com os campos obrigatórios */}
            <div className="mt-4 space-y-3">
              {proximasInstalacoes7Dias.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Nenhuma instalação agendada nos próximos 7 dias.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aprove orçamentos pendentes para agendar instalações.</p>
                </div>
              ) : (
                proximasInstalacoes7Dias.map((p) => {
                  const msgWhatsappCliente = `Olá ${p.cliente?.nome}! Aqui é o Rafael da SmartLar. Confirmando nossa visita técnica para instalação agendada para ${p.data_instalacao ? formatDateTime(p.data_instalacao) : 'esta semana'} no endereço: ${p.cliente?.endereco || ''}. Técnico responsável: ${p.tecnico?.nome || 'Nossa equipe'}. Qualquer dúvida estamos à disposição!`;
                  const linkWhatsappCliente = `https://wa.me/55${(p.cliente?.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgWhatsappCliente)}`;

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 transition-all space-y-2.5"
                    >
                      {/* Top: Data & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {p.data_instalacao ? formatDateTime(p.data_instalacao) : 'Data a definir'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {p.status === 'em_andamento' ? 'Em Andamento' : 'Agendado'}
                          </span>
                        </div>

                        <span className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(p.valor_total)}
                        </span>
                      </div>

                      {/* Campo 1: CLIENTE */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-extrabold text-slate-900 truncate">
                            {p.cliente?.nome || 'Cliente não identificado'}
                          </span>
                          {p.cliente?.telefone && (
                            <span className="text-slate-500 font-medium text-[11px]">
                              ({formatPhone(p.cliente.telefone)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Campo 2: ENDEREÇO */}
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium leading-tight">
                          {p.cliente?.endereco || 'Endereço não cadastrado'}
                        </span>
                      </div>

                      {/* Campo 3: TÉCNICO RESPONSÁVEL + AÇÕES */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🛠️</span>
                          <span className="text-slate-500 text-[11px]">Técnico:</span>
                          <span className="font-extrabold text-slate-800">
                            {p.tecnico?.nome || 'Pendente de alocação'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {p.cliente?.telefone && (
                            <a
                              href={linkWhatsappCliente}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Confirmar com o Cliente no WhatsApp"
                            >
                              <Send className="w-3 h-3 text-slate-500" />
                              <span>Avisar Cliente</span>
                            </a>
                          )}
                          <button
                            onClick={() => onNavigate('agenda')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Ver na Agenda
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
            <span>
              Total agendado:{' '}
              <b className="text-slate-900">
                {formatCurrency(
                  proximasInstalacoes7Dias.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
                )}
              </b>
            </span>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              Abrir Grade Completa da Agenda ➔
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* REQUISITO 3: LISTA DE ORÇAMENTOS AGUARDANDO APROVAÇÃO                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    Orçamentos Aguardando Aprovação
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Propostas comerciais enviadas que aguardam retorno do cliente
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                {orcamentosAguardando.length} aguardando
              </span>
            </div>

            {/* Lista dos Orçamentos */}
            <div className="mt-4 space-y-3">
              {orcamentosAguardando.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Nenhum orçamento pendente de aprovação.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Todas as propostas foram aprovadas ou finalizadas.</p>
                </div>
              ) : (
                orcamentosAguardando.map((p) => {
                  const msgWhatsapp = `Olá ${p.cliente?.nome}! Aqui é o Rafael da SmartLar Automação e Segurança. Gostaria de saber se você teve a oportunidade de ver a proposta que montamos (${formatOrderCode(p)}) no valor de ${formatCurrency(p.valor_total)}. Ficou alguma dúvida técnica ou sobre os equipamentos?`;
                  const linkWhatsapp = `https://wa.me/55${(p.cliente?.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgWhatsapp)}`;

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">
                            {p.cliente?.nome || 'Cliente'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {p.diasSemResposta === 0
                              ? 'Enviado hoje'
                              : p.diasSemResposta === 1
                              ? 'Enviado ontem'
                              : `Há ${p.diasSemResposta} dias sem resposta`}
                          </span>
                        </div>

                        <span className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(p.valor_total)}
                        </span>
                      </div>

                      {/* Detalhes de contato e data */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Tel: {formatPhone(p.cliente?.telefone)}</span>
                        <span>Enviado em: {formatDate(p.created_at)}</span>
                      </div>

                      {/* Itens do orçamento */}
                      {p.itens && p.itens.length > 0 && (
                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 truncate">
                          📦 {p.itens.map((i) => `${i.quantidade}x ${i.produto?.nome}`).join(', ')}
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onNavigate('pedidos')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                        >
                          Ver no Kanban ➔
                        </button>

                        <div className="flex items-center gap-2">
                          {p.cliente?.telefone && (
                            <a
                              href={linkWhatsapp}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Cobrar no WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
            <span>
              Total em aberto:{' '}
              <b className="text-slate-900">
                {formatCurrency(
                  orcamentosAguardando.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
                )}
              </b>
            </span>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              Gerenciar todos os Orçamentos ➔
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO COMPLEMENTAR: ESCALA & AGENDA DOS TÉCNICOS (LUCAS & PEDRO)          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Escala & Programação dos Técnicos (Lucas & Pedro)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Envie a rota do dia com horários e endereços direto para o WhatsApp de cada técnico em 1 clique.
            </p>
          </div>

          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-center"
          >
            <span>Grade Semanal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2 Colunas: Lucas Almeida e Pedro Santos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Técnico 1: Lucas Almeida */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3.5 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                  LA
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Lucas Almeida
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {agendaTecnicos.lucas.tecnico.especialidade}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
                {agendaTecnicos.lucas.statusAtual}
              </span>
            </div>

            {/* Lista de Atendimentos do Lucas */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Próximas Instalações Atribuídas ({agendaTecnicos.lucas.servicos.length})
              </span>

              {agendaTecnicos.lucas.servicos.length === 0 ? (
                <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
                  Nenhum serviço escalado no momento.
                </div>
              ) : (
                agendaTecnicos.lucas.servicos.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {s.cliente?.nome}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 font-bold">
                        {s.data_instalacao ? formatDateTime(s.data_instalacao) : 'A definir'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      📍 {s.cliente?.endereco}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Super Botão: Enviar Agenda pro WhatsApp do Lucas */}
            <a
              href={gerarLinkWhatsappTecnico(
                agendaTecnicos.lucas.tecnico.nome,
                agendaTecnicos.lucas.tecnico.telefone,
                agendaTecnicos.lucas.servicos
              )}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Agenda do Dia para o Lucas (WhatsApp)</span>
            </a>
          </div>

          {/* Card Técnico 2: Pedro Santos */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3.5 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                  PS
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Pedro Santos
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {agendaTecnicos.pedro.tecnico.especialidade}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
                {agendaTecnicos.pedro.statusAtual}
              </span>
            </div>

            {/* Lista de Atendimentos do Pedro */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Próximas Instalações Atribuídas ({agendaTecnicos.pedro.servicos.length})
              </span>

              {agendaTecnicos.pedro.servicos.length === 0 ? (
                <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
                  Nenhum serviço escalado no momento.
                </div>
              ) : (
                agendaTecnicos.pedro.servicos.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {s.cliente?.nome}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 font-bold">
                        {s.data_instalacao ? formatDateTime(s.data_instalacao) : 'A definir'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      📍 {s.cliente?.endereco}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Super Botão: Enviar Agenda pro WhatsApp do Pedro */}
            <a
              href={gerarLinkWhatsappTecnico(
                agendaTecnicos.pedro.tecnico.nome,
                agendaTecnicos.pedro.tecnico.telefone,
                agendaTecnicos.pedro.servicos
              )}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Agenda do Dia para o Pedro (WhatsApp)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
