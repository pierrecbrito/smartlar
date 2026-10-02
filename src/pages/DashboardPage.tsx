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
  Phone,
  ShieldCheck,
  Check
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
        supabase.from('pedidos').select('*, cliente:clientes(*), tecnico:tecnicos(*)').order('created_at', { ascending: false }).limit(6),
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
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Header: VISÃO GERAL / Bem-vindo de volta, Rafael */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            VISÃO GERAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Dashboard Operacional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas em tempo real integradas com PostgreSQL 16 e automações n8n
          </p>
        </div>

        <button
          onClick={() => onNavigate('novo-pedido')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>

      {/* 4 Cards de Métricas com Sparklines Sutis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projetos / Pedidos Ativos */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/80 px-2 py-0.5 rounded-full">
              No Mês
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-500 block">Projetos Ativos</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '-' : resumo?.pedidos_mes ?? 0}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Volume consolidado no Supabase
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-32 h-14 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 35,50 60,30 T 110,15 T 140,25 L 140,60 L 0,60 Z"
                fill="url(#wave1)"
              />
              <path
                d="M 0,45 Q 35,50 60,30 T 110,15 T 140,25"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <circle cx="110" cy="15" r="3" fill="#2563eb" />
            </svg>
          </div>
        </div>

        {/* Card 2: Instalações Hoje & Amanhã */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/80 px-2 py-0.5 rounded-full">
              Agenda
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-500 block">Instalações Hoje / Amanhã</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '-' : instalacoes.length}
              </h3>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Sincronizado com n8n Cron
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-32 h-14 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,50 Q 40,25 70,35 T 120,18 T 140,30 L 140,60 L 0,60 Z"
                fill="url(#wave2)"
              />
              <path
                d="M 0,50 Q 40,25 70,35 T 120,18 T 140,30"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
              />
              <circle cx="120" cy="18" r="3" fill="#d97706" />
            </svg>
          </div>
        </div>

        {/* Card 3: Técnicos em Campo */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/80 px-2 py-0.5 rounded-full">
              Equipe
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-500 block">Técnicos em Campo</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                2
              </h3>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-block">
              Lucas Almeida & Pedro Santos
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-32 h-14 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,40 Q 30,55 65,25 T 115,20 T 140,10 L 140,60 L 0,60 Z"
                fill="url(#wave3)"
              />
              <path
                d="M 0,40 Q 30,55 65,25 T 115,20 T 140,10"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
              />
              <circle cx="115" cy="20" r="3" fill="#4f46e5" />
            </svg>
          </div>
        </div>

        {/* Card 4: Faturado no Mês */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all group">
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/80 px-2 py-0.5 rounded-full">
              Finanças
            </span>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-xs font-semibold text-slate-500 block">Faturado no Mês</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '-' : formatCurrency(resumo?.faturado_mes)}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
              {formatCurrency(resumo?.a_receber)} a receber
            </span>
          </div>

          {/* Sparkline Wave */}
          <div className="absolute right-0 bottom-0 w-32 h-14 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 140 60" className="w-full h-full">
              <defs>
                <linearGradient id="wave4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 40,40 75,20 T 115,12 T 140,15 L 140,60 L 0,60 Z"
                fill="url(#wave4)"
              />
              <path
                d="M 0,45 Q 40,40 75,20 T 115,12 T 140,15"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
              />
              <circle cx="115" cy="12" r="3" fill="#059669" />
            </svg>
          </div>
        </div>
      </div>

      {/* Seção Principal: Instalações do Dia & Próximas + Resumo com Automações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo (7 cols): "Instalações do Dia & Próximas" */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Instalações do Dia & Próximas Atividades</h3>
                <p className="text-[11px] text-slate-500">Agendamentos e ordens técnicas ativas com os clientes</p>
              </div>
              <button
                onClick={() => onNavigate('agenda')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Ver agenda completa
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {instalacoes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma instalação agendada no momento.
                </div>
              ) : (
                instalacoes.map((inst, index) => {
                  const isEmAndamento = inst.status === 'em_andamento';
                  const isAmanha = index === 1;

                  return (
                    <div
                      key={inst.pedido_id}
                      onClick={() => onNavigate('agenda')}
                      className="p-4 rounded-2xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs shrink-0">
                          {isEmAndamento ? (
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                          ) : (
                            <Clock className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {inst.cliente_nome}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span>📅 {formatDateTime(inst.data_instalacao)}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">🛠️ {inst.tecnico_nome}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            {inst.endereco}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(inst.valor_total)}
                        </span>

                        {isEmAndamento ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Em Andamento
                          </span>
                        ) : isAmanha ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Amanhã
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Agendado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total: {instalacoes.length} visitas ativas na fila</span>
            <button
              onClick={() => onNavigate('agenda')}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Abrir Mapa & Agenda
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Painel Direito (5 cols): Resumo Operacional & Automações n8n */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 border border-blue-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                Resumo Operacional & Automações
              </h4>
            </div>

            <p className="text-[12px] text-slate-600 leading-relaxed">
              Status dos fluxos automatizados e alertas gerados em tempo real pelo n8n e PostgreSQL:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-blue-100 text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-[11px]">📢 Automação do Dia Seguinte (n8n)</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Ativa</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Cron diário às 07:00 programado para consultar a view <code className="font-mono text-blue-700">v_instalacoes</code> e enviar o briefing de rotas e equipamentos para os técnicos.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-[11px]">⚡ Webhook de Novo Pedido (Supabase)</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Database Webhook</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Disparado automaticamente a cada novo pedido registrado pela RPC atômica, efetuando re-busca do valor e dos dados do cliente.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-[11px]">⏳ Pendentes de Agendamento</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {resumo?.pendentes_agendamento ?? 0} pedidos
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Pedidos aprovados aguardando definição de técnico e data no fluxo da máquina de estados.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/60">
            <button
              onClick={() => onNavigate('pedidos')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all text-center shadow-xs cursor-pointer"
            >
              Revisar Ordens de Serviço
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Projetos & Pedidos Recentes */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Projetos & Pedidos Recentes</h3>
            <p className="text-[11px] text-slate-500">Últimos pedidos registrados no PostgreSQL com cálculo oficial do banco</p>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Ver todos ({pedidosRecentes.length})
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 font-semibold">Código</th>
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 font-semibold">Técnico</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidosRecentes.map((p) => {
                const st = STATUS_CONFIG[p.status];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-600">
                      #{p.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {p.cliente?.nome || 'Cliente'}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {p.tecnico?.nome ? `🛠️ ${p.tecnico.nome}` : <span className="text-slate-400">A definir</span>}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-extrabold text-slate-900">
                      {formatCurrency(p.valor_total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
