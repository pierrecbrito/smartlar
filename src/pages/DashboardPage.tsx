import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Clock,
  Users,
  CheckCircle2,
  MoreVertical,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Check,
  AlertCircle,
  Plus
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
        supabase.from('pedidos').select('*, cliente:clientes(*), tecnico:tecnicos(*)').order('created_at', { ascending: false }).limit(4),
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

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Top Header: DASHBOARD / Welcome back, Rafael */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Welcome back, Rafael
          </h1>
        </div>

        <button
          onClick={() => onNavigate('novo-pedido')}
          className="flex items-center gap-2 px-4 py-2 bg-[#e0e7ff] hover:bg-white text-[#1e1b4b] rounded-xl text-xs font-extrabold shadow-md shadow-indigo-500/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>

      {/* 4 Top Metric Cards (Aivora Style com Sparkline Neon Waves) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projetos / Pedidos Ativos */}
        <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-indigo-400 shadow-inner">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              No Mês
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-400 block">Projetos Ativos</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {loading ? '-' : resumo?.pedidos_mes ?? 0}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
              +3 este mês
            </span>
          </div>

          {/* Sparkline Wave SVG (Aivora Style) */}
          <div className="absolute right-0 bottom-0 w-36 h-16 pointer-events-none opacity-80">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 35,50 60,30 T 110,15 T 140,25 L 140,60 L 0,60 Z"
                fill="url(#wave1)"
              />
              <path
                d="M 0,45 Q 35,50 60,30 T 110,15 T 140,25"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
              />
              <circle cx="110" cy="15" r="3" fill="#818cf8" />
            </svg>
          </div>
        </div>

        {/* Card 2: Due Today / Instalações Hoje & Amanhã */}
        <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-purple-400 shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Agenda
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-400 block">Instalações Hoje / Amanhã</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {loading ? '-' : instalacoes.length}
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-semibold mt-1 inline-block">
              1 em andamento agora
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-36 h-16 pointer-events-none opacity-80">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,50 Q 40,25 70,35 T 120,18 T 140,30 L 140,60 L 0,60 Z"
                fill="url(#wave2)"
              />
              <path
                d="M 0,50 Q 40,25 70,35 T 120,18 T 140,30"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
              />
              <circle cx="120" cy="18" r="3" fill="#c084fc" />
            </svg>
          </div>
        </div>

        {/* Card 3: Equipe em Campo (Team Online) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-blue-400 shadow-inner">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Equipe
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-400 block">Técnicos em Campo</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                2
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
              100% disponíveis (Lucas & Pedro)
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-36 h-16 pointer-events-none opacity-80">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,40 Q 30,55 65,25 T 115,20 T 140,10 L 140,60 L 0,60 Z"
                fill="url(#wave3)"
              />
              <path
                d="M 0,40 Q 30,55 65,25 T 115,20 T 140,10"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
              />
              <circle cx="115" cy="20" r="3" fill="#60a5fa" />
            </svg>
          </div>
        </div>

        {/* Card 4: Faturado no Mês (Completion / Revenue) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Finanças
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-400 block">Faturado no Mês</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {loading ? '-' : formatCurrency(resumo?.faturado_mes)}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
              {formatCurrency(resumo?.a_receber)} a receber
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-36 h-16 pointer-events-none opacity-80">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 40,40 75,20 T 115,12 T 140,15 L 140,60 L 0,60 Z"
                fill="url(#wave4)"
              />
              <path
                d="M 0,45 Q 40,40 75,20 T 115,12 T 140,15"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
              />
              <circle cx="115" cy="12" r="3" fill="#34d399" />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Row (Aivora: Today's Tasks + Project Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo (5 cols): "Projetos do Dia / Today's Tasks" */}
        <div className="lg:col-span-5 rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-sm text-white">Instalações do Dia & Próximas</h3>
                <p className="text-[11px] text-slate-400">Atividades técnicas em campo</p>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {instalacoes.map((inst, index) => {
                const isEmAndamento = inst.status === 'em_andamento';
                const isAmanha = index === 1;

                return (
                  <div
                    key={inst.pedido_id}
                    onClick={() => onNavigate('agenda')}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                        {isEmAndamento ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {inst.cliente_nome}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {formatDateTime(inst.data_instalacao)} • {inst.tecnico_nome}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isEmAndamento ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Em Andamento
                        </span>
                      ) : isAmanha ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Amanhã
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Agendado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Orçamento Pendente como Tarefa de Fechamento */}
              <div
                onClick={() => onNavigate('pedidos')}
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      Carlos Eduardo • Alocar Técnico
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Pedido aprovado aguardando agendamento
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Alta Prioridade
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total: {instalacoes.length + 1} visitas ativas</span>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Abrir agenda completa
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Painel Direito (7 cols): "Cronograma de Projetos / Project Timeline" (Aivora Style) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-sm text-white">Cronograma Técnico (Timeline da Semana)</h3>
                <p className="text-[11px] text-slate-400">Visualização de fluxo dos técnicos em campo</p>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Timeline Bars (Aivora Style) */}
            <div className="mt-6 space-y-6">
              {/* Barra 1: Instalação Fernanda Lima (Hoje) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">Hub de Automação & Voice Speaker</span>
                    <span className="text-slate-400">• Fernanda Lima</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">Hoje às 08:00</span>
                </div>

                <div className="relative h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center px-3">
                  <div className="absolute left-0 top-0 bottom-0 w-[45%] bg-gradient-to-r from-indigo-600/30 to-purple-600/40 border-r-2 border-indigo-400 rounded-l-xl flex items-center justify-between px-3">
                    <span className="text-[11px] font-bold text-indigo-200 truncate">
                      🛠️ Técnico: Lucas Almeida
                    </span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                      Em execução
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra 2: Instalação Roberto Nunes (Amanhã) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-white">3x Câmeras Full HD + Sensores Janela</span>
                    <span className="text-slate-400">• Roberto Nunes</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-400">Amanhã às 09:00</span>
                </div>

                <div className="relative h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center px-3">
                  <div className="absolute left-[30%] top-0 bottom-0 w-[55%] bg-gradient-to-r from-amber-600/25 to-orange-600/30 border-r-2 border-amber-400 rounded-xl flex items-center justify-between px-3">
                    <span className="text-[11px] font-bold text-amber-200 truncate">
                      🛠️ Lucas Almeida (Levar escada)
                    </span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Agendado
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra 3: Instalação Ana Paula (Em 3 dias) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-bold text-white">Fechadura Biométrica & Interruptores</span>
                    <span className="text-slate-400">• Ana Paula Souza</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400">Segunda às 14:00</span>
                </div>

                <div className="relative h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center px-3">
                  <div className="absolute left-[65%] top-0 bottom-0 w-[35%] bg-gradient-to-r from-blue-600/25 to-indigo-600/30 border-r-2 border-blue-400 rounded-r-xl flex items-center justify-between px-3">
                    <span className="text-[11px] font-bold text-blue-200 truncate">
                      🛠️ Pedro Santos
                    </span>
                    <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                      Agendado
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Axis Labels (Aivora Style: 1 Out, 2 Out, 3 Out...) */}
              <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400 font-mono">
                <span>02 Out (Hoje)</span>
                <span>03 Out (Amanhã)</span>
                <span>04 Out</span>
                <span>05 Out</span>
                <span>06 Out</span>
                <span>07 Out</span>
                <span>08 Out</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Rotas alinhadas com n8n webhook</span>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver mapa de rotas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Projects Table + AI Summary Card (Aivora Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Projetos / Pedidos Recentes (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="font-bold text-sm text-white">Projetos & Pedidos Recentes</h3>
              <p className="text-[11px] text-slate-400">Últimos pedidos registrados no PostgreSQL</p>
            </div>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver todos ({pedidosRecentes.length})
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-semibold">
                  <th className="pb-2.5">Código</th>
                  <th className="pb-2.5">Cliente</th>
                  <th className="pb-2.5">Técnico</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pedidosRecentes.map((p) => {
                  const st = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-300">
                        #{p.id.slice(0, 8)}
                      </td>
                      <td className="py-3 font-bold text-white">
                        {p.cliente?.nome || 'Cliente'}
                      </td>
                      <td className="py-3 text-slate-300">
                        {p.tecnico?.nome ? `🛠️ ${p.tecnico.nome}` : <span className="text-slate-400">A definir</span>}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-400">
                        {formatCurrency(p.valor_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Summary Card (4 cols - Aivora Style) */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#181d2c]/90 to-[#121622]/90 backdrop-blur-xl border border-purple-500/20 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                AI Summary & Insights
              </h4>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Insights em tempo real gerados a partir do banco de dados e automações:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 space-y-1">
                <span className="font-bold block text-white text-[11px]">📢 Automação do Dia Seguinte (n8n)</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  1 instalação agendada para amanhã com Roberto Nunes. O n8n já preparou o briefing com lembrete de escada alta.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 space-y-1">
                <span className="font-bold block text-white text-[11px]">💰 Faturamento do Mês</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  R$ 2.630,00 faturados no fuso de Brasília. R$ 4.590,00 adicionais no pipeline para serem concluídos.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <button
              onClick={() => onNavigate('pedidos')}
              className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all text-center"
            >
              Revisar Ordens de Serviço
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
