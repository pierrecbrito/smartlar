import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, Cliente, StatusPedido } from '../types/database';
import { formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';
import { OrcamentoPdfModal } from '../components/OrcamentoPdfModal';
import { ScheduleModal } from '../components/pedidos/ScheduleModal';
import { OrderHistoryModal } from '../components/pedidos/OrderHistoryModal';
import { OrderItemsModal } from '../components/pedidos/OrderItemsModal';
import { PedidosFilterBar } from '../components/pedidos/PedidosFilterBar';
import { PedidosKanbanView } from '../components/pedidos/PedidosKanbanView';
import { PedidosListView } from '../components/pedidos/PedidosListView';
import {
  PedidosFilterState,
  INITIAL_PEDIDOS_FILTERS,
  countActiveFilters,
} from '../types/pedidosFilters';
import { usePedidos, useUpdatePedidoStatus } from '../hooks/queries/usePedidos';
import { useTecnicosQuery, useClientesQuery } from '../hooks/queries/useSharedData';

export const PedidosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetOrderIdFromUrl = searchParams.get('id');

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [filters, setFilters] = useState<PedidosFilterState>(INITIAL_PEDIDOS_FILTERS);

  // Queries TanStack com cache e sincronização Realtime
  const { data: pedidos = [], isLoading: loadingPedidos, refetch: refetchPedidos } = usePedidos();
  const { data: tecnicos = [] } = useTecnicosQuery();
  const { data: clientes = [] } = useClientesQuery();
  const updateStatusMutation = useUpdatePedidoStatus();

  // Modais de apoio
  const [schedulingOrder, setSchedulingOrder] = useState<Pedido | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Pedido | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Pedido | null>(null);
  const [pdfModalOrder, setPdfModalOrder] = useState<Pedido | null>(null);

  const { showToast } = useToast();

  // Se a URL contiver `?id=...` (vindo da busca global ou deep-link), abre o pedido automaticamente
  useEffect(() => {
    if (targetOrderIdFromUrl && pedidos.length > 0) {
      const found = pedidos.find((p) => p.id === targetOrderIdFromUrl);
      if (found) {
        setViewingOrder(found);
      }
    }
  }, [targetOrderIdFromUrl, pedidos]);

  // Mapeamento de contagem de pedidos por cliente
  const clientOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pedidos.forEach((p) => {
      if (p.cliente_id) {
        counts[p.cliente_id] = (counts[p.cliente_id] || 0) + 1;
      }
    });
    return counts;
  }, [pedidos]);

  // Aplicação de filtros
  const filteredPedidos = useMemo(() => {
    return pedidos
      .filter((p) => {
        // 1. Status (no modo lista)
        if (viewMode === 'lista' && selectedStatusFilter !== 'todos') {
          if (p.status !== selectedStatusFilter) return false;
        }

        // 2. Filtro por Cliente específico
        if (filters.clienteId !== 'todos') {
          if (p.cliente_id !== filters.clienteId && p.cliente?.id !== filters.clienteId) {
            return false;
          }
        }

        // 3. Faixa de Valores
        const total = p.valor_total || 0;
        if (filters.valorMin !== '') {
          const min = parseFloat(filters.valorMin);
          if (!isNaN(min) && total < min) return false;
        }
        if (filters.valorMax !== '') {
          const max = parseFloat(filters.valorMax);
          if (!isNaN(max) && total > max) return false;
        }

        // 4. Técnico Alocado
        if (filters.tecnicoId === 'sem_tecnico') {
          if (p.tecnico_id) return false;
        } else if (filters.tecnicoId !== 'todos') {
          if (p.tecnico_id !== filters.tecnicoId) return false;
        }

        // 5. Período
        if (filters.periodo !== 'todos') {
          const orderDate = new Date(p.created_at);
          const now = new Date();
          if (filters.periodo === 'hoje') {
            const isToday =
              orderDate.getDate() === now.getDate() &&
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (filters.periodo === '7dias') {
            const diffTime = now.getTime() - orderDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            if (diffDays > 7 || diffDays < 0) return false;
          } else if (filters.periodo === 'este_mes') {
            const isThisMonth =
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear();
            if (!isThisMonth) return false;
          } else if (filters.periodo === '30dias') {
            const diffTime = now.getTime() - orderDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            if (diffDays > 30 || diffDays < 0) return false;
          }
        }

        // 6. Busca Geral por Texto
        if (filters.search.trim() !== '') {
          const searchClean = filters.search.replace(/\D/g, '');
          const q = filters.search.toLowerCase().trim();
          const match =
            (searchClean !== '' && p.numero_pedido?.toString().includes(searchClean)) ||
            p.id.toLowerCase().includes(q) ||
            p.cliente?.nome?.toLowerCase().includes(q) ||
            p.tecnico?.nome?.toLowerCase().includes(q) ||
            p.observacoes?.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'antigos') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (filters.sortBy === 'maior_valor') {
          return (b.valor_total || 0) - (a.valor_total || 0);
        }
        if (filters.sortBy === 'menor_valor') {
          return (a.valor_total || 0) - (b.valor_total || 0);
        }
        if (filters.sortBy === 'cliente_az') {
          return (a.cliente?.nome || '').localeCompare(b.cliente?.nome || '');
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [pedidos, viewMode, selectedStatusFilter, filters]);

  const totalFilteredValue = useMemo(() => {
    return filteredPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  }, [filteredPedidos]);

  const handleFilterChange = (updater: Partial<PedidosFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updater }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_PEDIDOS_FILTERS);
  };

  const handleTransitionStatus = async (pedido: Pedido, novoStatus: StatusPedido) => {
    if (novoStatus === 'agendado') {
      setSchedulingOrder(pedido);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        pedidoId: pedido.id,
        novoStatus,
      });

      showToast(
        'success',
        `Status atualizado para "${STATUS_CONFIG[novoStatus].label}"`,
        `Pedido ${formatOrderCode(pedido)} avançou no fluxo.`
      );
    } catch (err: unknown) {
      console.error('Erro na transição:', err);
      const msg = err instanceof Error ? err.message : 'Regra de negócio violada no servidor.';
      showToast('error', 'Transição de status não permitida', msg);
    }
  };

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Barra de Filtros Inteligentes */}
      <PedidosFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        clientes={clientes}
        tecnicos={tecnicos}
        clientOrderCounts={clientOrderCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedStatusFilter={selectedStatusFilter}
        onSelectStatusFilter={setSelectedStatusFilter}
        filteredCount={filteredPedidos.length}
        totalCount={pedidos.length}
        totalValue={totalFilteredValue}
      />

      {/* Visualização KANBAN ou LISTA */}
      {viewMode === 'kanban' ? (
        <PedidosKanbanView
          pedidos={filteredPedidos}
          loading={loadingPedidos}
          onTransitionStatus={handleTransitionStatus}
          onOpenHistory={(pedido) => setHistoryOrder(pedido)}
          onOpenDetails={(pedido) => setViewingOrder(pedido)}
          onGeneratePdf={(pedido) => setPdfModalOrder(pedido)}
          showToast={showToast}
          hasActiveFilters={activeFiltersCount > 0}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <PedidosListView
          pedidos={filteredPedidos}
          loading={loadingPedidos}
          onTransitionStatus={handleTransitionStatus}
          onOpenHistory={(pedido) => setHistoryOrder(pedido)}
          onOpenDetails={(pedido) => setViewingOrder(pedido)}
          onGeneratePdf={(pedido) => setPdfModalOrder(pedido)}
        />
      )}

      {/* Modal de Agendamento */}
      {schedulingOrder && (
        <ScheduleModal
          pedido={schedulingOrder}
          tecnicos={tecnicos}
          allPedidos={pedidos}
          onClose={() => setSchedulingOrder(null)}
          onSuccess={async () => {
            await refetchPedidos();
          }}
          showToast={showToast}
        />
      )}

      {/* Modal de Histórico de Auditoria */}
      <OrderHistoryModal
        pedido={historyOrder}
        onClose={() => setHistoryOrder(null)}
        showToast={showToast}
      />

      {/* Modal de Itens do Pedido */}
      <OrderItemsModal
        pedido={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onGeneratePdf={(pedido) => setPdfModalOrder(pedido)}
      />

      {/* Modal de Proposta Comercial em PDF e Envio WhatsApp */}
      {pdfModalOrder && pdfModalOrder.cliente && (
        <OrcamentoPdfModal
          isOpen={Boolean(pdfModalOrder)}
          onClose={() => setPdfModalOrder(null)}
          pedido={pdfModalOrder}
          cliente={pdfModalOrder.cliente}
          itens={pdfModalOrder.itens || []}
          descontoPercentual={0}
          observacoes={pdfModalOrder.observacoes || ''}
          formaPagamento={pdfModalOrder.forma_pagamento || ''}
        />
      )}
    </div>
  );
};
