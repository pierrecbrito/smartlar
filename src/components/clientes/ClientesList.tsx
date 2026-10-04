import React from 'react';
import {
  Users,
  Mail,
  MapPin,
  ClipboardList,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Cliente } from '../../types/database';
import { formatPhone } from '../../lib/utils';
import { formatarEnderecoListagem } from '../../lib/cep';

export interface ClienteComPedidos extends Cliente {
  pedidos?: Array<{
    id: string;
    numero_pedido?: number;
    status: string;
    valor_total: number;
  }>;
}

interface ClientesListProps {
  clientes: ClienteComPedidos[];
  onOpenClientOrders: (cliente: Cliente) => void;
}

export const ClientesList: React.FC<ClientesListProps> = ({
  clientes,
  onOpenClientOrders,
}) => {
  if (clientes.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
        <p className="text-sm font-semibold text-slate-600">Nenhum cliente cadastrado com os critérios.</p>
      </div>
    );
  }

  return (
    <>
      {/* LISTAGEM MOBILE: CARDS VERTICAIS (100% LARGURA, SEM OVERFLOW) */}
      <div className="md:hidden space-y-3">
        {clientes.map((cliente) => {
          const cleanPhone = cliente.telefone.replace(/\D/g, '');
          const pedidosCount = cliente.pedidos?.length || 0;
          const activeOrdersCount = cliente.pedidos?.filter(
            (p) => p.status === 'agendado' || p.status === 'em_andamento'
          ).length || 0;

          return (
            <div
              key={cliente.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3"
            >
              {/* Cabeçalho do Cliente: Avatar + Nome + Badge Pedidos */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-blue-800 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {cliente.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      onClick={() => onOpenClientOrders(cliente)}
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer truncate"
                    >
                      {cliente.nome}
                    </p>
                    {cliente.email ? (
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {cliente.email}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sem e-mail cadastrado</span>
                    )}
                  </div>
                </div>

                {/* Badge de Histórico de Pedidos */}
                <div className="shrink-0 text-right">
                  {activeOrdersCount > 0 ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {activeOrdersCount} ativo{activeOrdersCount > 1 ? 's' : ''}
                    </span>
                  ) : pedidosCount > 0 ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {pedidosCount} pedido{pedidosCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      0 pedidos
                    </span>
                  )}
                </div>
              </div>

              {/* Telefone e WhatsApp */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="font-extrabold text-slate-800 text-xs font-mono">
                  {formatPhone(cliente.telefone)}
                </span>

                <button
                  type="button"
                  onClick={() => window.open(`https://wa.me/55${cleanPhone}`, '_blank')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Endereço de Instalação */}
              <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                    {formatarEnderecoListagem(cliente)}
                  </p>
                </div>
                {cliente.endereco && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      formatarEnderecoListagem(cliente)
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors shrink-0 border border-slate-200/60"
                    title="Ver endereço no Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Ação: Ver Pedidos do Cliente */}
              <button
                type="button"
                onClick={() => onOpenClientOrders(cliente)}
                className="w-full py-2.5 bg-slate-50 hover:bg-blue-50 text-blue-700 hover:text-blue-800 font-bold rounded-2xl border border-slate-200 hover:border-blue-200 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Pedidos & Histórico</span>
                <ArrowRight className="w-3 h-3 text-blue-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* LISTAGEM DESKTOP: TABELA HORIZONTAL COMPLETA */}
      <div className="hidden md:block rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider divide-x divide-slate-100">
                <th className="py-4 px-4 w-14 text-center">#</th>
                <th className="py-4 px-6 w-1/4">Cliente</th>
                <th className="py-4 px-6 whitespace-nowrap">WhatsApp & Telefone</th>
                <th className="py-4 px-6">Endereço de Instalação</th>
                <th className="py-4 px-5 text-center whitespace-nowrap">Histórico</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {clientes.map((cliente, index) => {
                const cleanPhone = cliente.telefone.replace(/\D/g, '');
                const pedidosCount = cliente.pedidos?.length || 0;
                const activeOrdersCount = cliente.pedidos?.filter(
                  (p) => p.status === 'agendado' || p.status === 'em_andamento'
                ).length || 0;

                return (
                  <tr
                    key={cliente.id}
                    className="hover:bg-blue-50/30 transition-colors group divide-x divide-slate-100"
                  >
                    {/* Número vertical # */}
                    <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* Cliente (Nome + Iniciais + Email) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-blue-100/80 text-blue-800 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {cliente.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            onClick={() => onOpenClientOrders(cliente)}
                            className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                            title="Clique para ver pedidos deste cliente"
                          >
                            {cliente.nome}
                          </p>
                          {cliente.email ? (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              {cliente.email}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Sem e-mail cadastrado</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* WhatsApp & Telefone */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs font-mono">
                          {formatPhone(cliente.telefone)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </td>

                    {/* Endereço de Instalação */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 font-semibold leading-relaxed line-clamp-2">
                            {formatarEnderecoListagem(cliente)}
                          </p>
                        </div>
                        {cliente.endereco && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              formatarEnderecoListagem(cliente)
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                            title="Ver endereço no Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Histórico de Pedidos */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenClientOrders(cliente)}
                        className="inline-flex flex-col items-center justify-center cursor-pointer group/btn"
                      >
                        <span className="font-extrabold text-xs text-slate-900 group-hover/btn:text-blue-600">
                          {pedidosCount} {pedidosCount === 1 ? 'pedido' : 'pedidos'}
                        </span>
                        {activeOrdersCount > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-0.5">
                            {activeOrdersCount} em andamento
                          </span>
                        ) : pedidosCount > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                            Concluídos
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Nenhum</span>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenClientOrders(cliente)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl transition-all cursor-pointer shadow-xs"
                        title="Ver histórico de pedidos do cliente"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Pedidos</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
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
            Mostrando <b>{clientes.length}</b> {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </span>
          <span className="text-[11px] text-slate-400">
            Clique em "Ver Pedidos" para acessar o histórico detalhado
          </span>
        </div>
      </div>
    </>
  );
};
