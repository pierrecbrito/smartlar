import React from 'react';
import { useAgenda } from '../hooks/useAgenda';
import { AgendaToolbar } from '../components/agenda/AgendaToolbar';
import { AgendaPendingAlert } from '../components/agenda/AgendaPendingAlert';
import { AgendaMobileView } from '../components/agenda/AgendaMobileView';
import { AgendaWeekView } from '../components/agenda/AgendaWeekView';
import { AgendaMonthView } from '../components/agenda/AgendaMonthView';
import { AgendaDayView } from '../components/agenda/AgendaDayView';
import { AgendaEventModal } from '../components/agenda/AgendaEventModal';
import { AgendaRescheduleModal } from '../components/agenda/AgendaRescheduleModal';
import { AgendaSkeleton } from '../components/Skeleton';

export const AgendaPage: React.FC = () => {
  const agenda = useAgenda();
  const isFirstLoad = agenda.loading && agenda.pedidos.length === 0;

  return (
    <div className="space-y-4 animate-fade-in text-slate-800 pb-12">
      <AgendaToolbar agenda={agenda} />
      <AgendaPendingAlert agenda={agenda} />

      {isFirstLoad ? (
        <AgendaSkeleton />
      ) : (
        <>
          <AgendaMobileView agenda={agenda} />
          <div className="hidden md:block space-y-4">
            <AgendaWeekView agenda={agenda} />
            <AgendaMonthView agenda={agenda} />
            <AgendaDayView agenda={agenda} />
          </div>
        </>
      )}

      <AgendaEventModal agenda={agenda} />
      <AgendaRescheduleModal agenda={agenda} />
    </div>
  );
};