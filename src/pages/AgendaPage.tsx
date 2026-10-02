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
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            AGENDA TÉCNICA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Agenda & Instalações
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consumo da view <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-purple-300 font-mono text-xs">v_instalacoes</code> com detecção inteligente de sobreposição
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          Sincronizar
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, endereço ou técnico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Técnico:</span>
          <button
            onClick={() => setSelectedTecnicoFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTecnicoFilter === 'todos'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Todos
          </button>
          {tecnicos.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTecnicoFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTecnicoFilter === t.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
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
            <div key={i} className="h-44 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredInstalacoes.length === 0 ? (
        <div className="rounded-2xl bg-[#121622]/80 backdrop-blur-xl border border-white/[0.08] p-12 text-center text-slate-400">
          <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Nenhuma instalação ativa encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInstalacoes.map((inst) => {
            const hasConflict = conflitosPorTecnico.has(inst.pedido_id);
            const statusConfig = STATUS_CONFIG[inst.status];

            return (
              <div
                key={inst.pedido_id}
                className={`rounded-2xl bg-[#121622]/80 backdrop-blur-xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all flex flex-col justify-between ${
                  hasConflict ? 'border-amber-400/50 ring-1 ring-amber-400/20' : 'border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] text-slate-400">
                        #{inst.pedido_id.slice(0, 8)}
                      </span>
                      <h3 className="font-bold text-base text-white leading-tight">
                        {inst.cliente_nome}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {hasConflict && (
                    <div className="flex items-center gap-1.5 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <b>Alerta:</b> Conflito de horário detectado (&lt; 2h de intervalo).
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {formatDateTime(inst.data_instalacao)}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Técnico:</span>
                      <span className="font-bold text-white">
                        {inst.tecnico_nome || 'A definir'}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{formatPhone(inst.cliente_telefone)}</span>
                    </p>

                    <p className="flex items-start gap-2 pt-1 text-slate-400">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{inst.endereco}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Valor
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {formatCurrency(inst.valor_total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inst.status === 'agendado' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inst.pedido_id, 'em_andamento')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Iniciar
                      </button>
                    )}

                    {inst.status === 'em_andamento' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inst.pedido_id, 'concluido')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
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
