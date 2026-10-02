import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Check,
  UserPlus,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DashboardResumo, InstalacaoView, Pedido } from '../types/database';
import { formatCurrency, formatDateTime, formatPhone, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [instalacoes, setInstalacoes] = useState<InstalacaoView[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [resumoRes, instRes, pedidosRes] = await Promise.all([
        supabase.from('v_dashboard_resumo').select('*').single(),
        supabase.from('v_instalacoes').select('*').order('data_instalacao', { ascending: true }),
        supabase.from('pedidos').select('*, cliente:clientes(*), tecnico:tecnicos(*)').order('created_at', { ascending: false }).limit(5),
      ]);

      if (resumoRes.error) console.warn(resumoRes.error);
      else setResumo(resumoRes.data);

      if (instRes.error) console.warn(instRes.error);
      else setInstalacoes(instRes.data || []);

      if (pedidosRes.error) console.warn(pedidosRes.error);
      else setPedidosRecentes(pedidosRes.data || []);
    } catch (err: any) {
      console.error('Erro no dashboard:', err);
      showToast('error', 'Falha ao sincronizar dados', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Primeira instalação para o card de Reminders
  const proximaInstalacao = instalacoes[0] || null;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Top Heading: "Dashboard" + Subtítulo amigável (Akino Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Planeje, priorize e acompanhe as ordens de serviço da SmartLar com facilidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('novo-pedido')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Principais da Grid Superior (Akino Style: 1 Hero Blue Card + 3 White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: HERO BLUE CARD (Total Projects) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white p-6 shadow-md shadow-blue-500/20 flex flex-col justify-between min-h-[140px] group hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-blue-100">Total de Projetos</span>
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {loading ? '-' : resumo?.pedidos_mes ?? 24}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                <TrendingUp className="w-3 h-3" />
                +12% no mês
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Ended Projects / Instalações Concluídas */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-blue-200 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Projetos Concluídos</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : 10}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {formatCurrency(resumo?.faturado_mes)} faturados
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Running Projects / Em Execução */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-blue-200 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Em Execução (Hoje)</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : instalacoes.length}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                Técnicos em campo
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Projects / Aguardando Agendamento */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[140px] hover:border-blue-200 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Pendentes de Agenda</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : resumo?.pendentes_agendamento ?? 2}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Aguardando técnico
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linha Central: Project Analytics + Reminders + Progress + Time Tracker (Akino Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Widget 1: Project Analytics (Barras em Cápsula Vertical) - 4 Colunas */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Análise Semanal</h3>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Atividade
            </span>
          </div>

          {/* 7 Vertical Capsule Pill Bars (Akino Style) */}
          <div className="my-4 flex items-end justify-between gap-2.5 h-36 px-2">
            {[
              { day: 'D', height: 'h-16', active: false },
              { day: 'S', height: 'h-24', active: true, badge: '78%' },
              { day: 'T', height: 'h-28', active: true, badge: '95%' },
              { day: 'Q', height: 'h-32', active: true, badge: '100%' },
              { day: 'Q', height: 'h-20', active: false },
              { day: 'S', height: 'h-16', active: false },
              { day: 'S', height: 'h-12', active: false },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
                {col.badge && (
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {col.badge}
                  </span>
                )}
                <div
                  className={`w-full rounded-full transition-all duration-300 ${col.height} ${
                    col.active
                      ? 'bg-blue-600 group-hover:bg-blue-700 shadow-xs'
                      : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}
                />
                <span className="text-[11px] font-bold text-slate-400">{col.day}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pico: Quarta-feira</span>
            <span className="font-bold text-slate-800">14 visitas executadas</span>
          </div>
        </div>

        {/* Widget 2: Reminders & Próxima Instalação - 4 Colunas */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                LEMBRETE TÉCNICO
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <h4 className="font-extrabold text-base text-slate-900 mt-1 leading-snug">
              {proximaInstalacao ? proximaInstalacao.cliente_nome : 'Fernanda Lima'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {proximaInstalacao?.endereco || 'Rua das Flores, 120 • Instalação de Hub e Câmeras'}
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  {proximaInstalacao ? formatDateTime(proximaInstalacao.data_instalacao) : 'Hoje às 08:00'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Técnico: {proximaInstalacao?.tecnico_nome || 'Lucas Almeida'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={() => onNavigate('agenda')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-xs text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Iniciar Atendimento</span>
            </button>
          </div>
        </div>

        {/* Widget 3: Progresso Geral (Altura total das 4 colunas) */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Progresso Geral</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                74% Concluído
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Taxa de conclusão e eficiência das ordens no mês
            </p>
          </div>

          {/* Donut Semi-circular Gauge ampliado */}
          <div className="flex flex-col items-center justify-center py-5 my-auto">
            <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
              <div className="w-44 h-44 rounded-full border-[14px] border-slate-100 border-t-blue-600 border-r-blue-600 border-l-blue-600 rotate-[-45deg] transition-all duration-700" />
              <div className="absolute bottom-1 text-center">
                <span className="text-3xl font-extrabold text-slate-900 block leading-tight">74%</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Eficiência</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-3 text-center">
              <span className="font-bold text-emerald-600">+8%</span> acima da meta planejada para o período
            </p>
          </div>

          {/* Categorias e métricas de status */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="font-medium text-slate-600">Concluídos</span>
              </div>
              <span className="font-extrabold text-slate-900">14 ordens (58%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-600">Em Andamento</span>
              </div>
              <span className="font-extrabold text-slate-900">6 ordens (25%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="font-medium text-slate-600">Pendentes</span>
              </div>
              <span className="font-extrabold text-slate-900">4 ordens (17%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Team Collaboration + Projects / Ordens de Serviço (Akino Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Painel Esquerdo (6 cols): Team Collaboration (Colaboração da Equipe) */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Colaboração da Equipe</h3>
              <p className="text-[11px] text-slate-500">Técnicos e responsáveis em campo</p>
            </div>

            <button
              onClick={() => onNavigate('agenda')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ver Equipe</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                nome: 'Lucas Almeida',
                cargo: 'Técnico Especialista em CFTV',
                tarefa: 'Instalação de Câmeras Wi-Fi Externa',
                status: 'Em Campo',
                statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                initials: 'LA',
              },
              {
                nome: 'Pedro Santos',
                cargo: 'Instalador de Fechaduras e Zigbee',
                tarefa: 'Configuração da Central de Automação',
                status: 'Disponível',
                statusBg: 'bg-blue-50 text-blue-700 border-blue-200',
                initials: 'PS',
              },
              {
                nome: 'Marina Costa (Cliente VIP)',
                cargo: 'Cliente com Pedido Concluído',
                tarefa: 'Ordem de 2 Câmeras + 1 Sensor Aprovada',
                status: 'Concluído',
                statusBg: 'bg-slate-100 text-slate-700 border-slate-200',
                initials: 'MC',
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{member.nome}</p>
                    <p className="text-[11px] text-slate-500 truncate">{member.tarefa}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${member.statusBg} shrink-0`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito (6 cols): Projects / Ordens Recentes (Akino Style) */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Projetos & Pedidos Recentes</h3>
              <p className="text-[11px] text-slate-500">Últimas ordens registradas no PostgreSQL</p>
            </div>

            <button
              onClick={() => onNavigate('pedidos')}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <span>Ver Todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pedidosRecentes.slice(0, 4).map((p) => {
              const st = STATUS_CONFIG[p.status];
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate('pedidos')}
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/60 hover:border-blue-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-mono text-xs font-bold shrink-0">
                      #{p.id.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {p.cliente?.nome || 'Cliente'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {p.tecnico?.nome ? `Técnico: ${p.tecnico.nome}` : 'A definir'} • {formatDateTime(p.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {formatCurrency(p.valor_total)}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${st.bg} ${st.text} ${st.border}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
