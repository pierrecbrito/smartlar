import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatusPedido } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export const STATUS_CONFIG: Record<
  StatusPedido,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  orcamento: {
    label: 'Orçamento',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Aguardando aprovação do cliente',
  },
  aprovado: {
    label: 'Aprovado',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    desc: 'Pendente de agendamento de técnico e data',
  },
  agendado: {
    label: 'Agendado',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    desc: 'Técnico e data alocados',
  },
  em_andamento: {
    label: 'Em Andamento',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    desc: 'Técnico executando o serviço no local',
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    desc: 'Instalação finalizada e faturada',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    desc: 'Pedido cancelado',
  },
};

// Transições válidas do banco (reflete trg_pedidos_before_update)
export const PROXIMOS_STATUS: Record<StatusPedido, StatusPedido[]> = {
  orcamento: ['aprovado', 'cancelado'],
  aprovado: ['agendado', 'cancelado'],
  agendado: ['em_andamento'],
  em_andamento: ['concluido'],
  concluido: [],
  cancelado: [],
};
