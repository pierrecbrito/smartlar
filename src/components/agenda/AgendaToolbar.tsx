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

export const AgendaToolbar: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. TOP BAR / NAVBAR ESTILO GOOGLE CALENDAR                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificação & Navegação */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                SmartLar Agenda
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Instalações
              </h1>
            </div>
          </div>

          {/* Botão "Hoje" */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
          >
            Hoje
          </button>

          {/* Chevrons < e > */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Título do Mês / Período (ex: "Outubro de 2026") */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize ml-1 min-w-44">
            {headerDateTitle}
          </h2>
        </div>

        {/* Lado Direito: Filtros, Seletor de Modo (Semana, Mês, Dia) & Sincronização */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente ou técnico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtro de Técnico */}
          <div className="relative">
            <select
              value={selectedTecnicoFilter}
              onChange={(e) => setSelectedTecnicoFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="todos">Todos os Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Modo: Semana | Mês | Dia (Google Calendar Style - Apenas Desktop) */}
          <div className="hidden sm:inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mes')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dia')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
          </div>

          {/* Sincronizar */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Atualizar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>
    </>
  );
};