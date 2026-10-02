import React, { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  Edit2,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Produto } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { getProductImage } from '../lib/productImages';
import { useToast } from '../components/Toast';

export const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('todas');

  // Modal Novo Produto
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Editar Preço
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      showToast('error', 'Falha ao carregar catálogo', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(produtos.map((p) => p.categoria));
    return ['todas', ...Array.from(set)];
  }, [produtos]);

  const handleToggleAtivo = async (produto: Produto) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: !produto.ativo })
        .eq('id', produto.id);

      if (error) throw error;

      showToast(
        'info',
        `Produto ${produto.ativo ? 'desativado' : 'ativado'}`,
        'O histórico de pedidos anteriores permanece 100% preservado.'
      );

      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, ativo: !p.ativo } : p))
      );
    } catch (err: any) {
      console.error('Erro ao atualizar produto:', err);
      showToast('error', 'Erro ao alterar status', err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const precoNum = parseFloat(preco.replace(',', '.'));
      if (isNaN(precoNum) || precoNum < 0) {
        throw new Error('Informe um preço unitário válido.');
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert({
          nome: nome.trim(),
          categoria: categoria.trim(),
          preco_unitario: precoNum,
          descricao: descricao.trim() || null,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Produto cadastrado com sucesso!');
      setProdutos((prev) => [...prev, data]);
      setModalOpen(false);
      setNome('');
      setCategoria('');
      setPreco('');
      setDescricao('');
    } catch (err: any) {
      console.error('Erro ao cadastrar produto:', err);
      showToast('error', 'Erro ao salvar produto', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingPrice(true);
    try {
      const numPrice = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(numPrice) || numPrice < 0) {
        throw new Error('Informe um preço válido.');
      }

      const { error } = await supabase
        .from('produtos')
        .update({ preco_unitario: numPrice })
        .eq('id', editingProduct.id);

      if (error) throw error;

      showToast(
        'success',
        'Preço atualizado com sucesso!',
        `Novo valor: ${formatCurrency(numPrice)}. Pedidos anteriores mantêm o valor congelado.`
      );

      setProdutos((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, preco_unitario: numPrice } : p))
      );
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Erro ao atualizar preço:', err);
      showToast('error', 'Falha ao atualizar preço', err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCat === 'todas' || p.categoria === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            CATÁLOGO & PREÇOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Catálogo de Equipamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Preços unitários protegidos por snapshot (reajustes não afetam pedidos passados)
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
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por equipamento ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat === 'todas' ? 'Todas as categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-white border border-slate-200/80 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredProdutos.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Nenhum equipamento cadastrado com os critérios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProdutos.map((p) => {
            const realImg = getProductImage(p.nome, p.categoria);

            return (
              <div
                key={p.id}
                className={`rounded-3xl bg-white border p-6 shadow-xs transition-all flex flex-col justify-between group ${
                  p.ativo ? 'border-slate-200/80 hover:border-blue-200 hover:shadow-md' : 'border-slate-200/40 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{p.nome}</h3>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {p.categoria}
                    </span>
                  </div>

                  {/* Foto Real do Equipamento */}
                  <div className="my-3.5 h-36 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative group-hover:shadow-xs transition-all flex items-center justify-center">
                    <img
                      src={realImg}
                      alt={p.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {p.descricao && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {p.descricao}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Preço Unitário
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(p.preco_unitario)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setNewPrice(p.preco_unitario.toString());
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar preço"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAtivo(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      p.ativo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title={p.ativo ? 'Desativar produto' : 'Ativar produto'}
                  >
                    {p.ativo ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Inativo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar Preço */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Editar Preço do Produto
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <p className="font-bold text-slate-900 text-sm">{editingProduct.nome}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Atualizar o preço no catálogo não afeta pedidos passados (snapshot de preço preservado).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Novo Preço Unitário (R$) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: 480.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {savingPrice ? 'Salvando...' : 'Salvar Preço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Produto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Equipamento
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
                  Nome do Dispositivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Câmera Speed Dome 4K"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seguranca, Automacao, Iluminacao..."
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 450.00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição Técnica
                </label>
                <textarea
                  rows={2}
                  placeholder="Especificações, conectividade..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
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
                  {saving ? 'Cadastrando...' : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
