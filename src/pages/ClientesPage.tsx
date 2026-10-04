import React, { useEffect, useState } from 'react';
import { UserPlus, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente } from '../types/database';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import { ClientOrdersModal } from '../components/clientes/ClientOrdersModal';
import { NewClientModal } from '../components/clientes/NewClientModal';
import { ClientesList, ClienteComPedidos } from '../components/clientes/ClientesList';

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteComPedidos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientForOrders, setSelectedClientForOrders] = useState<Cliente | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          pedidos:pedidos(id, numero_pedido, status, valor_total)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes((data || []) as unknown as ClienteComPedidos[]);
    } catch (err: any) {
      console.error('Erro ao listar clientes:', err);
      showToast('error', 'Falha ao carregar clientes', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.telefone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.endereco.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            BASE DE DADOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Clientes & Contatos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão centralizada de clientes, endereços de atendimento e histórico de pedidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
          Total: <span className="font-extrabold text-slate-900">{filteredClientes.length}</span> clientes listados
        </div>
      </div>

      {/* Listagem de Clientes */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <ClientesList
          clientes={filteredClientes}
          onOpenClientOrders={(cliente) => setSelectedClientForOrders(cliente)}
        />
      )}

      {/* Modal de Pedidos do Cliente */}
      <ClientOrdersModal
        cliente={selectedClientForOrders}
        onClose={() => setSelectedClientForOrders(null)}
        showToast={showToast}
      />

      {/* Modal de Novo Cliente */}
      <NewClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(novoCliente) =>
          setClientes((prev) => [...prev, novoCliente as unknown as ClienteComPedidos])
        }
        showToast={showToast}
      />
    </div>
  );
};
