import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  User,
  ShoppingBag,
  Shield,
  Lightbulb,
  Cpu,
  Lock,
  Camera,
  Wifi,
  Radio,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Produto } from '../types/database';
import { formatCurrency, formatPhone } from '../lib/utils';
import { getProductImage } from '../lib/productImages';
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

  // Busca e filtro por categoria
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');

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

      // Seleciona o primeiro cliente por padrão para agilizar o fluxo POS
      if (clientesRes.data && clientesRes.data.length > 0 && !selectedClienteId) {
        setSelectedClienteId(clientesRes.data[0].id);
      }
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
    const list = Array.from(new Set(produtos.map((p) => p.categoria)));
    return ['todos', ...list];
  }, [produtos]);

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCat = selectedCategoria === 'todos' || p.categoria === selectedCategoria;
      return matchesSearch && matchesCat;
    });
  }, [produtos, productSearch, selectedCategoria]);

  const selectedCliente = useMemo(() => {
    return clientes.find((c) => c.id === selectedClienteId) || null;
  }, [clientes, selectedClienteId]);

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
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.produto.id === produtoId) {
            const novaQtd = item.quantidade + delta;
            return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (produtoId: string) => {
    setCart((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const totalCalculadoAoVivo = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.produto.preco_unitario * item.quantidade, 0);
  }, [cart]);

  const handleCreateNewClient = async (e: React.FormEvent) => {
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
      console.error('Erro ao salvar cliente:', err);
      showToast('error', 'Falha ao cadastrar cliente', err.message);
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
    <div className="animate-fade-in space-y-6">
      {/* Grid Layout: Lado Esquerdo (Catálogo) + Lado Direito (Detalhes do Pedido) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LADO ESQUERDO: Catálogo de Produtos e Categorias (8 Colunas) */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* Pills de Categorias */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categorias.map((cat) => {
              const isActive = selectedCategoria === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  {cat === 'todos' ? 'Todos os produtos' : cat}
                </button>
              );
            })}
          </div>

          {/* Grid de Cards dos Produtos com Imagens Reais */}
          {loadingInitial ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
              ))}
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">Nenhum equipamento encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProdutos.map((produto) => {
                const inCartItem = cart.find((i) => i.produto.id === produto.id);
                const realImage = getProductImage(produto.nome, produto.categoria);

                return (
                  <div
                    key={produto.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badge: Categoria */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 uppercase">
                          {produto.categoria}
                        </span>
                      </div>

                      {/* Imagem Real do Equipamento */}
                      <div className="my-4 h-36 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative group-hover:shadow-xs transition-all flex items-center justify-center">
                        <img
                          src={realImage}
                          alt={produto.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Título & Preço */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1 leading-snug">
                          {produto.nome}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-base font-extrabold text-slate-900">
                            {formatCurrency(produto.preco_unitario)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(produto.preco_unitario * 1.15)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação: "+ Adicionar ao Pedido" OU Stepper Azul Sólido "[-  1  +]" */}
                    <div className="mt-5">
                      {!inCartItem ? (
                        <button
                          type="button"
                          onClick={() => addToCart(produto)}
                          className="w-full py-2.5 rounded-2xl border border-blue-600 text-blue-600 font-bold hover:bg-blue-50 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar ao Pedido</span>
                        </button>
                      ) : (
                        <div className="w-full py-1.5 px-3 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-between text-xs shadow-xs transition-all">
                          <button
                            type="button"
                            onClick={() => updateQuantity(produto.id, -1)}
                            className="w-7 h-7 rounded-xl hover:bg-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-sm px-2">
                            {inCartItem.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(produto.id, 1)}
                            className="w-7 h-7 rounded-xl hover:bg-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* LADO DIREITO: Painel "Detalhes do Pedido" (4 Colunas)         */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[640px]">
            <div>
              {/* Header do Detalhes do Pedido */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-lg text-slate-900">Detalhes do Pedido</h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Limpar itens"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Lista dos Itens do Pedido com Imagens Reais */}
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1 my-3">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-25" />
                    <p className="text-xs font-semibold text-slate-600">Seu pedido está vazio</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clique em "+ Adicionar ao Pedido" para incluir itens
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemImage = getProductImage(item.produto.nome, item.produto.categoria);
                    return (
                      <div key={item.produto.id} className="py-3 flex items-center justify-between gap-3">
                        {/* Thumbnail com Imagem Real */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                          <img
                            src={itemImage}
                            alt={item.produto.nome}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Detalhes */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {item.produto.nome}
                          </h5>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xs font-extrabold text-slate-900">
                              {formatCurrency(item.produto.preco_unitario)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(item.produto.preco_unitario * 1.15)}
                            </span>
                          </div>

                          {/* Stepper inline compacto [- 1 +] */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.produto.id, -1)}
                              className="text-slate-400 hover:text-slate-800 font-bold px-1 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-extrabold text-slate-800">{item.quantidade}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.produto.id, 1)}
                              className="text-slate-400 hover:text-slate-800 font-bold px-1 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Botão Remover Lixeira */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.produto.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Rodapé Financeiro e Botão Finalizar Pedido */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* Pill Cliente Selecionado */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedCliente ? selectedCliente.nome : 'Nenhum cliente'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedCliente ? formatPhone(selectedCliente.telefone) : 'Selecione abaixo'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={selectedClienteId}
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                    className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2 py-1 focus:outline-none"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                    title="Novo Cliente"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Observações da Instalação */}
              <div>
                <input
                  type="text"
                  placeholder="Observação (ex: portão antigo, escada...)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Linhas de Valores (Subtotal, Instalação, Total) */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalCalculadoAoVivo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instalação Padrão</span>
                  <span className="text-emerald-600 font-semibold">Inclusa</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Snapshot de Preço</span>
                  <span>Protegido no banco</span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200 flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {formatCurrency(totalCalculadoAoVivo)}
                  </span>
                </div>
              </div>

              {/* Botão de Ação "Finalizar Pedido" */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0 || !selectedClienteId}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando via RPC...
                  </>
                ) : (
                  <span>Finalizar Pedido</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cadastro Rápido de Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={newClientNome}
                  onChange={(e) => setNewClientNome(e.target.value)}
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
                  placeholder="Ex: 81999998888"
                  value={newClientTelefone}
                  onChange={(e) => setNewClientTelefone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
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
                  value={newClientEndereco}
                  onChange={(e) => setNewClientEndereco(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingClient ? 'Salvando...' : 'Cadastrar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sucesso com Resumo da Operação Atômica */}
      {createdOrderSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Orçamento Gravado no PostgreSQL!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Operação atômica executada com sucesso via stored procedure <code className="text-blue-700 font-mono">criar_pedido</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Número do Pedido:</span>
                <span className="font-mono font-bold text-slate-900">#{createdOrderSummary.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900">{createdOrderSummary.clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Itens Consolidados:</span>
                <span className="font-bold text-slate-900">{createdOrderSummary.itensCount} produtos</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm">
                <span className="text-slate-900">Valor Total do Banco:</span>
                <span className="text-emerald-600">{formatCurrency(createdOrderSummary.valor_total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreatedOrderSummary(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Novo Orçamento
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedOrderSummary(null);
                  onNavigate('pedidos');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Gerenciar Pedido ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
