import { TripStatus } from '@/lib/types';

const statusStyles: Record<TripStatus | 'confirmed' | 'pending' | 'cancelled', string> = {
  planning: 'bg-amber-100 text-amber-700',
  upcoming: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

export default function Badge({ status }: { status: string }) {
  const style = statusStyles[status as keyof typeof statusStyles] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
