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
  Package,
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
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Cliente, Produto, TipoPagamento, Pedido, ItemPedido } from '../../types/database';
import { formatCurrency, formatPhone, formatOrderCode, maskPhone } from '../../lib/utils';
import { maskCep, buscarCep, formatarEnderecoCompleto, formatarEnderecoListagem } from '../../lib/cep';
import { useToast } from '../Toast';
import { ModalPortal } from '../ModalPortal';
import { OrcamentoPdfModal } from '../OrcamentoPdfModal';
import { NovoPedidoState, CartItem } from '../../hooks/useNovoPedido';

interface Props {
  state: NovoPedidoState;
}

export const ProductCatalog: React.FC<Props> = ({ state }) => {
  const { clientes, setClientes, produtos, setProdutos, selectedClienteId, setSelectedClienteId, cart, setCart, observacoes, setObservacoes, descontoPercentual, setDescontoPercentual, formaPagamento, setFormaPagamento, loadingInitial, setLoadingInitial, submitting, setSubmitting, detalhesMode, setDetalhesMode, isClientDropdownOpen, setIsClientDropdownOpen, clientSearchTerm, setClientSearchTerm, clientDropdownRef, isProductSelectOpen, setIsProductSelectOpen, productSelectSearch, setProductSelectSearch, productSelectRef, isNewClientModalOpen, setIsNewClientModalOpen, newClientNome, setNewClientNome, newClientTelefone, setNewClientTelefone, newClientEmail, setNewClientEmail, newClientCep, setNewClientCep, newClientLogradouro, setNewClientLogradouro, newClientNumero, setNewClientNumero, newClientComplemento, setNewClientComplemento, newClientBairro, setNewClientBairro, newClientCidade, setNewClientCidade, newClientEstado, setNewClientEstado, newClientPontoReferencia, setNewClientPontoReferencia, loadingClientCep, setLoadingClientCep, newClientNumeroRef, savingClient, setSavingClient, productSearch, setProductSearch, selectedCategoria, setSelectedCategoria, createdOrderPdfData, setCreatedOrderPdfData, showToast, loadData, categorias, filteredProdutos, selectedCliente, addToCart, updateQuantity, removeFromCart, filteredSelectProdutos, filteredClientes, subtotalItens, valorDesconto, totalCalculadoAoVivo, handleNewClientCepChange, resetNewClientForm, handleCreateNewClient, handleOpenConfirmation, handleSubmitOrder } = state;

  return (
    <>
        {/* ============================================================== */}
        {/* LADO ESQUERDO: Catálogo Desktop (Oculto em telas menores para priorizar o fluxo rápido do orçamento) */}
        {/* ============================================================== */}
        <div className="hidden lg:block lg:col-span-8 space-y-5">
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
    </>
  );
};