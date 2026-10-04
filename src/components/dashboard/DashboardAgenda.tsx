import React, { useMemo } from 'react';
import { Calendar, CalendarDays, Clock, User, MapPin, Send } from 'lucide-react';
import { Pedido } from '../../types/database';
import { formatCurrency, formatDateTime, formatPhone } from '../../lib/utils';

interface DashboardAgendaProps {
  pedidos: Pedido[];
  onNavigate: (tab: any) => void;
}

export const DashboardAgenda: React.FC<DashboardAgendaProps> = ({ pedidos, onNavigate }) => {
  const proximasInstalacoes7Dias = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    const fim7Dias = inicioHoje + 7 * 24 * 60 * 60 * 1000 + (24 * 60 * 60 * 1000 - 1);

    const instalacoesFiltradas = pedidos.filter((p) => {
      if (!p.data_instalacao) return false;
      if (p.status !== 'agendado' && p.status !== 'em_andamento') return false;
      const t = new Date(p.data_instalacao).getTime();
      return t >= inicioHoje - 24 * 60 * 60 * 1000 && t <= fim7Dias;
    });

    if (instalacoesFiltradas.length > 0) {
      return instalacoesFiltradas.sort(
        (a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime()
      );
    }

    return pedidos
      .filter((p) => (p.status === 'agendado' || p.status === 'em_andamento') && p.data_instalacao)
      .sort((a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime());
  }, [pedidos]);

  return (
    <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Próximas Instalações Agendadas
              </h3>
              <p className="text-[11px] text-slate-500">
                Janela dos próximos 7 dias com cliente, endereço e técnico
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
            {proximasInstalacoes7Dias.length} agendadas
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {proximasInstalacoes7Dias.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhuma instalação agendada nos próximos 7 dias.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Aprove orçamentos pendentes para agendar instalações.</p>
            </div>
          ) : (
            proximasInstalacoes7Dias.slice(0, 5).map((p) => {
              const enderecoConfirmacao = p.endereco_instalacao || p.cliente?.endereco || '';
              const refConfirmacao = p.ponto_referencia || p.cliente?.ponto_referencia ? ` (Ref: ${p.ponto_referencia || p.cliente?.ponto_referencia})` : '';
              const msgWhatsappCliente = `Olá ${p.cliente?.nome}! Aqui é o Rafael da SmartLar. Confirmando nossa visita técnica para instalação agendada para ${p.data_instalacao ? formatDateTime(p.data_instalacao) : 'esta semana'} no endereço: ${enderecoConfirmacao}${refConfirmacao}. Técnico responsável: ${p.tecnico?.nome || 'Nossa equipe'}. Qualquer dúvida estamos à disposição!`;
              const linkWhatsappCliente = `https://wa.me/55${(p.cliente?.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgWhatsappCliente)}`;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {p.data_instalacao ? formatDateTime(p.data_instalacao) : 'Data a definir'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {p.status === 'em_andamento' ? 'Em Andamento' : 'Agendado'}
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(p.valor_total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-extrabold text-slate-900 truncate">
                        {p.cliente?.nome || 'Cliente não identificado'}
                      </span>
                      {p.cliente?.telefone && (
                        <span className="text-slate-500 font-medium text-[11px]">
                          ({formatPhone(p.cliente.telefone)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-tight">
                      {p.cliente?.endereco || 'Endereço não cadastrado'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🛠️</span>
                      <span className="text-slate-500 text-[11px]">Técnico:</span>
                      <span className="font-extrabold text-slate-800">
                        {p.tecnico?.nome || 'Pendente de alocação'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.cliente?.telefone && (
                        <a
                          href={linkWhatsappCliente}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Confirmar com o Cliente no WhatsApp"
                        >
                          <Send className="w-3 h-3 text-slate-500" />
                          <span>Avisar Cliente</span>
                        </a>
                      )}
                      <button
                        onClick={() => onNavigate('agenda')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Ver na Agenda
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>
          Total agendado:{' '}
          <b className="text-slate-900">
            {formatCurrency(
              proximasInstalacoes7Dias.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
            )}
          </b>
        </span>
        <button
          onClick={() => onNavigate('agenda')}
          className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
        >
          Abrir Grade Completa da Agenda ➔
        </button>
      </div>
    </div>
  );
};
