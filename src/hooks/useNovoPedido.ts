import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Produto, TipoPagamento, Pedido, ItemPedido } from '../types/database';
import { formatCurrency, formatOrderCode } from '../lib/utils';
import { maskCep, buscarCep, formatarEnderecoCompleto } from '../lib/cep';
import { useToast } from '../components/Toast';

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

/** Estado e regras do fluxo "Novo Pedido" (catÃ¡logo, carrinho, cliente e envio). */
export const useNovoPedido = () => {
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

  // Combobox pesquisável para adicionar produtos diretamente ao orçamento
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [productSelectSearch, setProductSelectSearch] = useState('');
  const productSelectRef = useRef<HTMLDivElement>(null);

  // Modal Novo Cliente
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientTelefone, setNewClientTelefone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Endereço Estruturado do Novo Cliente
  const [newClientCep, setNewClientCep] = useState('');
  const [newClientLogradouro, setNewClientLogradouro] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [newClientComplemento, setNewClientComplemento] = useState('');
  const [newClientBairro, setNewClientBairro] = useState('');
  const [newClientCidade, setNewClientCidade] = useState('Recife');
  const [newClientEstado, setNewClientEstado] = useState('PE');
  const [newClientPontoReferencia, setNewClientPontoReferencia] = useState('');
  const [loadingClientCep, setLoadingClientCep] = useState(false);
  const newClientNumeroRef = useRef<HTMLInputElement>(null);

  const [savingClient, setSavingClient] = useState(false);

  // Busca e filtro por categoria
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');

  // Modal de proposta comercial em PDF pós-criação
  const [createdOrderPdfData, setCreatedOrderPdfData] = useState<{
    pedido: Pedido;
    cliente: Cliente;
    itens: (ItemPedido & { produto?: Produto })[];
    descontoPercentual: number;
    observacoes: string;
    formaPagamento: string;
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
      if (productSelectRef.current && !productSelectRef.current.contains(e.target as Node)) {
        setIsProductSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSelectProdutos = useMemo(() => {
    if (!productSelectSearch.trim()) return produtos.slice(0, 10);
    const term = productSelectSearch.toLowerCase().trim();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        (p.descricao && p.descricao.toLowerCase().includes(term))
    );
  }, [produtos, productSelectSearch]);

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

  const handleNewClientCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCep(raw);
    setNewClientCep(masked);

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingClientCep(true);
      try {
        const info = await buscarCep(clean);
        if (info && !info.erro) {
          if (info.logradouro) setNewClientLogradouro(info.logradouro);
          if (info.bairro) setNewClientBairro(info.bairro);
          if (info.localidade) setNewClientCidade(info.localidade);
          if (info.uf) setNewClientEstado(info.uf);
          showToast('info', 'Endereço localizado via CEP', `${info.logradouro || ''}, ${info.bairro || ''}`);
          setTimeout(() => {
            newClientNumeroRef.current?.focus();
          }, 100);
        } else {
          showToast('warning', 'CEP não encontrado', 'Preencha o logradouro e bairro manualmente.');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setLoadingClientCep(false);
      }
    }
  };

  const resetNewClientForm = () => {
    setNewClientNome('');
    setNewClientTelefone('');
    setNewClientEmail('');
    setNewClientCep('');
    setNewClientLogradouro('');
    setNewClientNumero('');
    setNewClientComplemento('');
    setNewClientBairro('');
    setNewClientCidade('Recife');
    setNewClientEstado('PE');
    setNewClientPontoReferencia('');
  };

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

      const enderecoCompleto = formatarEnderecoCompleto({
        cep: newClientCep.trim(),
        logradouro: newClientLogradouro.trim(),
        numero: newClientNumero.trim(),
        complemento: newClientComplemento.trim(),
        bairro: newClientBairro.trim(),
        cidade: newClientCidade.trim(),
        estado: newClientEstado.trim(),
      });

      if (!enderecoCompleto) {
        throw new Error('Informe o logradouro e número da instalação.');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: newClientNome.trim(),
          telefone: cleanPhone,
          email: newClientEmail.trim() || null,
          endereco: enderecoCompleto,
          cep: newClientCep.trim() || null,
          logradouro: newClientLogradouro.trim() || null,
          numero: newClientNumero.trim() || null,
          complemento: newClientComplemento.trim() || null,
          bairro: newClientBairro.trim() || null,
          cidade: newClientCidade.trim() || 'Recife',
          estado: newClientEstado.trim() || 'PE',
          ponto_referencia: newClientPontoReferencia.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Cliente cadastrado com sucesso!');
      setClientes((prev) => [...prev, data]);
      setSelectedClienteId(data.id);
      setIsClientDropdownOpen(false);
      setIsNewClientModalOpen(false);
      resetNewClientForm();
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

      const clienteObj = clientes.find((c) => c.id === selectedClienteId) || {
        id: selectedClienteId,
        nome: clienteNome,
        telefone: '',
        email: null,
        endereco: '',
        created_at: new Date().toISOString(),
      };

      const itensMapeados: (ItemPedido & { produto?: Produto })[] = cart.map((item, idx) => ({
        id: `item-${idx}`,
        pedido_id: newOrderId,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco_unitario,
        subtotal: item.quantidade * item.produto.preco_unitario,
        created_at: new Date().toISOString(),
        produto: item.produto,
      }));

      setCreatedOrderPdfData({
        pedido: {
          id: newOrderId,
          numero_pedido: numeroPedido,
          cliente_id: selectedClienteId,
          tecnico_id: null,
          status: 'orcamento',
          data_instalacao: null,
          valor_total: valorTotalFinal,
          forma_pagamento: formaPagamento,
          observacoes: finalObs || null,
          concluido_em: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        cliente: clienteObj,
        itens: itensMapeados,
        descontoPercentual,
        observacoes: finalObs,
        formaPagamento,
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

  return {
    clientes,
    setClientes,
    produtos,
    setProdutos,
    selectedClienteId,
    setSelectedClienteId,
    cart,
    setCart,
    observacoes,
    setObservacoes,
    descontoPercentual,
    setDescontoPercentual,
    formaPagamento,
    setFormaPagamento,
    loadingInitial,
    setLoadingInitial,
    submitting,
    setSubmitting,
    detalhesMode,
    setDetalhesMode,
    isClientDropdownOpen,
    setIsClientDropdownOpen,
    clientSearchTerm,
    setClientSearchTerm,
    clientDropdownRef,
    isProductSelectOpen,
    setIsProductSelectOpen,
    productSelectSearch,
    setProductSelectSearch,
    productSelectRef,
    isNewClientModalOpen,
    setIsNewClientModalOpen,
    newClientNome,
    setNewClientNome,
    newClientTelefone,
    setNewClientTelefone,
    newClientEmail,
    setNewClientEmail,
    newClientCep,
    setNewClientCep,
    newClientLogradouro,
    setNewClientLogradouro,
    newClientNumero,
    setNewClientNumero,
    newClientComplemento,
    setNewClientComplemento,
    newClientBairro,
    setNewClientBairro,
    newClientCidade,
    setNewClientCidade,
    newClientEstado,
    setNewClientEstado,
    newClientPontoReferencia,
    setNewClientPontoReferencia,
    loadingClientCep,
    setLoadingClientCep,
    newClientNumeroRef,
    savingClient,
    setSavingClient,
    productSearch,
    setProductSearch,
    selectedCategoria,
    setSelectedCategoria,
    createdOrderPdfData,
    setCreatedOrderPdfData,
    showToast,
    loadData,
    categorias,
    filteredProdutos,
    selectedCliente,
    addToCart,
    updateQuantity,
    removeFromCart,
    filteredSelectProdutos,
    filteredClientes,
    subtotalItens,
    valorDesconto,
    totalCalculadoAoVivo,
    handleNewClientCepChange,
    resetNewClientForm,
    handleCreateNewClient,
    handleOpenConfirmation,
    handleSubmitOrder,
  };
};

export type NovoPedidoState = ReturnType<typeof useNovoPedido>;