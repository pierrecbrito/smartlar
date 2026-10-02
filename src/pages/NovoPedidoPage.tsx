import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Package,
  X
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
      console.error('Erro ao carregar dados para novo pedido:', err);
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

  // Cadastrar Cliente Rápido inline
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const cleanPhone = newClientTelefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos (com DDD).');
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

  // Submissão do Pedido via RPC criar_pedido
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
      // Formata itens para a RPC: [{ produto_id: uuid, quantidade: number }]
      const p_itens = cart.map((item) => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
      }));

      // Chamada da RPC atômica criar_pedido
      const { data: newOrderId, error: rpcError } = await supabase.rpc('criar_pedido', {
        p_cliente_id: selectedClienteId,
        p_observacoes: observacoes.trim() || null,
        p_itens: p_itens,
      });

      if (rpcError) throw rpcError;

      // CONFERÊNCIA CRÍTICA: Ler o pedido do banco para pegar o valor_total calculado pela trigger!
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

      // Exibe modal de resumo
      setCreatedOrderSummary({
        id: newOrderId,
        valor_total: valorTotalBanco,
        clienteNome,
        itensCount: cart.length,
      });

      // Limpa formulário
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Novo Pedido (Orçamento)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gera pedido atômico via procedure <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">criar_pedido</code> com snapshot de preço
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Cliente e Catálogo de Produtos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seleção do Cliente */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                1. Selecione o Cliente
              </label>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Cadastrar Novo Cliente
              </button>
            </div>

            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            >
              <option value="">-- Escolha um cliente existente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} • {formatPhone(c.telefone)} • {c.endereco}
                </option>
              ))}
            </select>
          </div>

          {/* Catálogo de Produtos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                2. Adicionar Produtos ao Pedido
              </label>

              {/* Filtro por Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoria(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      selectedCategoria === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de Busca de Produto */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto por nome ou descrição..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Grid de Produtos */}
            {loadingInitial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredProdutos.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Nenhum produto encontrado com o filtro atual.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredProdutos.map((p) => {
                  const inCart = cart.find((i) => i.produto.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{p.nome}</h4>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                            {p.categoria}
                          </span>
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-blue-700">
                          {formatCurrency(p.preco_unitario)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            inCart
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {inCart ? `${inCart.quantidade} no carrinho` : 'Adicionar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Carrinho / Linhas do Pedido e Confirmação (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Resumo dos Itens</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Lista dos Itens Selecionados */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Nenhum item adicionado ao orçamento.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Selecione produtos ao lado para compor a venda.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto my-4 pr-1">
                  {cart.map((item) => (
                    <div key={item.produto.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-800 truncate">
                          {item.produto.nome}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(item.produto.preco_unitario)} unitário
                        </p>
                      </div>

                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.produto.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-slate-800">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.produto.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal da linha */}
                      <div className="text-right shrink-0 w-24">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatCurrency(item.quantidade * item.produto.preco_unitario)}
                        </span>
                      </div>

                      {/* Remover */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.produto.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Observações */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observações de Instalação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levar escada grande, muro alto, falar com o porteiro..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Total e Botão de Envio */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Total do Orçamento
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Calculado ao vivo e confirmado pelo banco
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-blue-700 tracking-tight">
                    {formatCurrency(totalCalculadoAoVivo)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0 || !selectedClienteId}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando no Supabase...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Salvar Pedido
                  </>
                )}
              </button>

              {(!selectedClienteId || cart.length === 0) && (
                <p className="text-[11px] text-amber-700 text-center font-medium">
                  {!selectedClienteId
                    ? '⚠️ Selecione um cliente para habilitar o pedido.'
                    : '⚠️ Adicione pelo menos um item para continuar.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NOVO CLIENTE */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silveira"
                  value={newClientNome}
                  onChange={(e) => setNewClientNome(e.target.value)}
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
                  value={newClientTelefone}
                  onChange={(e) => setNewClientTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
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
                  value={newClientEndereco}
                  onChange={(e) => setNewClientEndereco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                >
                  {savingClient ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO PÓS-CRIAÇÃO (COMPROVAÇÃO DE VALOR DO BANCO) */}
      {createdOrderSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Orçamento Registrado com Sucesso!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Transação atômica concluída no PostgreSQL via <code className="font-mono text-blue-700">criar_pedido</code>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ID do Pedido:</span>
                <span className="font-mono font-bold text-slate-800">{createdOrderSummary.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{createdOrderSummary.clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Itens Agrupados:</span>
                <span className="font-bold text-slate-800">{createdOrderSummary.itensCount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-700">Valor Total (Trigger do Banco):</span>
                <span className="font-extrabold text-emerald-700">
                  {formatCurrency(createdOrderSummary.valor_total)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreatedOrderSummary(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Criar Outro Pedido
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedOrderSummary(null);
                  onNavigate('pedidos');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Gerenciar Pedido
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
