import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Bloco base animado para estados de carregamento progressivo. */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} aria-hidden="true" />
);

/** Lista de linhas/cartões genéricos (Clientes, Pedidos, Produtos...). */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3" role="status" aria-label="Carregando">
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-4"
      >
        <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

/** Grade de cartões de produto. */
export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 6 }) => (
  <div
    className="grid grid-cols-2 xl:grid-cols-3 gap-4"
    role="status"
    aria-label="Carregando"
  >
    {Array.from({ length: cards }, (_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

/** Esqueleto do calendário da Agenda. */
export const AgendaSkeleton: React.FC = () => (
  <div
    className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs"
    role="status"
    aria-label="Carregando agenda"
  >
    <div className="grid grid-cols-7 gap-2 mb-3">
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 21 }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  </div>
);
