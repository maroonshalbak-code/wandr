'use client';

import { TripStatus } from '@/lib/types';
import { useLang } from '@/context/LanguageContext';

const statusStyles: Record<TripStatus | 'confirmed' | 'pending' | 'cancelled', string> = {
  planning: 'bg-amber-100 text-amber-700',
  upcoming: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

// Map raw status → i18n key
const statusKey: Record<string, string> = {
  planning: 'statusPlanning',
  upcoming: 'statusUpcoming',
  active: 'statusActive',
  completed: 'statusCompleted',
  confirmed: 'statusConfirmed',
  pending: 'statusPending',
  cancelled: 'statusCancelled',
};

export default function Badge({ status }: { status: string }) {
  const { t } = useLang();
  const style = statusStyles[status as keyof typeof statusStyles] ?? 'bg-gray-100 text-gray-500';
  const label = statusKey[status] ? t(statusKey[status]) : status;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style}`}>
      {label}
    </span>
  );
}
