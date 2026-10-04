import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Phone,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  X,
  ExternalLink,
  MessageSquare,
  Package,
  ArrowRight,
  Check,
  Filter,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Pedido, Tecnico, StatusPedido, TipoPagamento } from '../../types/database';
import { formatCurrency, formatDateTime, formatDate, formatPhone, formatOrderCode, STATUS_CONFIG } from '../../lib/utils';
import { useToast } from '../Toast';
import { ModalPortal } from '../ModalPortal';
import { AgendaState, CALENDAR_HOURS, DIAS_SEMANA } from '../../hooks/useAgenda';

interface Props {
  agenda: AgendaState;
}

export const AgendaWeekView: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
        {/* 2. VISUALIZAÇÃO: SEMANA (GOOGLE CALENDAR 7 COLUNAS) */}
        {viewMode === 'semana' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cabeçalho dos 7 Dias da Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
            {weekDays.map((day, idx) => {
              const hoje = isToday(day);
              const countInstalacoes = filteredPedidos.filter((p) =>
                p.data_instalacao && isSameDay(new Date(p.data_instalacao), day)
              ).length;

              return (
                <div
                  key={idx}
                  className={`py-3.5 px-2 text-center border-r last:border-r-0 border-slate-100 flex flex-col items-center justify-center transition-colors ${
                    hoje ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <span
                    className={`text-[11px] font-extrabold tracking-wider uppercase ${
                      hoje ? 'text-blue-600 font-black' : 'text-slate-400'
                    }`}
                  >
                    {DIAS_SEMANA[idx].abrev}
                  </span>

                  {/* Número do Dia com destaque circular de "Hoje" estilo Google Calendar */}
                  <div className="mt-1 flex items-center justify-center">
                    <span
                      className={`text-sm font-extrabold flex items-center justify-center rounded-full transition-all ${
                        hoje
                          ? 'w-8 h-8 bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Badge de quantidade de instalações do dia */}
                  {countInstalacoes > 0 ? (
                    <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800">
                      {countInstalacoes} {countInstalacoes === 1 ? 'serviço' : 'serviços'}
                    </span>
                  ) : (
                    <span className="mt-1 text-[10px] text-slate-300">Livre</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grade de 7 Colunas com as Instalações do Dia */}
          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[580px] bg-slate-50/20">
            {weekDays.map((day, dayIndex) => {
              const hoje = isToday(day);
              const dayOrders = filteredPedidos
                .filter((p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), day))
                .sort((a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime());

              return (
                <div
                  key={dayIndex}
                  className={`p-2.5 space-y-2.5 transition-colors flex flex-col justify-start relative ${
                    hoje ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {/* Linha indicadora sutil se for hoje */}
                  {hoje && (
                    <div className="text-[10px] font-extrabold text-blue-600 text-center py-0.5 bg-blue-100/50 rounded-lg mb-1">
                      Dia Atual
                    </div>
                  )}

                  {dayOrders.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-12 text-center text-slate-300">
                      <p className="text-[11px] font-medium">Sem agendamentos</p>
                    </div>
                  ) : (
                    dayOrders.map((order) => {
                      const styles = getEventBadgeStyle(order.status);
                      const hasConflict = conflitosPorTecnico.has(order.id);
                      const orderDate = new Date(order.data_instalacao!);
                      const timeString = orderDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedEvent(order)}
                          className={`rounded-2xl p-2.5 border transition-all cursor-pointer hover:shadow-md group relative ${styles.card} ${
                            hasConflict ? 'ring-2 ring-amber-400' : ''
                          }`}
                        >
                          {/* Topo do Card: Horário & Badge de Status */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${styles.timeBadge}`}>
                              <Clock className="w-2.5 h-2.5" />
                              {timeString}
                            </span>

                            {hasConflict && (
                              <span
                                title="Alerta de sobreposição com outro serviço deste técnico"
                                className="p-0.5 text-amber-600 bg-amber-100 rounded-md"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          {/* Nome do Cliente */}
                          <p className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                            {order.cliente?.nome || 'Cliente não identificado'}
                          </p>

                          {/* Técnico Alocado */}
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold">
                              {order.tecnico?.nome || 'A definir'}
                            </span>
                          </div>

                          {/* Endereço / Local */}
                          {order.cliente?.endereco && (
                            <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-500">
                              <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{order.cliente.endereco}</span>
                            </div>
                          )}

                          {/* Botões de Ação Rápida no Hover: Expandir e Remarcar */}
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5">
                              Detalhes <ArrowRight className="w-2.5 h-2.5" />
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleOpenReschedule(order, e)}
                              className="px-2 py-0.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-lg font-bold shadow-2xs transition-colors cursor-pointer"
                              title="Remarcar esta instalação"
                            >
                              Remarcar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};