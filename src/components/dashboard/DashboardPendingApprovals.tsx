import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, ChevronRight } from 'lucide-react';
import { Pedido } from '../../types/database';
import { formatCurrency, formatOrderCode, formatPhone } from '../../lib/utils';

interface DashboardPendingApprovalsProps {
  pedidos: Pedido[];
  onNavigate: (tab: any) => void;
}

export const DashboardPendingApprovals: React.FC<DashboardPendingApprovalsProps> = ({ pedidos, onNavigate }) => {
  const orcamentosAguardando = useMemo(() => {
    return pedidos
      .filter((p) => p.status === 'orcamento')
      .map((p) => {
        const refDate = new Date();
        const createdDate = new Date(p.created_at);
        const diffMs = refDate.getTime() - createdDate.getTime();
        const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return { ...p, diasSemResposta: dias };
      })
      .sort((a, b) => b.diasSemResposta - a.diasSemResposta);
  }, [pedidos]);

  return (
    <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Orçamentos Aguardando Aprovação
              </h3>
              <p className="text-[11px] text-slate-500">
                Propostas comerciais enviadas que aguardam retorno do cliente
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
            {orcamentosAguardando.length} aguardando
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {orcamentosAguardando.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhum orçamento pendente de aprovação.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Todas as propostas foram aprovadas ou finalizadas.</p>
            </div>
          ) : (
            orcamentosAguardando.slice(0, 5).map((p) => {
              const msgWhatsapp = `Olá ${p.cliente?.nome}! Aqui é o Rafael da SmartLar Automação e Segurança. Gostaria de saber se você teve a oportunidade de ver a proposta que montamos (${formatOrderCode(p)}) no valor de ${formatCurrency(p.valor_total)}. Ficou alguma dúvida técnica ou sobre os equipamentos?`;
              const linkWhatsapp = `https://wa.me/55${(p.cliente?.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgWhatsapp)}`;

              return (
                <div
                  key={p.id}
                  className="group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {p.cliente?.nome || 'Cliente'}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {formatOrderCode(p)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="text-slate-600 font-medium">
                        {p.diasSemResposta === 0
                          ? 'Enviado hoje'
                          : p.diasSemResposta === 1
                          ? 'Enviado ontem'
                          : `${p.diasSemResposta} dias atrás`}
                      </span>
                      {p.cliente?.telefone && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{formatPhone(p.cliente.telefone)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {formatCurrency(p.valor_total)}
                    </span>

                    {p.cliente?.telefone && (
                      <a
                        href={linkWhatsapp}
                        target="_blank"
                        rel="noreferrer"
                        title="Cobrar via WhatsApp"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => onNavigate('pedidos')}
                      title="Ver no Kanban"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>
          Total em aberto:{' '}
          <b className="text-slate-900">
            {formatCurrency(
              orcamentosAguardando.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
            )}
          </b>
        </span>
        <button
          onClick={() => onNavigate('pedidos')}
          className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
        >
          Gerenciar todos os Orçamentos ➔
        </button>
      </div>
    </div>
  );
};
