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
  Building,
  User,
  Phone
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
      // 1. Indicadores da view v_dashboard_resumo
      const { data: resumoData, error: resumoError } = await supabase
        .from('v_dashboard_resumo')
        .select('*')
        .single();

      if (resumoError) {
        console.warn('Erro ao carregar v_dashboard_resumo:', resumoError);
      } else {
        setResumo(resumoData);
      }

      // 2. Próximas instalações de v_instalacoes
      const { data: instData, error: instError } = await supabase
        .from('v_instalacoes')
        .select('*')
        .order('data_instalacao', { ascending: true })
        .limit(5);

      if (instError) {
        console.warn('Erro ao carregar v_instalacoes:', instError);
      } else {
        setProximasInstalacoes(instData || []);
      }

      // 3. Orçamentos pendentes de aprovação
      const { data: orcData, error: orcError } = await supabase
        .from('pedidos')
        .select('*, cliente:clientes(*)')
        .eq('status', 'orcamento')
        .order('created_at', { ascending: false })
        .limit(5);

      if (orcError) {
        console.warn('Erro ao carregar orçamentos:', orcError);
      } else {
        setOrcamentosPendentes(orcData || []);
      }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Painel Geral
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas em tempo real, faturamento do mês e agenda operacional
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => onNavigate('novo-pedido')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Criar Orçamento
          </button>
        </div>
      </div>

      {/* KPI Cards (v_dashboard_resumo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Pedidos no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pedidos no Mês
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '-' : resumo?.pedidos_mes ?? 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Fuso Oficial Brasília (GMT-3)
            </p>
          </div>
        </div>

        {/* Card 2: Faturado no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturado no Mês
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {loading ? '-' : formatCurrency(resumo?.faturado_mes)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Instalações concluídas neste mês
            </p>
          </div>
        </div>

        {/* Card 3: A Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              A Receber
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {loading ? '-' : formatCurrency(resumo?.a_receber)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aprovados, agendados e em andamento
            </p>
          </div>
        </div>

        {/* Card 4: Pendentes de Agendamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendentes Agendamento
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-purple-700 tracking-tight">
              {loading ? '-' : resumo?.pendentes_agendamento ?? 0}
            </h3>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 flex items-center gap-1 group"
            >
              Alocar técnico agora
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Próximas Instalações & Orçamentos em Aberto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Próximas Instalações (v_instalacoes) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-800 text-sm">
                Próximas Instalações (View v_instalacoes)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver agenda completa
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-6 flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : proximasInstalacoes.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhuma instalação agendada no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasInstalacoes.map((inst) => (
                  <div
                    key={inst.pedido_id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">
                          {inst.cliente_nome}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[inst.status].bg} ${STATUS_CONFIG[inst.status].text} ${STATUS_CONFIG[inst.status].border}`}>
                          {STATUS_CONFIG[inst.status].label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateTime(inst.data_instalacao)}
                        <span className="text-slate-300">•</span>
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Técnico: <span className="font-semibold text-slate-700">{inst.tecnico_nome || 'A definir'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        📍 {inst.endereco}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 block">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-slate-800 text-sm">
                Orçamentos em Aberto
              </h2>
            </div>
            <button
              onClick={() => onNavigate('pedidos')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver todos os pedidos
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-6 flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orcamentosPendentes.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhum orçamento pendente de aprovação.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orcamentosPendentes.map((orc) => (
                  <div
                    key={orc.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">
                          {orc.cliente?.nome || 'Cliente não identificado'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Orçamento
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {formatPhone(orc.cliente?.telefone)}
                        <span className="text-slate-300">•</span>
                        Criado em {formatDateTime(orc.created_at)}
                      </p>
                      {orc.observacoes && (
                        <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-1">
                          "{orc.observacoes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatCurrency(orc.valor_total)}
                      </span>
                      <button
                        onClick={() => onNavigate('pedidos')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 inline-block"
                      >
                        Gerenciar
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
