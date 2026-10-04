import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Play,
  History,
  Eye,
  X,
  User,
  Clock,
  ArrowRight,
  Lock,
  FileText,
  Filter,
} from 'lucide-react';
import { Pedido, StatusPedido } from '../../types/database';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatPhone,
  formatOrderCode,
  STATUS_CONFIG,
  PROXIMOS_STATUS,
} from '../../lib/utils';

interface PedidosKanbanViewProps {
  pedidos: Pedido[];
  loading: boolean;
  onTransitionStatus: (pedido: Pedido, novoStatus: StatusPedido) => void;
  onOpenHistory: (pedido: Pedido) => void;
  onOpenDetails: (pedido: Pedido) => void;
  onGeneratePdf: (pedido: Pedido) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

const KANBAN_COLUMNS: StatusPedido[] = [
  'orcamento',
  'aprovado',
  'agendado',
  'em_andamento',
  'concluido',
  'cancelado',
];

export const PedidosKanbanView: React.FC<PedidosKanbanViewProps> = ({
  pedidos,
  loading,
  onTransitionStatus,
  onOpenHistory,
  onOpenDetails,
  onGeneratePdf,
  showToast,
  hasActiveFilters = false,
  onResetFilters,
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatusPedido | null>(null);

  const draggedOrder = draggedOrderId ? pedidos.find((p) => p.id === draggedOrderId) || null : null;
  const allowedNextStatuses = draggedOrder ? (PROXIMOS_STATUS[draggedOrder.status] || []) : [];

  const handleDragStart = (e: React.DragEvent, pedido: Pedido) => {
    const allowed = PROXIMOS_STATUS[pedido.status] || [];
    if (allowed.length === 0) {
      e.preventDefault();
      showToast('info', 'Status final', 'Pedidos concluídos ou cancelados não podem ser alterados.');
      return;
    }
    e.dataTransfer.setData('text/plain', pedido.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(pedido.id);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusPedido) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (!orderId) {
      setDraggedOrderId(null);
      return;
    }

    const pedido = pedidos.find((p) => p.id === orderId);
    if (!pedido) {
      setDraggedOrderId(null);
      return;
    }

    if (pedido.status === targetStatus) {
      setDraggedOrderId(null);
      return;
    }

    const allowed = PROXIMOS_STATUS[pedido.status] || [];
    if (!allowed.includes(targetStatus)) {
      showToast(
        'error',
        'Transição não permitida',
        `Apenas a próxima fase é permitida. Este pedido só pode avançar para: ${
          allowed.length > 0
            ? allowed.map((s) => `"${STATUS_CONFIG[s].label}"`).join(' ou ')
            : 'Nenhuma (status final)'
        }.`
      );
      setDraggedOrderId(null);
      return;
    }

    setDraggedOrderId(null);
    onTransitionStatus(pedido, targetStatus);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="h-96 bg-white/60 border border-slate-200/80 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasActiveFilters && pedidos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Filter className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold">Nenhum pedido encontrado para os filtros selecionados.</p>
              <p className="text-[11px] text-amber-700">Tente ajustar a faixa de valores, selecionar outro cliente ou limpar os filtros para visualizar os pedidos.</p>
            </div>
          </div>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[580px] scrollbar-thin">
        {KANBAN_COLUMNS.map((colStatus) => {
          const colConfig = STATUS_CONFIG[colStatus];
          const colPedidos = pedidos.filter((p) => p.status === colStatus);
          const colTotal = colPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);

        const isDragging = draggedOrder !== null;
        const isCurrentCol = draggedOrder?.status === colStatus;
        const isAllowedTarget = isDragging && allowedNextStatuses.includes(colStatus);
        const isDisallowedTarget = isDragging && !isAllowedTarget && !isCurrentCol;
        const isOver = dragOverColumn === colStatus && isAllowedTarget;

        return (
          <div
            key={colStatus}
            onDragOver={(e) => {
              if (!draggedOrder || !isAllowedTarget) {
                e.dataTransfer.dropEffect = 'none';
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== colStatus) {
                setDragOverColumn(colStatus);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === colStatus) setDragOverColumn(null);
            }}
            onDrop={(e) => {
              if (!isAllowedTarget) {
                e.preventDefault();
                setDragOverColumn(null);
                showToast(
                  'error',
                  'Transição não permitida',
                  `Não é permitido pular fases. O pedido só pode avançar para: ${
                    allowedNextStatuses.length > 0
                      ? allowedNextStatuses.map((s) => STATUS_CONFIG[s]?.label).join(' ou ')
                      : 'Nenhuma'
                  }.`
                );
                return;
              }
              handleDrop(e, colStatus);
            }}
            className={`w-[290px] min-w-[290px] shrink-0 rounded-2xl border transition-all flex flex-col max-h-[calc(100vh-230px)] ${
              isOver
                ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-md'
                : isAllowedTarget
                ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-400/20 shadow-xs'
                : isDisallowedTarget
                ? 'opacity-40 border-dashed border-slate-300 bg-slate-100/40 select-none'
                : 'bg-slate-100/70 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {/* Cabeçalho da Coluna Kanban */}
            <div
              className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between transition-colors ${
                isAllowedTarget
                  ? 'border-blue-200 bg-blue-100/60'
                  : 'border-slate-200/80 bg-white/70 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colConfig.dot}`} />
                <span className="font-extrabold text-xs text-slate-800 tracking-tight">
                  {colConfig.label}
                </span>
                <span className="bg-slate-200/80 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {colPedidos.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isAllowedTarget && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white/95 px-2 py-0.5 rounded-full border border-blue-300 shadow-2xs animate-pulse">
                    <ArrowRight className="w-2.5 h-2.5" /> Próxima fase
                  </span>
                )}
                {isDisallowedTarget && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                    <Lock className="w-2.5 h-2.5" /> Bloqueado
                  </span>
                )}
                {!isDragging && (
                  <span className="text-[11px] font-bold text-slate-500">
                    {formatCurrency(colTotal)}
                  </span>
                )}
              </div>
            </div>

            {/* Drop helper visual indicator */}
            {isOver && (
              <div className="mx-2.5 mt-2 border-2 border-dashed border-blue-500 bg-blue-100/70 rounded-xl p-2 text-center text-xs font-bold text-blue-800 shadow-inner animate-pulse">
                Solte aqui para avançar para {colConfig.label}
              </div>
            )}

            {/* Lista de Cards da Coluna */}
            <div className="p-2.5 space-y-3 overflow-y-auto flex-1 min-h-[140px]">
              {colPedidos.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                  <span className="text-xs font-medium">Nenhum pedido</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isAllowedTarget
                      ? 'Solte o card aqui'
                      : hasActiveFilters
                      ? 'Nenhum resultado no filtro'
                      : 'Coluna vazia'}
                  </span>
                </div>
              ) : (
                colPedidos.map((pedido) => {
                  const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
                  const canDrag = allowedTransitions.length > 0;
                  const isThisDragged = draggedOrderId === pedido.id;

                  return (
                    <div
                      key={pedido.id}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, pedido)}
                      onDragEnd={() => {
                        setDraggedOrderId(null);
                        setDragOverColumn(null);
                      }}
                      style={{ borderBottom: '2px solid rgb(42 108 184 / 0.35)' }}
                      className={`bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition-all group space-y-2.5 overflow-hidden ${
                        isThisDragged
                          ? 'opacity-30 border-dashed border-blue-400 scale-[0.98]'
                          : canDrag
                          ? 'cursor-grab active:cursor-grabbing hover:border-slate-300'
                          : 'cursor-default hover:border-slate-200'
                      }`}
                    >
                      {/* Card Top: ID + Data + Cancelar (se permitido) */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${colConfig.dot}`} />
                          <span className="font-mono font-bold text-slate-800 truncate">
                            {formatOrderCode(pedido)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-slate-400 font-medium text-[10px]">
                            {formatDate(pedido.created_at)}
                          </span>
                          {allowedTransitions.includes('cancelado') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Deseja realmente cancelar este pedido?')) {
                                  onTransitionStatus(pedido, 'cancelado');
                                }
                              }}
                              className="p-1 -mr-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancelar Pedido"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cliente */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {pedido.cliente?.nome || 'Cliente não informado'}
                          </span>
                        </div>
                        {pedido.cliente?.telefone && (
                          <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                            {formatPhone(pedido.cliente.telefone)}
                          </p>
                        )}
                      </div>

                      {/* Informações de Instalação / Técnico */}
                      {(pedido.tecnico || pedido.data_instalacao) && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-1">
                          {pedido.tecnico && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="text-xs">🛠️</span>
                              <span className="font-semibold truncate">{pedido.tecnico.nome}</span>
                            </div>
                          )}
                          {pedido.data_instalacao && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDateTime(pedido.data_instalacao)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rodapé do Card: Total e Ações */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-nowrap">
                        <div className="shrink-0">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">Total</span>
                          <span className="text-xs font-extrabold text-slate-900 leading-none">
                            {formatCurrency(pedido.valor_total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenDetails(pedido)}
                            title="Ver Itens"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenHistory(pedido)}
                            title="Histórico de Alterações"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onGeneratePdf(pedido)}
                            title="Gerar Proposta PDF / WhatsApp"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {allowedTransitions.filter((s) => s !== 'cancelado').map((nextStatus) => {
                            if (nextStatus === 'aprovado') {
                              return (
                                <button
                                  key={nextStatus}
                                  type="button"
                                  onClick={() => onTransitionStatus(pedido, 'aprovado')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Aprovar Orçamento"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
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
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Agendar Técnico"
                                >
                                  <Calendar className="w-3 h-3" />
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
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Iniciar Instalação"
                                >
                                  <Play className="w-3 h-3" />
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
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Concluir Instalação"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Concluir
                                </button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
