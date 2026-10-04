import React, { useEffect, useState, useMemo } from 'react';
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

export const PedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [filters, setFilters] = useState<PedidosFilterState>(INITIAL_PEDIDOS_FILTERS);

  // Modais de apoio
  const [schedulingOrder, setSchedulingOrder] = useState<Pedido | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Pedido | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Pedido | null>(null);
  const [pdfModalOrder, setPdfModalOrder] = useState<Pedido | null>(null);

  const { showToast } = useToast();

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pedidosRes, tecnicosRes, clientesRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(id, nome, telefone, endereco),
            tecnico:tecnicos(id, nome, telefone, especialidade),
            itens:itens_pedido(
              id,
              quantidade,
              preco_unitario,
              subtotal,
              produto:produtos(id, nome, categoria)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome', { ascending: true }),
        supabase.from('clientes').select('id, nome, telefone, endereco').order('nome', { ascending: true }),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;
      if (clientesRes.error) throw clientesRes.error;

      setPedidos((pedidosRes.data || []) as Pedido[]);
      setTecnicos((tecnicosRes.data || []) as Tecnico[]);
      setClientes((clientesRes.data || []) as Cliente[]);
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      showToast('error', 'Falha ao carregar pedidos', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mapeamento de quantos pedidos cada cliente possui
  const clientOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pedidos.forEach((p) => {
      if (p.cliente_id) {
        counts[p.cliente_id] = (counts[p.cliente_id] || 0) + 1;
      }
    });
    return counts;
  }, [pedidos]);

  // Aplicação de todos os filtros (Cliente, Valores, Técnico, Período, Busca, Status)
  const filteredPedidos = useMemo(() => {
    return pedidos
      .filter((p) => {
        // 1. Status (aplicado quando no modo lista)
        if (viewMode === 'lista' && selectedStatusFilter !== 'todos') {
          if (p.status !== selectedStatusFilter) return false;
        }

        // 2. Filtro por Cliente específico
        if (filters.clienteId !== 'todos') {
          if (p.cliente_id !== filters.clienteId && p.cliente?.id !== filters.clienteId) {
            return false;
          }
        }

        // 3. Filtro por Faixa de Valores (Preço / Total do Pedido)
        const total = p.valor_total || 0;
        if (filters.valorMin !== '') {
          const min = parseFloat(filters.valorMin);
          if (!isNaN(min) && total < min) return false;
        }
        if (filters.valorMax !== '') {
          const max = parseFloat(filters.valorMax);
          if (!isNaN(max) && total > max) return false;
        }

        // 4. Filtro por Técnico Alocado
        if (filters.tecnicoId === 'sem_tecnico') {
          if (p.tecnico_id) return false;
        } else if (filters.tecnicoId !== 'todos') {
          if (p.tecnico_id !== filters.tecnicoId) return false;
        }

        // 5. Filtro por Período de Criação
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
        // default: 'recentes'
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [pedidos, viewMode, selectedStatusFilter, filters]);

  // Valor total somado dos pedidos que atendem aos filtros atuais
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

    // Atualização otimista imediata para transição instantânea e fluida
    const previousPedidos = [...pedidos];
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p))
    );

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedido.id);

      if (error) throw error;

      showToast(
        'success',
        `Status atualizado para "${STATUS_CONFIG[novoStatus].label}"`,
        `Pedido ${formatOrderCode(pedido)} avançou no fluxo.`
      );

      // Sincroniza em background
      loadData(true);
    } catch (err: any) {
      // Reverte a alteração otimista caso o banco rejeite
      setPedidos(previousPedidos);
      console.error('Erro na transição:', err);
      showToast(
        'error',
        'Transição de status não permitida',
        err.message || 'Verifique as regras de fluxo do pedido.'
      );
    }
  };

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Barra de Filtros Inteligentes (Cliente, Faixa de Valores, Busca, Modo) */}
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
          loading={loading}
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
          loading={loading}
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
          onSuccess={(pedidoId, tecnicoId, isoDate, tecnicoObj) => {
            setPedidos((prev) =>
              prev.map((p) =>
                p.id === pedidoId
                  ? {
                      ...p,
                      status: 'agendado',
                      tecnico_id: tecnicoId,
                      tecnico: tecnicoObj || p.tecnico,
                      data_instalacao: isoDate,
                    }
                  : p
              )
            );
            loadData(true);
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
