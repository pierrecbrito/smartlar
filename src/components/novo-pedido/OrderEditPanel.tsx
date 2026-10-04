import React from 'react';
import {
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Search,
  X,
  User,
  ShoppingBag,
  Package,
  ArrowRight,
  MapPin,
  ChevronDown,
  Check,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { formatarEnderecoListagem } from '../../lib/cep';
import { NovoPedidoState } from '../../hooks/useNovoPedido';

interface Props {
  state: NovoPedidoState;
}

export const OrderEditPanel: React.FC<Props> = ({ state }) => {
  const { produtos, selectedClienteId, setSelectedClienteId, cart, setCart, observacoes, setObservacoes, descontoPercentual, setDescontoPercentual, submitting, isClientDropdownOpen, setIsClientDropdownOpen, clientSearchTerm, setClientSearchTerm, clientDropdownRef, isProductSelectOpen, setIsProductSelectOpen, productSelectSearch, setProductSelectSearch, productSelectRef, setIsNewClientModalOpen, showToast, selectedCliente, addToCart, updateQuantity, removeFromCart, filteredSelectProdutos, filteredClientes, subtotalItens, valorDesconto, totalCalculadoAoVivo, handleOpenConfirmation } = state;

  return (
    <>
                <div>
                  {/* Header do Detalhes do Pedido */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">Novo Orçamento</h3>
                      <p className="text-[11px] text-slate-400">Adicione produtos e selecione o cliente</p>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Limpar itens"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Limpar</span>
                      </button>
                    )}
                  </div>

                  {/* SELECT COM PESQUISA PARA ADICIONAR PRODUTOS (Foco principal da criação ágil) */}
                  <div className="my-3.5 relative" ref={productSelectRef}>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Adicionar Produto
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{produtos.length} disponíveis</span>
                    </label>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar produto por nome, código..."
                        value={productSelectSearch}
                        onFocus={() => setIsProductSelectOpen(true)}
                        onChange={(e) => {
                          setProductSelectSearch(e.target.value);
                          setIsProductSelectOpen(true);
                        }}
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      {productSelectSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSelectSearch('');
                            setIsProductSelectOpen(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown de produtos encontrados */}
                    {isProductSelectOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 max-h-60 overflow-y-auto animate-fade-in">
                        {filteredSelectProdutos.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            Nenhum produto encontrado para "{productSelectSearch}".
                          </div>
                        ) : (
                          filteredSelectProdutos.map((p) => {
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  addToCart(p);
                                  setProductSelectSearch('');
                                  setIsProductSelectOpen(false);
                                  showToast('success', `${p.nome} adicionado!`);
                                }}
                                className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                    {p.nome}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                      {p.categoria}
                                    </span>
                                    {p.descricao && (
                                      <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                        {p.descricao}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-xs font-mono">
                                    {formatCurrency(p.preco_unitario)}
                                  </span>
                                  <span className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de Produtos do Orçamento */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        Produtos no Orçamento ({cart.reduce((a, b) => a + b.quantidade, 0)})
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[260px] sm:max-h-[300px] overflow-y-auto pr-1">
                      {cart.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-4">
                          <Package className="w-8 h-8 mx-auto mb-1.5 opacity-30 text-blue-600" />
                          <p className="text-xs font-semibold text-slate-700">Nenhum produto adicionado</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Busque no campo acima para incluir no orçamento
                          </p>
                        </div>
                      ) : (
                        cart.map((item) => {
                          const itemTotal = item.produto.preco_unitario * item.quantidade;
                          return (
                            <div key={item.produto.id} className="py-2.5 flex items-center justify-between gap-2.5">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-slate-900 truncate">
                                  {item.produto.nome}
                                </h5>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-500">
                                    {formatCurrency(item.produto.preco_unitario)}
                                  </span>
                                  <span className="text-xs font-extrabold text-blue-700">
                                    = {formatCurrency(itemTotal)}
                                  </span>
                                </div>
                              </div>

                              {/* Stepper compacto [- 1 +] */}
                              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.produto.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                                  title="Diminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-extrabold text-xs px-2 text-slate-900 min-w-4 text-center">
                                  {item.quantidade}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.produto.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Botão Remover Lixeira */}
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.produto.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 cursor-pointer shrink-0"
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
                                          {formatarEnderecoListagem(c)}
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
  );
};