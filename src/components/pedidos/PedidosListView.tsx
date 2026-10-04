import React from 'react';
import {
  ClipboardList,
  Eye,
  History,
  FileText,
  CheckCircle2,
  Calendar,
  Play,
} from 'lucide-react';
import { Pedido, StatusPedido } from '../../types/database';
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
  formatOrderCode,
  STATUS_CONFIG,
  PROXIMOS_STATUS,
} from '../../lib/utils';

interface PedidosListViewProps {
  pedidos: Pedido[];
  loading: boolean;
  onTransitionStatus: (pedido: Pedido, novoStatus: StatusPedido) => void;
  onOpenHistory: (pedido: Pedido) => void;
  onOpenDetails: (pedido: Pedido) => void;
  onGeneratePdf: (pedido: Pedido) => void;
}

export const PedidosListView: React.FC<PedidosListViewProps> = ({
  pedidos,
  loading,
  onTransitionStatus,
  onOpenHistory,
  onOpenDetails,
  onGeneratePdf,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-200/80 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-2xs">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
        <p className="text-sm font-semibold text-slate-600">Nenhum pedido encontrado neste status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => {
        const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
        const statusStyle = STATUS_CONFIG[pedido.status];

        return (
          <div
            key={pedido.id}
            className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs hover:border-blue-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
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
                onClick={() => onOpenDetails(pedido)}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ver Itens"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Itens</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenHistory(pedido)}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Histórico"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Histórico</span>
              </button>

              <button
                type="button"
                onClick={() => onGeneratePdf(pedido)}
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
                      onClick={() => onTransitionStatus(pedido, 'aprovado')}
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
                      onClick={() => onTransitionStatus(pedido, 'agendado')}
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
                      onClick={() => onTransitionStatus(pedido, 'em_andamento')}
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
                      onClick={() => onTransitionStatus(pedido, 'concluido')}
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
                          onTransitionStatus(pedido, 'cancelado');
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
  );
};
