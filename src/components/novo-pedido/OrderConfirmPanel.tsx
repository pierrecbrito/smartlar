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

export const OrderConfirmPanel: React.FC<Props> = ({ state }) => {
  const { clientes, setClientes, produtos, setProdutos, selectedClienteId, setSelectedClienteId, cart, setCart, observacoes, setObservacoes, descontoPercentual, setDescontoPercentual, formaPagamento, setFormaPagamento, loadingInitial, setLoadingInitial, submitting, setSubmitting, detalhesMode, setDetalhesMode, isClientDropdownOpen, setIsClientDropdownOpen, clientSearchTerm, setClientSearchTerm, clientDropdownRef, isProductSelectOpen, setIsProductSelectOpen, productSelectSearch, setProductSelectSearch, productSelectRef, isNewClientModalOpen, setIsNewClientModalOpen, newClientNome, setNewClientNome, newClientTelefone, setNewClientTelefone, newClientEmail, setNewClientEmail, newClientCep, setNewClientCep, newClientLogradouro, setNewClientLogradouro, newClientNumero, setNewClientNumero, newClientComplemento, setNewClientComplemento, newClientBairro, setNewClientBairro, newClientCidade, setNewClientCidade, newClientEstado, setNewClientEstado, newClientPontoReferencia, setNewClientPontoReferencia, loadingClientCep, setLoadingClientCep, newClientNumeroRef, savingClient, setSavingClient, productSearch, setProductSearch, selectedCategoria, setSelectedCategoria, createdOrderPdfData, setCreatedOrderPdfData, showToast, loadData, categorias, filteredProdutos, selectedCliente, addToCart, updateQuantity, removeFromCart, filteredSelectProdutos, filteredClientes, subtotalItens, valorDesconto, totalCalculadoAoVivo, handleNewClientCepChange, resetNewClientForm, handleCreateNewClient, handleOpenConfirmation, handleSubmitOrder } = state;

  return (
    <>
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
    </>
  );
};