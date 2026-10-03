import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  ArrowRight,
  ArrowLeft,
  MapPin,
  Percent,
  ChevronDown,
  Check,
  CreditCard,
  ClipboardCheck,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Produto, TipoPagamento } from '../types/database';
import { formatCurrency, formatPhone, formatOrderCode, maskPhone } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ModalPortal } from '../components/ModalPortal';

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
  const [descontoPercentual, setDescontoPercentual] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<TipoPagamento>('pix');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modo do painel Detalhes: 'edicao' (carrinho) ou 'confirmacao' (revisão no container)
  const [detalhesMode, setDetalhesMode] = useState<'edicao' | 'confirmacao'>('edicao');

  // Combobox pesquisável de clientes
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

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
    numero_pedido?: number;
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClientes = useMemo(() => {
    if (!clientSearchTerm.trim()) return clientes;
    const term = clientSearchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.telefone.includes(term) ||
        (c.endereco && c.endereco.toLowerCase().includes(term))
    );
  }, [clientes, clientSearchTerm]);

  const subtotalItens = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.produto.preco_unitario * item.quantidade, 0);
  }, [cart]);

  const valorDesconto = useMemo(() => {
    if (!descontoPercentual || descontoPercentual <= 0) return 0;
    const clamped = Math.min(100, Math.max(0, Number(descontoPercentual)));
    return (subtotalItens * clamped) / 100;
  }, [subtotalItens, descontoPercentual]);

  const totalCalculadoAoVivo = useMemo(() => {
    return Math.max(0, subtotalItens - valorDesconto);
  }, [subtotalItens, valorDesconto]);

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const cleanPhone = newClientTelefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('O telefone deve ter entre 10 e 13 dígitos numéricos.');
      }

      if (newClientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientEmail.trim())) {
        throw new Error('Por favor, informe um endereço de e-mail válido.');
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
      setIsClientDropdownOpen(false);
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

  const handleOpenConfirmation = () => {
    if (!selectedClienteId) {
      showToast('warning', 'Selecione um cliente', 'É obrigatório vincular o pedido a um cliente antes de prosseguir.');
      return;
    }

    if (cart.length === 0) {
      showToast('warning', 'Adicione itens', 'O pedido precisa ter ao menos um produto no carrinho.');
      return;
    }

    setDetalhesMode('confirmacao');
  };

  const handleSubmitOrder = async () => {
    if (!selectedClienteId || cart.length === 0) {
      handleOpenConfirmation();
      return;
    }

    setSubmitting(true);
    try {
      const p_itens = cart.map((item) => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
      }));

      let finalObs = observacoes.trim();
      if (descontoPercentual > 0) {
        const descTexto = `[Desconto Aplicado: ${descontoPercentual}% (-${formatCurrency(valorDesconto)})]`;
        finalObs = finalObs ? `${descTexto} ${finalObs}` : descTexto;
      }

      const { data: newOrderId, error: rpcError } = await supabase.rpc('criar_pedido', {
        p_cliente_id: selectedClienteId,
        p_observacoes: finalObs || null,
        p_itens: p_itens,
      });

      if (rpcError) throw rpcError;

      // Se houver desconto ou forma de pagamento selecionada, atualizamos o pedido no banco
      const updates: any = {};
      if (descontoPercentual > 0) {
        updates.valor_total = totalCalculadoAoVivo;
      }
      if (formaPagamento) {
        updates.forma_pagamento = formaPagamento;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('pedidos')
          .update(updates)
          .eq('id', newOrderId);

        if (updateError) {
          console.warn('Aviso ao persistir desconto/pagamento:', updateError);
        }
      }

      const { data: pedidoCriado, error: fetchError } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, valor_total, cliente:clientes(nome)')
        .eq('id', newOrderId)
        .single();

      if (fetchError) throw fetchError;

      const clienteNome = (pedidoCriado as any)?.cliente?.nome || 'Cliente';
      const valorTotalFinal = pedidoCriado.valor_total;
      const numeroPedido = (pedidoCriado as any)?.numero_pedido;

      showToast(
        'success',
        'Orçamento criado com sucesso!',
        `Pedido ${formatOrderCode({ id: newOrderId, numero_pedido: numeroPedido })} gravado com valor de ${formatCurrency(valorTotalFinal)}.`
      );

      setCreatedOrderSummary({
        id: newOrderId,
        numero_pedido: numeroPedido,
        valor_total: valorTotalFinal,
        clienteNome,
        itensCount: cart.length,
      });

      setDetalhesMode('edicao');
      setCart([]);
      setObservacoes('');
      setDescontoPercentual(0);
    } catch (err: any) {
      console.error('Erro ao criar pedido via RPC:', err);
      showToast('error', 'Falha ao registrar pedido', err.message || 'Não foi possível salvar o pedido.');
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

          {/* Tabela Vertical de Produtos (Sem imagens, com colunas verticais e alta legibilidade) */}
          {loadingInitial ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 bg-slate-100/80 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">Nenhum equipamento encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider divide-x divide-slate-100">
                      <th className="py-4 px-4 w-14 text-center">#</th>
                      <th className="py-4 px-6">Produto / Equipamento</th>
                      <th className="py-4 px-4 whitespace-nowrap">Categoria</th>
                      <th className="py-4 px-5 text-right whitespace-nowrap">Preço Unitário</th>
                      <th className="py-4 px-6 text-center whitespace-nowrap w-44">Adicionar ao Pedido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProdutos.map((produto, index) => {
                      const inCartItem = cart.find((i) => i.produto.id === produto.id);

                      return (
                        <tr
                          key={produto.id}
                          className={`hover:bg-blue-50/30 transition-colors group divide-x divide-slate-100 ${
                            inCartItem ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {/* Número vertical # */}
                          <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </td>

                          {/* Nome e Descrição (Sem imagem) */}
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {produto.nome}
                            </p>
                            {produto.descricao ? (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                                {produto.descricao}
                              </p>
                            ) : null}
                          </td>

                          {/* Categoria */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                              {produto.categoria}
                            </span>
                          </td>

                          {/* Preço Unitário */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 text-sm block">
                              {formatCurrency(produto.preco_unitario)}
                            </span>
                          </td>

                          {/* Ação: Botão "+ Adicionar" OU Stepper Azul Escuro "[- 1 +]" */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {!inCartItem ? (
                              <button
                                type="button"
                                onClick={() => addToCart(produto)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-full p-1 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(produto.id, -1)}
                                  className="w-6 h-6 rounded-full hover:bg-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Diminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-extrabold text-xs px-2.5 min-w-5 text-center">
                                  {inCartItem.quantidade}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(produto.id, 1)}
                                  className="w-6 h-6 rounded-full hover:bg-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
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
                  Mostrando <b>{filteredProdutos.length}</b> {filteredProdutos.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Clique em "+ Adicionar" para incluir no pedido
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* LADO DIREITO: Painel "Detalhes do Pedido" (4 Colunas)         */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[640px]">
            {detalhesMode === 'edicao' ? (
              /* ============================================================== */
              /* FASE 1: EDIÇÃO DO CARRINHO E SELEÇÃO DE CLIENTE               */
              /* ============================================================== */
              <>
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

                  {/* Lista dos Itens do Pedido */}
                  <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto pr-1 my-3">
                    {cart.length === 0 ? (
                      <div className="py-14 text-center text-slate-400">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-25" />
                        <p className="text-xs font-semibold text-slate-600">Seu pedido está vazio</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Clique em "+ Adicionar" na tabela para incluir itens
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => {
                        return (
                          <div key={item.produto.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-slate-900 truncate">
                                {item.produto.nome}
                              </h5>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {formatCurrency(item.produto.preco_unitario)}
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

                {/* Rodapé Financeiro e Botão Avançar para Confirmação */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Seletor de Cliente Pesquisável (Combobox) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Cliente & Local *
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsNewClientModalOpen(true)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Novo Cliente
                      </button>
                    </div>

                    <div className="relative" ref={clientDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClientDropdownOpen(!isClientDropdownOpen);
                          setClientSearchTerm('');
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                            {selectedCliente ? selectedCliente.nome.slice(0, 2).toUpperCase() : <User className="w-4 h-4 text-blue-700" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {selectedCliente ? selectedCliente.nome : 'Selecione ou busque um cliente...'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {selectedCliente ? formatPhone(selectedCliente.telefone) : 'Clique para pesquisar na base'}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isClientDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                      </button>

                      {/* Popover Dropdown Pesquisável */}
                      {isClientDropdownOpen && (
                        <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-2 animate-fade-in">
                          {/* Campo de Busca */}
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              autoFocus
                              value={clientSearchTerm}
                              onChange={(e) => setClientSearchTerm(e.target.value)}
                              placeholder="Buscar por nome, fone ou endereço..."
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                            />
                            {clientSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setClientSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Lista de Clientes */}
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                            {filteredClientes.length === 0 ? (
                              <div className="py-6 text-center text-xs text-slate-400">
                                Nenhum cliente encontrado.
                              </div>
                            ) : (
                              filteredClientes.map((c) => {
                                const isSelected = c.id === selectedClienteId;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedClienteId(c.id);
                                      setIsClientDropdownOpen(false);
                                    }}
                                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-100'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold truncate">{c.nome}</span>
                                        <span className="text-[10px] text-slate-400">({formatPhone(c.telefone)})</span>
                                      </div>
                                      {c.endereco && (
                                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                          {c.endereco}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>

                          {/* Link Cadastrar */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsClientDropdownOpen(false);
                              setIsNewClientModalOpen(true);
                            }}
                            className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-xl text-xs font-bold text-center border border-dashed border-slate-200 hover:border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Cadastrar Novo Cliente
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card de Endereço de Instalação (Destaque conforme solicitado) */}
                    {selectedCliente && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-100/90 rounded-2xl text-xs flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
                            Endereço de Instalação
                          </span>
                          <p className="text-slate-700 font-semibold text-xs leading-snug mt-0.5">
                            {selectedCliente.endereco || 'Endereço não cadastrado'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observações da Instalação */}
                  <div>
                    <input
                      type="text"
                      placeholder="Observação (ex: portão antigo, escada...)"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Desconto Comercial por Porcentagem */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        Desconto Comercial (%)
                      </span>
                      {descontoPercentual > 0 && (
                        <span className="text-[11px] font-extrabold text-emerald-600">
                          - {formatCurrency(valorDesconto)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={descontoPercentual === 0 ? '' : descontoPercentual}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.min(50, Math.max(0, Number(e.target.value)));
                            setDescontoPercentual(val);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 pr-7"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>

                      {/* Preset Pills */}
                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDescontoPercentual(pct)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              descontoPercentual === pct
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {descontoPercentual > 20 && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5 animate-fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Desconto de <b>{descontoPercentual}%</b>: Concessões acima de 20% exigem alinhamento e autorização gerencial.</span>
                      </div>
                    )}
                  </div>

                  {/* Linhas de Valores (Subtotal, Desconto, Instalação, Total) */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal Itens</span>
                      <span className="font-bold text-slate-900">{formatCurrency(subtotalItens)}</span>
                    </div>
                    {descontoPercentual > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Desconto ({descontoPercentual}%)</span>
                        <span>- {formatCurrency(valorDesconto)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Instalação Padrão</span>
                      <span className="text-emerald-600 font-semibold">Inclusa</span>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-200 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-slate-900">Total</span>
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatCurrency(totalCalculadoAoVivo)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Ação "Avançar para Confirmação" */}
                  <button
                    type="button"
                    onClick={handleOpenConfirmation}
                    disabled={submitting || cart.length === 0 || !selectedClienteId}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Avançar para Confirmação</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* ============================================================== */
              /* FASE 2: CONFIRMAÇÃO DIRETO NO CONTAINER (SEM POPUP)           */
              /* ============================================================== */
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Header de Confirmação */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetalhesMode('edicao')}
                      className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      title="Voltar e editar"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                        Revisão Final
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                        Confirmação do Pedido
                      </h3>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Fase 2 de 2
                  </span>
                </div>

                {/* Conteúdo com Scroll da Confirmação */}
                <div className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 text-xs">
                  {/* 1. Cliente & Endereço de Instalação (Destaque Principal) */}
                  <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      1. Cliente & Local de Instalação
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedCliente?.nome}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        WhatsApp: {selectedCliente ? formatPhone(selectedCliente.telefone) : '-'}
                      </p>
                    </div>

                    {/* Card de Endereço em Destaque */}
                    <div className="bg-blue-50/90 border border-blue-200/90 rounded-xl p-2.5 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                          Endereço Completo de Instalação *
                        </span>
                        <p className="font-bold text-slate-900 text-xs mt-0.5 leading-snug">
                          {selectedCliente?.endereco || 'Endereço não informado!'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Itens Selecionados */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        2. Itens Selecionados ({cart.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetalhesMode('edicao')}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Editar itens
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-2.5 max-h-36 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.produto.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-slate-800 truncate">{item.produto.nome}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.quantidade}x a {formatCurrency(item.produto.preco_unitario)}
                            </p>
                          </div>
                          <span className="font-extrabold text-slate-900 shrink-0">
                            {formatCurrency(item.produto.preco_unitario * item.quantidade)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Forma de Pagamento & Observações */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        Forma de Pagamento Pretendida
                      </label>
                      <select
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value as TipoPagamento)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="pix">PIX (À vista)</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        Observações da Instalação
                      </label>
                      <input
                        type="text"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Instruções para o técnico..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 4. Desconto Comercial (%) & Resumo Financeiro */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        Desconto Comercial (%)
                      </span>
                      {descontoPercentual > 0 && (
                        <span className="text-xs font-extrabold text-emerald-600">
                          - {formatCurrency(valorDesconto)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={descontoPercentual === 0 ? '' : descontoPercentual}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value)));
                            setDescontoPercentual(val);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 pr-7"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDescontoPercentual(pct)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              descontoPercentual === pct
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <div className="flex justify-between">
                        <span>Subtotal Itens</span>
                        <span className="font-bold text-slate-900">{formatCurrency(subtotalItens)}</span>
                      </div>
                      {descontoPercentual > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Desconto ({descontoPercentual}%)</span>
                          <span>- {formatCurrency(valorDesconto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Instalação Padrão</span>
                        <span className="text-emerald-600 font-semibold">Inclusa</span>
                      </div>

                      <div className="pt-2 border-t border-dashed border-slate-200 flex items-baseline justify-between">
                        <span className="text-base font-extrabold text-slate-900">Total a Faturar</span>
                        <span className="text-2xl font-extrabold text-blue-700">
                          {formatCurrency(totalCalculadoAoVivo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações dentro do Container */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetalhesMode('edicao')}
                    className="py-3 px-3.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Gravando Pedido...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar e Gerar Pedido</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cadastro Rápido de Cliente */}
      {isNewClientModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
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
                    type="tel"
                    required
                    placeholder="(81) 99999-8888"
                    value={newClientTelefone}
                    onChange={(e) => setNewClientTelefone(maskPhone(e.target.value))}
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
        </ModalPortal>
      )}

      {/* Modal Sucesso com Resumo da Operação Atômica */}
      {createdOrderSummary && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Orçamento Salvo com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  O pedido foi gerado e registrado no sistema com sucesso.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Número do Pedido:</span>
                  <span className="font-mono font-bold text-slate-900">{formatOrderCode(createdOrderSummary)}</span>
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
                  <span className="text-slate-900">Valor Total:</span>
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
        </ModalPortal>
      )}
    </div>
  );
};
