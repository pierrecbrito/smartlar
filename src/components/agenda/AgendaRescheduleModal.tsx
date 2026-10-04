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

export const AgendaRescheduleModal: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* 6. MODAL DE REMARCAÇÃO ("ALÉM DISSO, PODE REMARCAR")           */}
      {/* ============================================================== */}
      {reschedulingOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    Remarcar Instalação
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    {reschedulingOrder.cliente?.nome} • {formatOrderCode(reschedulingOrder)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReschedulingOrder(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <div className="p-6 space-y-4 text-xs">
              {/* Alerta de Conflito em tempo real */}
              {conflitoRemarcacao && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-extrabold block">Conflito de Horário Detectado!</span>
                    <p className="text-[11px] mt-0.5 leading-snug">{conflitoRemarcacao}</p>
                  </div>
                </div>
              )}

              {/* 1. Nova Data */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nova Data da Instalação *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />

                {/* Atalhos Rápidos de Data */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-02')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Hoje (02/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-03')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Amanhã (03/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleDate('2026-10-05')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Segunda (05/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(rescheduleDate || '2026-10-02');
                      d.setDate(d.getDate() + 7);
                      setRescheduleDate(d.toISOString().slice(0, 10));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    +7 dias
                  </button>
                </div>
              </div>

              {/* 2. Novo Horário */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />

                {/* Atalhos de Horário */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleTime(slot)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        rescheduleTime === slot
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Técnico Responsável */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Técnico Alocado
                </label>
                <select
                  value={rescheduleTecnicoId}
                  onChange={(e) => setRescheduleTecnicoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione um técnico...</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Motivo / Observação da Remarcação */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Motivo ou Observação do Reagendamento
                </label>
                <textarea
                  rows={2}
                  value={rescheduleObs}
                  onChange={(e) => setRescheduleObs(e.target.value)}
                  placeholder="Ex: Cliente solicitou alteração para turno da tarde..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {rescheduleConflict && (
                <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Aviso de Proximidade de Horário</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      O técnico selecionado já possui o pedido <b>{formatOrderCode(rescheduleConflict)}</b> ({rescheduleConflict.cliente?.nome || 'Cliente'}) agendado para às {formatDateTime(rescheduleConflict.data_instalacao)}. Verifique a rota e deslocamento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ações */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingOrder(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                disabled={savingReschedule}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingReschedule ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Remarcação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
};