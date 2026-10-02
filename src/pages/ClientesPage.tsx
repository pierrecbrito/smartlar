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
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Pedido } from '../types/database';
import { formatPhone, formatDateTime, formatCurrency, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Cadastro
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Ver Pedidos do Cliente (Exigência específica da Tela 2)
  const [selectedClientForOrders, setSelectedClientForOrders] = useState<Cliente | null>(null);
  const [clientOrders, setClientOrders] = useState<Pedido[]>([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
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
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos (com DDD).');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: nome.trim(),
          telefone: cleanPhone,
          email: email.trim() || null,
          endereco: endereco.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      setClientes((prev) => [...prev, data]);
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Base de clientes e endereços de instalação cadastrados (clique para ver os pedidos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone, email ou endereço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Tabela / Cards de Clientes */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => handleOpenClientOrders(cliente)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {cliente.nome}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Pedidos ➔
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{formatPhone(cliente.telefone)}</span>
                  </p>
                  {cliente.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cliente.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-2 pt-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{cliente.endereco}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cadastrado em {formatDateTime(cliente.created_at)}</span>
                <span className="text-blue-600 font-semibold group-hover:underline">Histórico</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL VER PEDIDOS DO CLIENTE (Tela 2) */}
      {selectedClientForOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Pedidos de {selectedClientForOrders.nome}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatPhone(selectedClientForOrders.telefone)} • {selectedClientForOrders.endereco}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForOrders(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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
                  <p className="text-xs font-semibold">Nenhum pedido encontrado para este cliente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientOrders.map((pedido) => {
                    const st = STATUS_CONFIG[pedido.status];
                    return (
                      <div
                        key={pedido.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              #{pedido.id.slice(0, 8)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <span className="text-sm font-extrabold text-emerald-700">
                            {formatCurrency(pedido.valor_total)}
                          </span>
                        </div>

                        {/* Itens */}
                        {pedido.itens && pedido.itens.length > 0 && (
                          <div className="text-xs text-slate-600 divide-y divide-slate-100 bg-white p-2 rounded-lg border border-slate-100">
                            {pedido.itens.map((it) => (
                              <div key={it.id} className="py-1 flex justify-between">
                                <span>{it.quantidade}x {it.produto?.nome || 'Produto'}</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(it.subtotal)}</span>
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
      )}

      {/* Modal Cadastro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone (10 a 13 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 81999998888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço da Instalação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua, Número, Bairro, Cidade"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
