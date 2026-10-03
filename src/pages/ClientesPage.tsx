import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  ClipboardList,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Pedido } from '../types/database';
import { formatPhone, formatDateTime, formatCurrency, formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ModalPortal } from '../components/ModalPortal';

interface ClienteComPedidos extends Cliente {
  pedidos?: Array<{
    id: string;
    numero_pedido?: number;
    status: string;
    valor_total: number;
  }>;
}

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteComPedidos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Cadastro
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Ver Pedidos do Cliente
  const [selectedClientForOrders, setSelectedClientForOrders] = useState<Cliente | null>(null);
  const [clientOrders, setClientOrders] = useState<Pedido[]>([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          pedidos:pedidos(id, numero_pedido, status, valor_total)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes((data || []) as unknown as ClienteComPedidos[]);
    } catch (err: any) {
      console.error('Erro ao listar clientes:', err);
      showToast('error', 'Falha ao carregar clientes', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenClientOrders = async (cliente: Cliente) => {
    setSelectedClientForOrders(cliente);
    setLoadingClientOrders(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          tecnico:tecnicos(nome),
          itens:itens_pedido(*, produto:produtos(nome))
        `)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientOrders(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos do cliente:', err);
      showToast('error', 'Erro ao carregar histórico do cliente', err.message);
    } finally {
      setLoadingClientOrders(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanPhone = telefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos.');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: nome.trim(),
          telefone: cleanPhone,
          email: email.trim() || null,
          endereco: endereco.trim(),
        })
        .select(`
          *,
          pedidos:pedidos(id, numero_pedido, status, valor_total)
        `)
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      setClientes((prev) => [...prev, data as unknown as ClienteComPedidos]);
      setModalOpen(false);
      setNome('');
      setTelefone('');
      setEmail('');
      setEndereco('');
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      showToast('error', 'Erro ao salvar cliente', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.telefone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.endereco.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            BASE DE DADOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Clientes & Contatos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão centralizada de clientes, endereços de instalação e histórico de pedidos em tabela vertical
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
          Total: <span className="font-extrabold text-slate-900">{filteredClientes.length}</span> clientes listados
        </div>
      </div>

      {/* Tabela Vertical de Clientes e Contatos */}
      {loading ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100/80 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Nenhum cliente cadastrado com os critérios.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider divide-x divide-slate-100">
                  <th className="py-4 px-4 w-14 text-center">#</th>
                  <th className="py-4 px-6 w-1/4">Cliente</th>
                  <th className="py-4 px-6 whitespace-nowrap">WhatsApp & Telefone</th>
                  <th className="py-4 px-6">Endereço de Instalação</th>
                  <th className="py-4 px-5 text-center whitespace-nowrap">Histórico</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClientes.map((cliente, index) => {
                  const cleanPhone = cliente.telefone.replace(/\D/g, '');
                  const pedidosCount = cliente.pedidos?.length || 0;
                  const activeOrdersCount = cliente.pedidos?.filter(
                    (p) => p.status === 'agendado' || p.status === 'em_andamento'
                  ).length || 0;

                  return (
                    <tr
                      key={cliente.id}
                      className="hover:bg-blue-50/30 transition-colors group divide-x divide-slate-100"
                    >
                      {/* Número vertical # */}
                      <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </td>

                      {/* Cliente (Nome + Iniciais + Email) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-blue-100/80 text-blue-800 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {cliente.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => handleOpenClientOrders(cliente)}
                              className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                              title="Clique para ver pedidos deste cliente"
                            >
                              {cliente.nome}
                            </p>
                            {cliente.email ? (
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {cliente.email}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">Sem e-mail cadastrado</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp & Telefone */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs font-mono">
                            {formatPhone(cliente.telefone)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                            title="Abrir conversa no WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>

                      {/* Endereço de Instalação */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700 font-semibold leading-relaxed line-clamp-2">
                              {cliente.endereco}
                            </p>
                          </div>
                          {cliente.endereco && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                cliente.endereco
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                              title="Ver endereço no Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Histórico de Pedidos */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenClientOrders(cliente)}
                          className="inline-flex flex-col items-center justify-center cursor-pointer group/btn"
                        >
                          <span className="font-extrabold text-xs text-slate-900 group-hover/btn:text-blue-600">
                            {pedidosCount} {pedidosCount === 1 ? 'pedido' : 'pedidos'}
                          </span>
                          {activeOrdersCount > 0 ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-0.5">
                              {activeOrdersCount} em andamento
                            </span>
                          ) : pedidosCount > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                              Concluídos
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Nenhum</span>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenClientOrders(cliente)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl transition-all cursor-pointer shadow-xs"
                          title="Ver histórico de pedidos do cliente"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver Pedidos</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé Informativo */}
          <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando <b>{filteredClientes.length}</b> {filteredClientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
            </span>
            <span className="text-[11px] text-slate-400">
              Clique em "Ver Pedidos" para acessar o histórico detalhado
            </span>
          </div>
        </div>
      )}

      {/* Modal Ver Pedidos do Cliente */}
      {selectedClientForOrders && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Histórico de Pedidos • {selectedClientForOrders.nome}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatPhone(selectedClientForOrders.telefone)} • {selectedClientForOrders.endereco}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClientForOrders(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[480px] overflow-y-auto space-y-4">
                {loadingClientOrders ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    Carregando pedidos...
                  </div>
                ) : clientOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold text-slate-600">Nenhum pedido encontrado para este cliente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientOrders.map((pedido) => {
                      const st = STATUS_CONFIG[pedido.status];
                      return (
                        <div
                          key={pedido.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/30 transition-all space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {formatOrderCode(pedido)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}
                              >
                                {st.label}
                              </span>
                            </div>
                            <span className="text-sm font-extrabold text-slate-900">
                              {formatCurrency(pedido.valor_total)}
                            </span>
                          </div>

                          {pedido.itens && pedido.itens.length > 0 && (
                            <div className="text-xs text-slate-600 divide-y divide-slate-100 bg-white p-2.5 rounded-xl border border-slate-200/60">
                              {pedido.itens.map((it) => (
                                <div key={it.id} className="py-1 flex justify-between">
                                  <span>{it.quantidade}x {it.produto?.nome || 'Produto'}</span>
                                  <span className="font-bold text-slate-900">{formatCurrency(it.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Criado em {formatDateTime(pedido.created_at)}</span>
                            {pedido.tecnico?.nome && (
                              <span className="text-slate-600 font-medium">Técnico: {pedido.tecnico.nome}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Cadastro de Novo Cliente */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Cadastrar Novo Cliente
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marina Costa"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telefone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 81999998888 (com DDD)"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="marina@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Endereço da Instalação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, Número, Bairro, Cidade"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
