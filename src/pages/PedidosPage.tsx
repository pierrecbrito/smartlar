import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Play,
  History,
  Eye,
  X,
  CreditCard,
  User,
  Clock,
  ArrowRight
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
      console.error('Erro na transição:', err);
      showToast(
        'error',
        'Transição recusada pelo banco de dados',
        err.message || 'Verifique as regras de fluxo do PostgreSQL.'
      );
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingOrder) return;

    if (!scheduleTecnicoId || !scheduleData) {
      showToast('error', 'Campos obrigatórios', 'Técnico e Data/Horário são obrigatórios para agendar.');
      return;
    }

    setSavingSchedule(true);
    try {
      const isoDate = new Date(scheduleData).toISOString();

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'agendado',
          tecnico_id: scheduleTecnicoId,
          data_instalacao: isoDate,
          forma_pagamento: scheduleFormaPgto || null,
        })
        .eq('id', schedulingOrder.id);

      if (error) throw error;

      showToast(
        'success',
        'Instalação agendada com sucesso!',
        `Data e técnico registrados. A automação n8n do dia seguinte alertará a equipe.`
      );

      setSchedulingOrder(null);
      loadData();
    } catch (err: any) {
      console.error('Erro ao agendar:', err);
      showToast('error', 'Falha ao gravar agendamento', err.message);
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
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            MÁQUINA DE ESTADOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Transições blindadas por triggers PL/pgSQL com auditoria automática
          </p>
        </div>

        {/* Filtros de Status (Pill Design) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {statusOptions.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatusFilter(st.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos em Cards Brancos */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200/80 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Nenhum pedido encontrado neste status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPedidos.map((pedido) => {
            const allowedTransitions = PROXIMOS_STATUS[pedido.status] || [];
            const statusStyle = STATUS_CONFIG[pedido.status];

            return (
              <div
                key={pedido.id}
                className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs hover:border-blue-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Dados Principais */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                      #{pedido.id.slice(0, 8)}
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
                      <span className="text-slate-400 block text-[11px] font-semibold">Valor Total (Banco)</span>
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
                    onClick={() => setViewingOrder(pedido)}
                    className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver Itens"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Itens</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenHistory(pedido)}
                    className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Histórico"
                  >
                    <History className="w-4 h-4 text-slate-500" />
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
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                          onClick={() => handleTransitionStatus(pedido, 'agendado')}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                          onClick={() => handleTransitionStatus(pedido, 'em_andamento')}
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                          onClick={() => handleTransitionStatus(pedido, 'concluido')}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                              handleTransitionStatus(pedido, 'cancelado');
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
      )}

      {/* Modal Agendar Instalação */}
      {schedulingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Agendar Instalação (#{schedulingOrder.id.slice(0, 8)})
              </h3>
              <button
                onClick={() => setSchedulingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-950 space-y-1">
                <p><b>Cliente:</b> {schedulingOrder.cliente?.nome}</p>
                <p><b>Endereço:</b> {schedulingOrder.cliente?.endereco}</p>
                <p><b>Total do Pedido:</b> {formatCurrency(schedulingOrder.valor_total)}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Técnico Responsável *
                </label>
                <select
                  required
                  value={scheduleTecnicoId}
                  onChange={(e) => setScheduleTecnicoId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Selecione o técnico --</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Data e Horário *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleData}
                  onChange={(e) => setScheduleData(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={scheduleFormaPgto}
                  onChange={(e) => setScheduleFormaPgto(e.target.value as TipoPagamento)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Auditoria de Status (#{historyOrder.id.slice(0, 8)})
              </h3>
              <button
                onClick={() => setHistoryOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {log.status_anterior ? (
                              <>
                                <span className="text-slate-500">{STATUS_CONFIG[log.status_anterior].label}</span>
                                <span className="text-slate-400 mx-1">➔</span>
                              </>
                            ) : (
                              <span className="text-slate-500">Criação inicial: </span>
                            )}
                            <span className="text-blue-600">{STATUS_CONFIG[log.status_novo].label}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Itens do Pedido #{viewingOrder.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {viewingOrder.itens && viewingOrder.itens.length > 0 ? (
                  viewingOrder.itens.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {item.produto?.nome || 'Produto'}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum item vinculado.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-500">Total Confirmado:</span>
                <span className="text-xl font-extrabold text-slate-900">
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
