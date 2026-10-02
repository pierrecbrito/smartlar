import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  User,
  Phone,
  Sparkles,
  MapPin,
  ChevronRight,
  ExternalLink
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
  const [proximasInstalacoes, setProximasInstalacoes] = useState<InstalacaoView[]>([]);
  const [orcamentosPendentes, setOrcamentosPendentes] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: resumoData, error: resumoError } = await supabase
        .from('v_dashboard_resumo')
        .select('*')
        .single();

      if (resumoError) console.warn('v_dashboard_resumo error:', resumoError);
      else setResumo(resumoData);

      const { data: instData, error: instError } = await supabase
        .from('v_instalacoes')
        .select('*')
        .order('data_instalacao', { ascending: true })
        .limit(5);

      if (instError) console.warn('v_instalacoes error:', instError);
      else setProximasInstalacoes(instData || []);

      const { data: orcData, error: orcError } = await supabase
        .from('pedidos')
        .select('*, cliente:clientes(*)')
        .eq('status', 'orcamento')
        .order('created_at', { ascending: false })
        .limit(5);

      if (orcError) console.warn('pedidos error:', orcError);
      else setOrcamentosPendentes(orcData || []);
    } catch (err: any) {
      console.error('Falha geral no Dashboard:', err);
      showToast('error', 'Falha ao sincronizar dashboard', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Boas-Vindas Estilo SaaS Moderno */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 translate-y-12 w-64 h-64 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SmartLar Operações • Tempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Olá, Rafael! Bem-vindo ao painel.
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Aqui está o panorama completo dos orçamentos, faturamento do mês e rotas técnicas da semana.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 backdrop-blur-md transition-all shadow-xs"
              title="Atualizar dados do Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-300' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('novo-pedido')}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards com Visual Moderno (Inspirado no Design Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Pedidos no Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pedidos no Mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : resumo?.pedidos_mes ?? 0}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Base oficial Brasília (GMT-3)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Faturado no Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Faturado no Mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {loading ? '-' : formatCurrency(resumo?.faturado_mes)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-2">
              Instalações concluídas com sucesso
            </p>
          </div>
        </div>

        {/* Card 3: A Receber */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              A Receber (Pipeline)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {loading ? '-' : formatCurrency(resumo?.a_receber)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-2">
              Aprovados, agendados e em andamento
            </p>
          </div>
        </div>

        {/* Card 4: Pendentes de Agendamento */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Pendentes Agendamento
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-purple-700 tracking-tight">
              {loading ? '-' : resumo?.pendentes_agendamento ?? 0}
            </h3>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-2 flex items-center gap-1 group"
            >
              Alocar técnico e data
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Próximas Instalações & Orçamentos em Aberto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Próximas Instalações (v_instalacoes) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                Próximas Instalações (7 dias)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              Ver agenda
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="p-6 flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : proximasInstalacoes.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhuma instalação agendada nos próximos 7 dias.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasInstalacoes.map((inst) => (
                  <div
                    key={inst.pedido_id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {inst.cliente_nome}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[inst.status].bg} ${STATUS_CONFIG[inst.status].text} ${STATUS_CONFIG[inst.status].border}`}>
                          {STATUS_CONFIG[inst.status].label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(inst.data_instalacao)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">
                          🛠️ {inst.tecnico_nome || 'A definir'}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {inst.endereco}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-emerald-700 block">
                        {formatCurrency(inst.valor_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Orçamentos em Aberto */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">
                Orçamentos Aguardando Aprovação
              </h2>
            </div>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              Ver todos
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="p-6 flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orcamentosPendentes.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhum orçamento pendente de aprovação.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orcamentosPendentes.map((orc) => (
                  <div
                    key={orc.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {orc.cliente?.nome || 'Cliente'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Orçamento
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        {formatPhone(orc.cliente?.telefone)}
                        <span className="text-slate-300">•</span>
                        Criado em {formatDateTime(orc.created_at)}
                      </p>
                      {orc.observacoes && (
                        <p className="text-[11px] text-slate-600 italic line-clamp-1 bg-white p-1 rounded border border-slate-100">
                          "{orc.observacoes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-blue-700 block">
                        {formatCurrency(orc.valor_total)}
                      </span>
                      <button
                        onClick={() => onNavigate('pedidos')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-1 inline-flex items-center gap-0.5"
                      >
                        Gerenciar ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
