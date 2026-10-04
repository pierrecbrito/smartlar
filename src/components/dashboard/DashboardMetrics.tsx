import React, { useMemo } from 'react';
import { ClipboardList, CheckCircle2, Wallet, Clock } from 'lucide-react';
import { Pedido } from '../../types/database';
import { formatCurrency } from '../../lib/utils';

interface DashboardMetricsProps {
  pedidos: Pedido[];
  loading: boolean;
  onNavigate: (tab: any) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ pedidos, loading, onNavigate }) => {
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

  return (
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
  );
};
