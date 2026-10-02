import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Play,
  History,
  Eye,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico, StatusPedido, TipoPagamento, HistoricoStatus } from '../types/database';
import { formatCurrency, formatDateTime, formatPhone, STATUS_CONFIG, PROXIMOS_STATUS } from '../lib/utils';
import { useToast } from '../components/Toast';

export const PedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // Modal de Agendamento
  const [schedulingOrder, setSchedulingOrder] = useState<Pedido | null>(null);
  const [scheduleTecnicoId, setScheduleTecnicoId] = useState('');
  const [scheduleData, setScheduleData] = useState('');
  const [scheduleFormaPgto, setScheduleFormaPgto] = useState<TipoPagamento | ''>('pix');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Modal de Histórico de Auditoria
  const [historyOrder, setHistoryOrder] = useState<Pedido | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoricoStatus[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal de Detalhes dos Itens do Pedido
  const [viewingOrder, setViewingOrder] = useState<Pedido | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, tecnicosRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(*),
            tecnico:tecnicos(*),
            itens:itens_pedido(*, produto:produtos(*))
          `)
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setPedidos(pedidosRes.data || []);
      setTecnicos(tecnicosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao listar pedidos:', err);
      showToast('error', 'Falha ao carregar pedidos', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPedidos = pedidos.filter((p) => {
    if (selectedStatusFilter === 'todos') return true;
    return p.status === selectedStatusFilter;
  });

  const handleTransitionStatus = async (pedido: Pedido, novoStatus: StatusPedido) => {
    if (novoStatus === 'agendado') {
      setSchedulingOrder(pedido);
      setScheduleTecnicoId(pedido.tecnico_id || (tecnicos[0]?.id || ''));
      setScheduleData('');
      setScheduleFormaPgto(pedido.forma_pagamento || 'pix');
      return;
    }

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedido.id);

      if (error) throw error;

      showToast(
        'success',
        `Status atualizado para "${STATUS_CONFIG[novoStatus].label}"`,
        `Pedido #${pedido.id.slice(0, 8)} avançou no fluxo.`
      );

      loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      showToast(
        'error',
        'Transição Recusada pelo Banco',
        err.message || 'O PostgreSQL barrou a transição.'
      );
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingOrder) return;

    if (!scheduleTecnicoId || !scheduleData) {
      showToast('warning', 'Campos obrigatórios', 'Selecione um técnico e uma data/hora.');
      return;
    }

    setSavingSchedule(true);
    try {
      const dataIso = new Date(scheduleData).toISOString();

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'agendado',
          tecnico_id: scheduleTecnicoId,
          data_instalacao: dataIso,
          forma_pagamento: scheduleFormaPgto || null,
        })
        .eq('id', schedulingOrder.id);

      if (error) throw error;

      showToast('success', 'Instalação agendada com sucesso!');
      setSchedulingOrder(null);
      loadData();
    } catch (err: any) {
      console.error('Erro no agendamento:', err);
      showToast('error', 'Recusa do PostgreSQL', err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenHistory = async (pedido: Pedido) => {
    setHistoryOrder(pedido);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('historico_status')
        .select('*')
        .eq('pedido_id', pedido.id)
        .order('alterado_em', { ascending: true });

      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      showToast('error', 'Erro ao carregar histórico', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const statusOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'orcamento', label: 'Orçamentos' },
    { id: 'aprovado', label: 'Aprovados' },
    { id: 'agendado', label: 'Agendados' },
    { id: 'em_andamento', label: 'Em Andamento' },
    { id: 'concluido', label: 'Concluídos' },
    { id: 'cancelado', label: 'Cancelados' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            ESTADOS DO POSTGRES
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transições blindadas por triggers PL/pgSQL com auditoria automática
          </p>
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {statusOptions.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusFilter === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos em Dark Glass */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-12 text-center text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Nenhum pedido encontrado neste status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPedidos.map((pedido) => {
            const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
            const statusStyle = STATUS_CONFIG[pedido.status];

            return (
              <div
                key={pedido.id}
                className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-white/[0.14] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Dados Principais */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md">
                      #{pedido.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Criado em {formatDateTime(pedido.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Cliente</span>
                      <span className="font-bold text-white">
                        {pedido.cliente?.nome || 'Cliente não encontrado'}
                      </span>
                      <p className="text-slate-400 text-[11px]">{formatPhone(pedido.cliente?.telefone)}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Técnico Alocado</span>
                      <span className="font-semibold text-slate-300">
                        {pedido.tecnico?.nome ? (
                          `🛠️ ${pedido.tecnico.nome}`
                        ) : (
                          <span className="text-amber-400 font-medium">Não alocado</span>
                        )}
                      </span>
                      {pedido.data_instalacao && (
                        <p className="text-slate-400 text-[11px]">
                          📅 {formatDateTime(pedido.data_instalacao)}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Valor Total (Banco)</span>
                      <span className="font-extrabold text-sm text-emerald-400">
                        {formatCurrency(pedido.valor_total)}
                      </span>
                      {pedido.forma_pagamento && (
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          💳 {pedido.forma_pagamento.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {pedido.observacoes && (
                    <p className="text-xs text-slate-300 italic bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                      💬 "{pedido.observacoes}"
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingOrder(pedido)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Ver Itens"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Itens</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenHistory(pedido)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Histórico"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Histórico</span>
                  </button>

                  {/* Transições permitidas */}
                  {allowedTransitions.map((nextStatus) => {
                    if (nextStatus === 'aprovado') {
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => handleTransitionStatus(pedido, 'aprovado')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                      );
                    }

                    if (nextStatus === 'agendado') {
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => handleTransitionStatus(pedido, 'agendado')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Agendar
                        </button>
                      );
                    }

                    if (nextStatus === 'em_andamento') {
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => handleTransitionStatus(pedido, 'em_andamento')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Iniciar
                        </button>
                      );
                    }

                    if (nextStatus === 'concluido') {
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => handleTransitionStatus(pedido, 'concluido')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
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
                              handleTransitionStatus(pedido, 'cancelado');
                            }
                          }}
                          className="px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors border border-rose-500/30"
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
      )}

      {/* Modal Agendar Instalação */}
      {schedulingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121622] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/[0.12]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-purple-950/20">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Agendar Instalação (#{schedulingOrder.id.slice(0, 8)})
              </h3>
              <button
                onClick={() => setSchedulingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <p><b>Cliente:</b> {schedulingOrder.cliente?.nome}</p>
                <p><b>Endereço:</b> {schedulingOrder.cliente?.endereco}</p>
                <p><b>Total:</b> {formatCurrency(schedulingOrder.valor_total)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Técnico Responsável *
                </label>
                <select
                  required
                  value={scheduleTecnicoId}
                  onChange={(e) => setScheduleTecnicoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="" className="bg-[#121622]">-- Selecione o técnico --</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#121622]">
                      {t.nome} ({t.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data e Horário *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleData}
                  onChange={(e) => setScheduleData(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={scheduleFormaPgto}
                  onChange={(e) => setScheduleFormaPgto(e.target.value as TipoPagamento)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pix" className="bg-[#121622]">PIX</option>
                  <option value="cartao_credito" className="bg-[#121622]">Cartão de Crédito</option>
                  <option value="cartao_debito" className="bg-[#121622]">Cartão de Débito</option>
                  <option value="boleto" className="bg-[#121622]">Boleto</option>
                  <option value="dinheiro" className="bg-[#121622]">Dinheiro</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSchedulingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs"
                >
                  {savingSchedule ? 'Gravando no banco...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico de Auditoria */}
      {historyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121622] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/[0.12]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Auditoria de Status (#{historyOrder.id.slice(0, 8)})
              </h3>
              <button
                onClick={() => setHistoryOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">Carregando auditoria...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum registro de auditoria.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {log.status_anterior ? (
                              <>
                                <span className="text-slate-400">{STATUS_CONFIG[log.status_anterior].label}</span>
                                <span className="text-slate-500 mx-1">➔</span>
                              </>
                            ) : (
                              <span className="text-slate-400">Criação inicial: </span>
                            )}
                            <span className="text-indigo-400">{STATUS_CONFIG[log.status_novo].label}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(log.alterado_em)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes dos Itens */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121622] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/[0.12]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-400" />
                Itens do Pedido #{viewingOrder.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-white/[0.04]">
                {viewingOrder.itens && viewingOrder.itens.length > 0 ? (
                  viewingOrder.itens.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">
                          {item.produto?.nome || 'Produto'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                        </span>
                      </div>
                      <div className="font-extrabold text-white">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum item vinculado.</p>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-400">Total Confirmado:</span>
                <span className="text-lg font-extrabold text-emerald-400">
                  {formatCurrency(viewingOrder.valor_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
