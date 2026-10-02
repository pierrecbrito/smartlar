import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Search,
  CheckCircle2,
  FileText,
  ArrowRight,
  Package,
  X,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Produto } from '../types/database';
import { formatCurrency, formatPhone } from '../lib/utils';
import { useToast } from '../components/Toast';

interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface NovoPedidoPageProps {
  onNavigate: (tab: any) => void;
}

export const NovoPedidoPage: React.FC<NovoPedidoPageProps> = ({ onNavigate }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal Novo Cliente
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientTelefone, setNewClientTelefone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientEndereco, setNewClientEndereco] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  // Busca e filtro de produtos
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');

  // Modal de sucesso pós-criação
  const [createdOrderSummary, setCreatedOrderSummary] = useState<{
    id: string;
    valor_total: number;
    clienteNome: string;
    itensCount: number;
  } | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoadingInitial(true);
    try {
      const [clientesRes, produtosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('produtos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (produtosRes.error) throw produtosRes.error;

      setClientes(clientesRes.data || []);
      setProdutos(produtosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast('error', 'Falha ao carregar dados', err.message);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria));
    return ['todas', ...Array.from(cats)];
  }, [produtos]);

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(productSearch.toLowerCase()));
      const matchCat = selectedCategoria === 'todas' || p.categoria === selectedCategoria;
      return matchSearch && matchCat;
    });
  }, [produtos, productSearch, selectedCategoria]);

  const addToCart = (produto: Produto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.produto.id === produto.id);
      if (existing) {
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const updateQuantity = (produtoId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.produto.id === produtoId) {
            const newQtd = item.quantidade + delta;
            return newQtd > 0 ? { ...item, quantidade: newQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (produtoId: string) => {
    setCart((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const totalCalculadoAoVivo = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantidade * item.produto.preco_unitario, 0);
  }, [cart]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const cleanPhone = newClientTelefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos.');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: newClientNome.trim(),
          telefone: cleanPhone,
          email: newClientEmail.trim() || null,
          endereco: newClientEndereco.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      setClientes((prev) => [...prev, data]);
      setSelectedClienteId(data.id);
      setIsNewClientModalOpen(false);
      setNewClientNome('');
      setNewClientTelefone('');
      setNewClientEmail('');
      setNewClientEndereco('');
    } catch (err: any) {
      console.error('Erro ao cadastrar cliente:', err);
      showToast('error', 'Falha ao salvar cliente', err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedClienteId) {
      showToast('warning', 'Selecione um cliente', 'É obrigatório vincular o pedido a um cliente.');
      return;
    }

    if (cart.length === 0) {
      showToast('warning', 'Adicione itens', 'O pedido precisa ter ao menos um produto adicionado.');
      return;
    }

    setSubmitting(true);
    try {
      const p_itens = cart.map((item) => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
      }));

      const { data: newOrderId, error: rpcError } = await supabase.rpc('criar_pedido', {
        p_cliente_id: selectedClienteId,
        p_observacoes: observacoes.trim() || null,
        p_itens: p_itens,
      });

      if (rpcError) throw rpcError;

      const { data: pedidoCriado, error: fetchError } = await supabase
        .from('pedidos')
        .select('id, valor_total, cliente:clientes(nome)')
        .eq('id', newOrderId)
        .single();

      if (fetchError) throw fetchError;

      const clienteNome = (pedidoCriado as any)?.cliente?.nome || 'Cliente';
      const valorTotalBanco = pedidoCriado.valor_total;

      showToast(
        'success',
        'Orçamento criado com sucesso!',
        `Pedido #${newOrderId.slice(0, 8)} gravado com valor de ${formatCurrency(valorTotalBanco)}.`
      );

      setCreatedOrderSummary({
        id: newOrderId,
        valor_total: valorTotalBanco,
        clienteNome,
        itensCount: cart.length,
      });

      setCart([]);
      setObservacoes('');
    } catch (err: any) {
      console.error('Erro ao criar pedido via RPC:', err);
      showToast('error', 'Erro do Banco de Dados', err.message || 'Falha ao registrar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            PEDIDO ATÔMICO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Novo Pedido (Orçamento)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Procedure transacional <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-indigo-300 font-mono text-xs">criar_pedido</code> com snapshot de preço
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Cliente e Catálogo (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seleção de Cliente */}
          <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                1. Selecione o Cliente
              </label>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Cadastrar Novo
              </button>
            </div>

            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 text-slate-200 transition-all"
            >
              <option value="" className="bg-[#121622] text-slate-400">
                -- Selecione um cliente cadastrado --
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#121622] text-white">
                  {c.nome} • {formatPhone(c.telefone)} • {c.endereco}
                </option>
              ))}
            </select>
          </div>

          {/* Catálogo de Produtos */}
          <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                2. Adicionar Produtos
              </label>

              {/* Categorias */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoria(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      selectedCategoria === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Busca */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou especificação técnica..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Grid de Produtos */}
            {loadingInitial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white/[0.02] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredProdutos.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Nenhum produto encontrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredProdutos.map((p) => {
                  const inCart = cart.find((i) => i.produto.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-white/[0.06] hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-white line-clamp-1">{p.nome}</h4>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 shrink-0">
                            {p.categoria}
                          </span>
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-sm font-extrabold text-indigo-400">
                          {formatCurrency(p.preco_unitario)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            inCart
                              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {inCart ? `${inCart.quantidade} no pedido` : 'Adicionar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Carrinho / Resumo (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Resumo da Proposta</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Lista dos Itens */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium text-slate-400">Nenhum equipamento adicionado.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Selecione produtos ao lado para compor o orçamento.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] max-h-[300px] overflow-y-auto my-3 pr-1">
                  {cart.map((item) => (
                    <div key={item.produto.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-white truncate">
                          {item.produto.nome}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {formatCurrency(item.produto.preco_unitario)} unitário
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.produto.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-extrabold text-white">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.produto.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 w-20">
                        <span className="text-xs font-bold text-white block">
                          {formatCurrency(item.quantidade * item.produto.preco_unitario)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.produto.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Observações */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Observações para a Instalação
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levar escada grande, muro alto, falar com o síndico..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Total e Submissão */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Total do Orçamento
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cálculo atômico no PostgreSQL
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-indigo-400 tracking-tight">
                    {formatCurrency(totalCalculadoAoVivo)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0 || !selectedClienteId}
                className="w-full py-3 px-4 bg-[#e0e7ff] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#1e1b4b] font-extrabold rounded-xl text-sm shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Processando via RPC...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Salvar Pedido
                  </>
                )}
              </button>

              {(!selectedClienteId || cart.length === 0) && (
                <p className="text-[11px] text-amber-400 text-center font-medium">
                  {!selectedClienteId
                    ? '⚠️ Selecione um cliente para habilitar o orçamento.'
                    : '⚠️ Adicione produtos para salvar.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cadastro de Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121622] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/[0.12]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silveira"
                  value={newClientNome}
                  onChange={(e) => setNewClientNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 81999998888"
                  value={newClientTelefone}
                  onChange={(e) => setNewClientTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Endereço da Instalação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua, Número, Bairro, Cidade"
                  value={newClientEndereco}
                  onChange={(e) => setNewClientEndereco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  {savingClient ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Sucesso Pós-Criação */}
      {createdOrderSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121622] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/[0.12] p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Orçamento Registrado no PostgreSQL!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Transação atômica concluída via procedure <code className="font-mono text-indigo-300">criar_pedido</code>
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono font-bold text-white">{createdOrderSummary.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold text-white">{createdOrderSummary.clienteNome}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.08] text-sm">
                <span className="font-bold text-slate-300">Total Gravado pelo Banco:</span>
                <span className="font-extrabold text-emerald-400">
                  {formatCurrency(createdOrderSummary.valor_total)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreatedOrderSummary(null)}
                className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Criar Outro
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedOrderSummary(null);
                  onNavigate('pedidos');
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Gerenciar Pedidos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
