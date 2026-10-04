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

export const AgendaMobileView: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* VISUALIZAÇÃO MOBILE: FOCO EXCLUSIVO EM 1 DIA POR VEZ          */}
      {/* ============================================================== */}
      <div className="md:hidden space-y-4">
        {/* Seletor Horizontal de Dias da Semana (Semana Ativa) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {weekDays.map((day, idx) => {
              const isSelected = isSameDay(day, currentDate);
              const hoje = isToday(day);
              const countInstalacoes = filteredPedidos.filter((p) =>
                p.data_instalacao && isSameDay(new Date(p.data_instalacao), day)
              ).length;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(day)}
                  className={`flex-1 min-w-[42px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-102'
                      : hoje
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-tight ${isSelected ? 'text-blue-100' : hoje ? 'text-blue-600' : 'text-slate-400'}`}>
                    {DIAS_SEMANA[idx].abrev}
                  </span>
                  <span className={`text-sm font-extrabold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {day.getDate()}
                  </span>
                  {countInstalacoes > 0 ? (
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                  ) : (
                    <span className="w-1.5 h-1.5 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card do Dia Selecionado */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                {isToday(currentDate) ? 'Hoje' : 'Dia Selecionado'}
              </span>
              <h3 className="font-extrabold text-base text-slate-900 capitalize">
                {currentDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </h3>
            </div>
            <div className="text-right">
              {(() => {
                const count = filteredPedidos.filter((p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), currentDate)).length;
                return (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {count} {count === 1 ? 'instalação' : 'instalações'}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Lista Vertical de Instalações do Dia */}
          {(() => {
            const dayOrders = filteredPedidos
              .filter((p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), currentDate))
              .sort((a, b) => new Date(a.data_instalacao!).getTime() - new Date(b.data_instalacao!).getTime());

            if (dayOrders.length === 0) {
              return (
                <div className="py-10 text-center text-slate-400 space-y-1">
                  <CalendarDays className="w-10 h-10 mx-auto opacity-30 text-blue-600" />
                  <p className="text-xs font-bold text-slate-600">Nenhum serviço agendado para este dia</p>
                  <p className="text-[11px] text-slate-400">Selecione outro dia no seletor acima para ver a agenda</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayOrders.map((order) => {
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
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2.5 ${styles.card} ${
                        hasConflict ? 'ring-2 ring-amber-400' : ''
                      }`}
                    >
                      {/* Top: Horário + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md ${styles.timeBadge}`}>
                          <Clock className="w-3 h-3" />
                          {timeString}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                          {STATUS_CONFIG[order.status].label}
                        </span>
                      </div>

                      {hasConflict && (
                        <div className="p-1.5 bg-amber-100/90 text-amber-900 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Atenção: Horário sobreposto com outro serviço deste técnico!</span>
                        </div>
                      )}

                      {/* Cliente */}
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {order.cliente?.nome || 'Cliente não identificado'}
                        </h4>
                        {order.cliente?.telefone && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-600 font-mono">
                              {formatPhone(order.cliente.telefone)}
                            </span>
                            <a
                              href={`https://wa.me/55${order.cliente.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                            >
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Técnico & Local */}
                      <div className="space-y-1 pt-1 border-t border-slate-200/50 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Técnico: <b className="text-slate-800">{order.tecnico?.nome || 'A definir'}</b></span>
                        </div>
                        {order.cliente?.endereco && (
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{order.cliente.endereco}</span>
                          </div>
                        )}
                      </div>

                      {/* Ações Rápidas */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenReschedule(order, e)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Remarcar
                        </button>

                        <div className="flex items-center gap-1.5">
                          {order.status === 'agendado' && (
                            <button
                              type="button"
                              onClick={(e) => handleUpdateStatus(order.id, 'em_andamento', e)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              Iniciar
                            </button>
                          )}
                          {order.status === 'em_andamento' && (
                            <button
                              type="button"
                              onClick={(e) => handleUpdateStatus(order.id, 'concluido', e)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};