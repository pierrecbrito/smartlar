import React from 'react';
import {
  User,
  MapPin
} from 'lucide-react';
import { AgendaState, CALENDAR_HOURS } from '../../hooks/useAgenda';

interface Props {
  agenda: AgendaState;
}

export const AgendaDayView: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* ============================================================== */}
      {/* 4. VISUALIZAÇÃO: DIA (TIMELINE COMPLETA COM HORAS)             */}
      {/* ============================================================== */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 block">
                Agenda Diária
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 capitalize">
                {currentDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Voltar para Semana
            </button>
          </div>

          {/* Horários do Dia */}
          <div className="space-y-3 divide-y divide-slate-100">
            {CALENDAR_HOURS.map((hour) => {
              const hourOrders = filteredPedidos.filter((p) => {
                if (!p.data_instalacao || !isSameDay(new Date(p.data_instalacao), currentDate)) return false;
                const h = new Date(p.data_instalacao).getHours();
                return h === hour;
              });

              return (
                <div key={hour} className="pt-3 flex items-start gap-4">
                  {/* Coluna da Hora */}
                  <div className="w-16 shrink-0 text-xs font-bold text-slate-400 font-mono pt-1">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Conteúdo da Hora */}
                  <div className="flex-1">
                    {hourOrders.length === 0 ? (
                      <div className="h-8 border-b border-dashed border-slate-100 flex items-center text-[11px] text-slate-300">
                        Disponível
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hourOrders.map((order) => {
                          const styles = getEventBadgeStyle(order.status);
                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedEvent(order)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${styles.card}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${styles.timeBadge}`}>
                                  {new Date(order.data_instalacao!).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenReschedule(order, e)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                                >
                                  Remarcar
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                                {order.cliente?.nome}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                Técnico: <b>{order.tecnico?.nome || 'A definir'}</b>
                              </p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                {order.cliente?.endereco}
                              </p>
                            </div>
                          );
                        })}
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