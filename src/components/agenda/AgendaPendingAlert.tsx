import React from 'react';
import {
  AlertTriangle
} from 'lucide-react';
import { AgendaState } from '../../hooks/useAgenda';

interface Props {
  agenda: AgendaState;
}

export const AgendaPendingAlert: React.FC<Props> = ({ agenda }) => {
  const { pedidos, setPedidos, pedidosSemData, setPedidosSemData, tecnicos, setTecnicos, loading, setLoading, currentDate, setCurrentDate, viewMode, setViewMode, selectedTecnicoFilter, setSelectedTecnicoFilter, selectedStatusFilter, setSelectedStatusFilter, searchQuery, setSearchQuery, selectedEvent, setSelectedEvent, reschedulingOrder, setReschedulingOrder, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, rescheduleTecnicoId, setRescheduleTecnicoId, rescheduleObs, setRescheduleObs, savingReschedule, setSavingReschedule, showToast, loadData, conflitosPorTecnico, conflitoRemarcacao, weekStart, weekDays, monthDays, handlePrev, handleNext, handleToday, isToday, isSameDay, headerDateTitle, filteredPedidos, handleOpenReschedule, handleSaveReschedule, rescheduleConflict, handleUpdateStatus, getEventBadgeStyle } = agenda;

  return (
    <>
      {/* Alerta de pedidos aprovados aguardando agendamento (se houver) */}
      {pedidosSemData.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Há <b>{pedidosSemData.length}</b> {pedidosSemData.length === 1 ? 'instalação aprovada' : 'instalações aprovadas'} aguardando definição de data e técnico.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenReschedule(pedidosSemData[0])}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
          >
            Agendar Agora
          </button>
        </div>
      )}
    </>
  );
};