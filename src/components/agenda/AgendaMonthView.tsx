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

export const AgendaMonthView: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* 3. VISUALIZAÇÃO: MÊS (GRADE 7x5 GOOGLE CALENDAR)               */}
      {/* ============================================================== */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cabeçalho dos Dias (SEG a DOM) */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i}>{d.abrev}</div>
            ))}
          </div>

          {/* Grade de Dias do Mês */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const hoje = isToday(date);
              const dayOrders = filteredPedidos.filter(
                (p) => p.data_instalacao && isSameDay(new Date(p.data_instalacao), date)
              );

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('dia');
                  }}
                  className={`p-1.5 sm:p-2 min-h-24 sm:min-h-28 transition-colors flex flex-col justify-between cursor-pointer hover:bg-blue-50/30 ${
                    !isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'
                  } ${hoje ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        hoje
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {dayOrders.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* Pílulas de Instalações dentro do dia */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                    {dayOrders.slice(0, 3).map((order) => {
                      const styles = getEventBadgeStyle(order.status);
                      const timeStr = new Date(order.data_instalacao!).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(order);
                          }}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 border cursor-pointer hover:opacity-90 ${styles.card}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
                          <span className="font-mono text-[9px]">{timeStr}</span>
                          <span className="truncate">{order.cliente?.nome}</span>
                        </div>
                      );
                    })}

                    {dayOrders.length > 3 && (
                      <div className="text-[10px] font-bold text-blue-600 pl-1">
                        + {dayOrders.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};