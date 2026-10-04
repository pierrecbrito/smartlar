import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, StatusPedido } from '../types/database';
import { formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';
import { OrcamentoPdfModal } from '../components/OrcamentoPdfModal';
import { ScheduleModal } from '../components/pedidos/ScheduleModal';
import { OrderHistoryModal } from '../components/pedidos/OrderHistoryModal';
import { OrderItemsModal } from '../components/pedidos/OrderItemsModal';
import { PedidosFilterBar } from '../components/pedidos/PedidosFilterBar';
import { PedidosKanbanView } from '../components/pedidos/PedidosKanbanView';
import { PedidosListView } from '../components/pedidos/PedidosListView';

export const PedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [search, setSearch] = useState('');

  // Modais de apoio
  const [schedulingOrder, setSchedulingOrder] = useState<Pedido | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Pedido | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Pedido | null>(null);
  const [pdfModalOrder, setPdfModalOrder] = useState<Pedido | null>(null);

  const { showToast } = useToast();

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pedidosRes, tecnicosRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(id, nome, telefone, endereco),
            tecnico:tecnicos(id, nome, telefone, especialidade),
            itens:pedido_itens(
              id,
              quantidade,
              preco_unitario,
              total,
              produto:produtos(id, nome, categoria)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome', { ascending: true }),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setPedidos((pedidosRes.data || []) as Pedido[]);
      setTecnicos((tecnicosRes.data || []) as Tecnico[]);
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

  const filteredPedidos = pedidos.filter((p) => {
    const matchStatus =
      viewMode === 'kanban'
        ? true
        : selectedStatusFilter === 'todos' || p.status === selectedStatusFilter;

    const searchClean = search.replace(/\D/g, '');
    const matchSearch =
      search.trim() === '' ||
      p.numero_pedido?.toString().includes(searchClean) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.tecnico?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.observacoes?.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

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

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Barra de Filtros e Alternância de Modo */}
      <PedidosFilterBar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedStatusFilter={selectedStatusFilter}
        onSelectStatusFilter={setSelectedStatusFilter}
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
