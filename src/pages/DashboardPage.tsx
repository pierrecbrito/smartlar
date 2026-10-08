import React from 'react';
import { usePedidos } from '../hooks/queries/usePedidos';
import { useTecnicosQuery } from '../hooks/queries/useSharedData';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { DashboardAgenda } from '../components/dashboard/DashboardAgenda';
import { DashboardPendingApprovals } from '../components/dashboard/DashboardPendingApprovals';
import { DashboardTechnicians } from '../components/dashboard/DashboardTechnicians';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data: pedidos = [], isLoading: loadingPedidos } = usePedidos();
  const { data: tecnicos = [], isLoading: loadingTecnicos } = useTecnicosQuery();

  const loading = loadingPedidos || loadingTecnicos;

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
