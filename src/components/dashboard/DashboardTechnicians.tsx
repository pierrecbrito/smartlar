import React, { useMemo } from 'react';
import { Users, ChevronRight, Send } from 'lucide-react';
import { Pedido, Tecnico } from '../../types/database';
import { formatDateTime } from '../../lib/utils';

interface DashboardTechniciansProps {
  pedidos: Pedido[];
  tecnicos: Tecnico[];
  onNavigate: (tab: any) => void;
}

export const DashboardTechnicians: React.FC<DashboardTechniciansProps> = ({ pedidos, tecnicos, onNavigate }) => {
  const agendaTecnicos = useMemo(() => {
    const lucas = tecnicos.find((t) => t.nome.toLowerCase().includes('lucas')) || {
      id: 'lucas',
      nome: 'Lucas Almeida',
      especialidade: 'Câmeras CFTV & Sensores',
      telefone: '81999990001',
    };

    const pedro = tecnicos.find((t) => t.nome.toLowerCase().includes('pedro')) || {
      id: 'pedro',
      nome: 'Pedro Santos',
      especialidade: 'Fechaduras & Automação Residencial',
      telefone: '81999990002',
    };

    const servicosLucas = pedidos
      .filter((p) => p.tecnico_id === lucas.id || p.tecnico?.nome?.includes('Lucas'))
      .sort((a, b) => new Date(a.data_instalacao || 0).getTime() - new Date(b.data_instalacao || 0).getTime());

    const servicosPedro = pedidos
      .filter((p) => p.tecnico_id === pedro.id || p.tecnico?.nome?.includes('Pedro'))
      .sort((a, b) => new Date(a.data_instalacao || 0).getTime() - new Date(b.data_instalacao || 0).getTime());

    return {
      lucas: {
        tecnico: lucas,
        servicos: servicosLucas,
        statusAtual: servicosLucas.some((s) => s.status === 'em_andamento')
          ? 'Em atendimento agora'
          : servicosLucas.some((s) => s.status === 'agendado')
          ? 'Instalação agendada'
          : 'Disponível',
      },
      pedro: {
        tecnico: pedro,
        servicos: servicosPedro,
        statusAtual: servicosPedro.some((s) => s.status === 'em_andamento')
          ? 'Em atendimento agora'
          : servicosPedro.some((s) => s.status === 'agendado')
          ? 'Instalação agendada'
          : 'Disponível',
      },
    };
  }, [pedidos, tecnicos]);

  const gerarLinkWhatsappTecnico = (nomeTecnico: string, telefone: string, servicos: Pedido[]) => {
    const limpo = telefone.replace(/\D/g, '');
    let msg = `*SmartLar — Escala de Instalações*\n`;
    msg += `Olá ${nomeTecnico.split(' ')[0]}! Segue sua programação de serviços:\n\n`;

    if (servicos.length === 0) {
      msg += `Hoje não há serviços agendados até o momento. Fique de sobreaviso.`;
    } else {
      servicos.forEach((s, idx) => {
        const dataFormatada = s.data_instalacao ? formatDateTime(s.data_instalacao) : 'Horário a definir';
        const enderecoServico = s.endereco_instalacao || s.cliente?.endereco || 'Endereço a confirmar';
        const refServico = s.ponto_referencia || s.cliente?.ponto_referencia;

        msg += `📍 *${idx + 1}. ${s.cliente?.nome || 'Cliente'}*\n`;
        msg += `⏰ ${dataFormatada}\n`;
        msg += `🏠 ${enderecoServico}\n`;
        if (refServico) {
          msg += `💡 Ref: ${refServico}\n`;
        }
        msg += `🗺️ GPS/Rota: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoServico)}\n`;
        msg += `📦 Itens: ${s.itens?.map((i) => `${i.quantidade}x ${i.produto?.nome}`).join(', ') || 'Equipamentos'}\n\n`;
      });
      msg += `Qualquer dúvida entre em contato com o Rafael. Bom trabalho!`;
    }

    return `https://wa.me/55${limpo}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Escala & Programação dos Técnicos (Lucas & Pedro)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Envie a rota do dia com horários e endereços direto para o WhatsApp de cada técnico em 1 clique.
          </p>
        </div>

        <button
          onClick={() => onNavigate('agenda')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-center"
        >
          <span>Grade Semanal</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3.5 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                LA
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Lucas Almeida
                </h4>
                <p className="text-[11px] text-slate-500">
                  {agendaTecnicos.lucas.tecnico.especialidade}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
              {agendaTecnicos.lucas.statusAtual}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Próximas Instalações Atribuídas ({agendaTecnicos.lucas.servicos.length})
            </span>

            {agendaTecnicos.lucas.servicos.length === 0 ? (
              <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
                Nenhum serviço escalado no momento.
              </div>
            ) : (
              agendaTecnicos.lucas.servicos.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {s.cliente?.nome}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 font-bold">
                      {s.data_instalacao ? formatDateTime(s.data_instalacao) : 'A definir'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    📍 {s.cliente?.endereco}
                  </p>
                </div>
              ))
            )}
          </div>

          <a
            href={gerarLinkWhatsappTecnico(
              agendaTecnicos.lucas.tecnico.nome,
              agendaTecnicos.lucas.tecnico.telefone,
              agendaTecnicos.lucas.servicos
            )}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar Agenda do Dia para o Lucas (WhatsApp)</span>
          </a>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3.5 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                PS
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Pedro Santos
                </h4>
                <p className="text-[11px] text-slate-500">
                  {agendaTecnicos.pedro.tecnico.especialidade}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
              {agendaTecnicos.pedro.statusAtual}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Próximas Instalações Atribuídas ({agendaTecnicos.pedro.servicos.length})
            </span>

            {agendaTecnicos.pedro.servicos.length === 0 ? (
              <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
                Nenhum serviço escalado no momento.
              </div>
            ) : (
              agendaTecnicos.pedro.servicos.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {s.cliente?.nome}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 font-bold">
                      {s.data_instalacao ? formatDateTime(s.data_instalacao) : 'A definir'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    📍 {s.cliente?.endereco}
                  </p>
                </div>
              ))
            )}
          </div>

          <a
            href={gerarLinkWhatsappTecnico(
              agendaTecnicos.pedro.tecnico.nome,
              agendaTecnicos.pedro.tecnico.telefone,
              agendaTecnicos.pedro.servicos
            )}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar Agenda do Dia para o Pedro (WhatsApp)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
