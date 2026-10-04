import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Produto } from '../types/database';
import { useToast } from '../components/Toast';
import { NewProductModal } from '../components/produtos/NewProductModal';
import { EditProductPriceModal } from '../components/produtos/EditProductPriceModal';
import { ProdutosTable } from '../components/produtos/ProdutosTable';
import { ProdutosFilterBar } from '../components/produtos/ProdutosFilterBar';

export const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('todas');

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

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

  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCat === 'todas' || p.categoria === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header e Barra de Filtros */}
      <ProdutosFilterBar
        search={search}
        onSearchChange={setSearch}
        categorias={categorias}
        selectedCat={selectedCat}
        onSelectCat={setSelectedCat}
        loading={loading}
        onRefresh={loadData}
        onNewProduct={() => setModalOpen(true)}
      />

      {/* Tabela e Cards de Produtos */}
      <ProdutosTable
        produtos={filteredProdutos}
        loading={loading}
        onToggleAtivo={handleToggleAtivo}
        onEditPrice={(p) => setEditingProduct(p)}
      />

      {/* Modal Editar Preço */}
      <EditProductPriceModal
        produto={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(id, novoPreco) =>
          setProdutos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, preco_unitario: novoPreco } : p))
          )
        }
        showToast={showToast}
      />

      {/* Modal Novo Produto */}
      <NewProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(novo) => setProdutos((prev) => [...prev, novo])}
        showToast={showToast}
      />
    </div>
  );
};
