import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  User,
  Clock,
  MapPin,
  Phone,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { InstalacaoView, Tecnico, StatusPedido } from '../types/database';
import { formatCurrency, formatDateTime, formatPhone, STATUS_CONFIG } from '../lib/utils';
import { useToast } from '../components/Toast';

export const AgendaPage: React.FC = () => {
  const [instalacoes, setInstalacoes] = useState<InstalacaoView[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTecnicoFilter, setSelectedTecnicoFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, tecnicosRes] = await Promise.all([
        supabase
          .from('v_instalacoes')
          .select('*')
          .order('data_instalacao', { ascending: true }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (instRes.error) throw instRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setInstalacoes(instRes.data || []);
      setTecnicos(tecnicosRes.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar instalações:', err);
      showToast('error', 'Falha ao sincronizar agenda', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const conflitosPorTecnico = useMemo(() => {
    const conflitos = new Set<string>();
    const agrupadoPorTecnico: Record<string, InstalacaoView[]> = {};

    instalacoes.forEach((inst) => {
      if (!inst.tecnico_id) return;
      if (!agrupadoPorTecnico[inst.tecnico_id]) agrupadoPorTecnico[inst.tecnico_id] = [];
      agrupadoPorTecnico[inst.tecnico_id].push(inst);
    });

    Object.values(agrupadoPorTecnico).forEach((lista) => {
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          const t1 = new Date(lista[i].data_instalacao).getTime();
          const t2 = new Date(lista[j].data_instalacao).getTime();
          if (Math.abs(t1 - t2) < 7200000) {
            conflitos.add(lista[i].pedido_id);
            conflitos.add(lista[j].pedido_id);
          }
        }
      }
    });

    return conflitos;
  }, [instalacoes]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: StatusPedido) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);

      if (error) throw error;

      showToast(
        'success',
        `Instalação atualizada para "${STATUS_CONFIG[novoStatus].label}"`
      );
      loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar status na agenda:', err);
      showToast('error', 'Recusa do PostgreSQL', err.message);
    }
  };

  const filteredInstalacoes = instalacoes.filter((inst) => {
    const matchTecnico =
      selectedTecnicoFilter === 'todos' || inst.tecnico_id === selectedTecnicoFilter;
    const matchSearch =
      inst.cliente_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.tecnico_nome && inst.tecnico_nome.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchTecnico && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            AGENDA TÉCNICA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Agenda & Instalações
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consumo da view <code className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs">v_instalacoes</code> com detecção inteligente de sobreposição
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          Sincronizar
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, endereço ou técnico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 shrink-0">Técnico:</span>
          <button
            onClick={() => setSelectedTecnicoFilter('todos')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTecnicoFilter === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          {tecnicos.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTecnicoFilter(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTecnicoFilter === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Instalações */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white border border-slate-200/80 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredInstalacoes.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Nenhuma instalação ativa encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInstalacoes.map((inst) => {
            const hasConflict = conflitosPorTecnico.has(inst.pedido_id);
            const statusConfig = STATUS_CONFIG[inst.status];

            return (
              <div
                key={inst.pedido_id}
                className={`rounded-3xl bg-white border p-6 shadow-xs transition-all flex flex-col justify-between ${
                  hasConflict ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80 hover:border-blue-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] text-slate-400 font-bold">
                        #{inst.pedido_id.slice(0, 8)}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 leading-tight mt-0.5">
                        {inst.cliente_nome}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-bold px-3 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {hasConflict && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <b>Alerta:</b> Conflito de horário detectado (&lt; 2h de intervalo).
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">
                        {formatDateTime(inst.data_instalacao)}
                      </span>
                    </p>

                    <p className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Técnico:</span>
                      <span className="font-bold text-slate-900">
                        {inst.tecnico_nome || 'A definir'}
                      </span>
                    </p>

                    <p className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{formatPhone(inst.cliente_telefone)}</span>
                    </p>

                    <p className="flex items-start gap-2.5 pt-1 text-slate-500">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{inst.endereco}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Valor
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatCurrency(inst.valor_total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inst.status === 'agendado' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inst.pedido_id, 'em_andamento')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Iniciar
                      </button>
                    )}

                    {inst.status === 'em_andamento' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inst.pedido_id, 'concluido')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
