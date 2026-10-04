import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Pedido, Tecnico } from '../../types/database';
import { formatCurrency, formatOrderCode, getCurrentDateTimeLocal, formatDateTime } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';

interface ScheduleModalProps {
  pedido: Pedido | null;
  tecnicos: Tecnico[];
  allPedidos: Pedido[];
  onClose: () => void;
  onSuccess: (pedidoId: string, tecnicoId: string, isoDate: string, tecnico: Tecnico) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  pedido, 
  tecnicos, 
  allPedidos, 
  onClose, 
  onSuccess, 
  showToast 
}) => {
  const [scheduleTecnicoId, setScheduleTecnicoId] = useState(pedido?.tecnico_id || (tecnicos[0]?.id || ''));
  const [scheduleData, setScheduleData] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    if (pedido) {
      setScheduleTecnicoId(pedido.tecnico_id || (tecnicos[0]?.id || ''));
      setScheduleData('');
    }
  }, [pedido, tecnicos]);

  const schedulingConflict = useMemo(() => {
    if (!pedido || !scheduleTecnicoId || !scheduleData) return null;
    const targetTime = new Date(scheduleData).getTime();
    if (isNaN(targetTime)) return null;

    return allPedidos.find((p) => {
      if (p.id === pedido.id) return false;
      if (p.tecnico_id !== scheduleTecnicoId) return false;
      if (p.status !== 'agendado' && p.status !== 'em_andamento') return false;
      if (!p.data_instalacao) return false;

      const orderTime = new Date(p.data_instalacao).getTime();
      const diffHours = Math.abs(orderTime - targetTime) / (1000 * 60 * 60);
      return diffHours < 2;
    });
  }, [pedido, scheduleTecnicoId, scheduleData, allPedidos]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;

    if (!scheduleTecnicoId || !scheduleData) {
      showToast('error', 'Campos obrigatórios', 'Técnico e Data/Horário são obrigatórios para agendar.');
      return;
    }

    const selectedTime = new Date(scheduleData).getTime();
    if (isNaN(selectedTime) || selectedTime < Date.now() - 60000) {
      showToast('error', 'Data retroativa', 'A data e horário de instalação não podem ser no passado.');
      return;
    }

    setSavingSchedule(true);
    try {
      const isoDate = new Date(scheduleData).toISOString();
      const tecnicoObj = tecnicos.find((t) => t.id === scheduleTecnicoId);

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'agendado',
          tecnico_id: scheduleTecnicoId,
          data_instalacao: isoDate,
        })
        .eq('id', pedido.id);

      if (error) throw error;

      showToast(
        'success',
        'Instalação agendada com sucesso!',
        `Data e técnico registrados com sucesso no sistema.`
      );

      onSuccess(pedido.id, scheduleTecnicoId, isoDate, tecnicoObj as Tecnico);
      onClose();
    } catch (err: any) {
      console.error('Erro ao agendar:', err);
      showToast('error', 'Falha ao gravar agendamento', err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  if (!pedido) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Agendar Instalação
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Pedido {formatOrderCode(pedido)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-950 space-y-1">
              <p><b>Cliente:</b> {pedido.cliente?.nome}</p>
              <p><b>Endereço:</b> {pedido.cliente?.endereco}</p>
              <p><b>Total do Pedido:</b> {formatCurrency(pedido.valor_total)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Técnico Responsável *
              </label>
              <select
                required
                value={scheduleTecnicoId}
                onChange={(e) => setScheduleTecnicoId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Selecione o técnico --</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.especialidade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data e Horário *
              </label>
              <input
                type="datetime-local"
                required
                min={getCurrentDateTimeLocal()}
                value={scheduleData}
                onChange={(e) => setScheduleData(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {schedulingConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Aviso de Proximidade de Horário</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    O técnico selecionado já possui o pedido <b>{formatOrderCode(schedulingConflict)}</b> agendado próximo a esse horário ({formatDateTime(schedulingConflict.data_instalacao)}). Verifique a viabilidade de deslocamento.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingSchedule}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingSchedule ? 'Salvando agendamento...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
