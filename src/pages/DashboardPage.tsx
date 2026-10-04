import React, { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare,
  AlertCircle,
  Wallet,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Users,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Send,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pedido, Tecnico } from '../types/database';
import { useToast } from '../components/Toast';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { DashboardAgenda } from '../components/dashboard/DashboardAgenda';
import { DashboardPendingApprovals } from '../components/dashboard/DashboardPendingApprovals';
import { DashboardTechnicians } from '../components/dashboard/DashboardTechnicians';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, tecnicosRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(*),
            tecnico:tecnicos(*),
            itens:itens_pedido(*, produto:produtos(*))
          `)
          .order('created_at', { ascending: false }),
        supabase.from('tecnicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (tecnicosRes.error) throw tecnicosRes.error;

      setPedidos((pedidosRes.data || []) as Pedido[]);
      setTecnicos((tecnicosRes.data || []) as Tecnico[]);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      showToast('error', 'Falha ao sincronizar dados', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);





  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-16">




      <DashboardMetrics pedidos={pedidos} loading={loading} onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <DashboardAgenda pedidos={pedidos} onNavigate={onNavigate} />
        <DashboardPendingApprovals pedidos={pedidos} onNavigate={onNavigate} />
      </div>

      <DashboardTechnicians pedidos={pedidos} tecnicos={tecnicos} onNavigate={onNavigate} />
    </div>
  );
};
