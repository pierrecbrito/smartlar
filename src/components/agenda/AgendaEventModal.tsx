import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Play,
  CheckCircle2,
  CalendarDays,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatPhone, formatOrderCode, STATUS_CONFIG } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';
import { AgendaState } from '../../hooks/useAgenda';

interface Props {
  agenda: AgendaState;
}

export const AgendaEventModal: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* 5. MODAL EXPANSÃO DE DETALHES (GOOGLE CALENDAR EVENT DETAILS)  */}
      {/* ============================================================== */}
      {selectedEvent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base leading-tight">
                      Detalhes da Instalação
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/30">
                      {formatOrderCode(selectedEvent)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 font-medium mt-0.5">
                    {STATUS_CONFIG[selectedEvent.status].label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Data e Horário em Destaque */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                      Data & Horário Agendado
                    </span>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {formatDateTime(selectedEvent.data_instalacao)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenReschedule(selectedEvent);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Remarcar
                </button>
              </div>

              {/* Informações do Cliente & Local */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Cliente & Contato
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {selectedEvent.cliente?.nome}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {formatPhone(selectedEvent.cliente?.telefone)}
                    </span>
                    {selectedEvent.cliente?.telefone && (
                      <a
                        href={`https://wa.me/55${selectedEvent.cliente.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Endereço de Instalação
                      </span>
                      <p className="text-slate-800 font-semibold mt-0.5">
                        {selectedEvent.endereco_instalacao || selectedEvent.cliente?.endereco || 'Endereço não cadastrado'}
                      </p>
                      {(selectedEvent.ponto_referencia || selectedEvent.cliente?.ponto_referencia) && (
                        <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                          💡 Referência: {selectedEvent.ponto_referencia || selectedEvent.cliente?.ponto_referencia}
                        </p>
                      )}
                    </div>
                    {(selectedEvent.endereco_instalacao || selectedEvent.cliente?.endereco) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            selectedEvent.endereco_instalacao || selectedEvent.cliente?.endereco || ''
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors shadow-2xs"
                          title="Abrir no Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Maps</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(
                            selectedEvent.endereco_instalacao || selectedEvent.cliente?.endereco || ''
                          )}&navigate=yes`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors shadow-2xs"
                          title="Navegar com Waze"
                        >
                          <span>Waze</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Técnico Responsável */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Técnico Alocado
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                    {selectedEvent.tecnico?.nome || 'A definir / Não alocado'}
                  </p>
                  {selectedEvent.tecnico?.especialidade && (
                    <p className="text-[11px] text-slate-500">
                      Especialidade: {selectedEvent.tecnico.especialidade}
                    </p>
                  )}
                </div>

                {selectedEvent.tecnico?.telefone && (
                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
                    {formatPhone(selectedEvent.tecnico.telefone)}
                  </span>
                )}
              </div>

              {/* Itens do Pedido */}
              {selectedEvent.itens && selectedEvent.itens.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Produtos a Instalar ({selectedEvent.itens.length})
                  </span>
                  <div className="divide-y divide-slate-100 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3">
                    {selectedEvent.itens.map((item) => (
                      <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{item.produto?.nome}</p>
                          <span className="text-[10px] text-slate-500">
                            {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedEvent.observacoes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl text-xs text-amber-900">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-0.5">
                    Observações da Instalação
                  </span>
                  <p>{selectedEvent.observacoes}</p>
                </div>
              )}

              {/* Valor Total & Pagamento */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Forma de Pagamento
                  </span>
                  <span className="font-bold text-slate-800 uppercase text-xs">
                    {selectedEvent.forma_pagamento || 'A definir'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Valor Total
                  </span>
                  <span className="text-xl font-extrabold text-blue-700">
                    {formatCurrency(selectedEvent.valor_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
              {/* Botões de Avanço de Status */}
              <div>
                {selectedEvent.status === 'agendado' && (
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(selectedEvent.id, 'em_andamento', e)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Iniciar Instalação
                  </button>
                )}

                {selectedEvent.status === 'em_andamento' && (
                  <button
                    type="button"
                    onClick={(e) => handleUpdateStatus(selectedEvent.id, 'concluido', e)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir Instalação
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReschedule(selectedEvent)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Remarcar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
};