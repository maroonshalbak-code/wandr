import { Participant } from '@/lib/types';

export function Avatar({ participant, size = 'md' }: { participant: Pick<Participant, 'initials' | 'color' | 'name'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-medium text-white flex-shrink-0`}
      style={{ backgroundColor: participant.color }}
      title={participant.name}
    >
      {participant.initials}
    </div>
  );
}

export function AvatarStack({ participants, max = 4 }: { participants: Pick<Participant, 'initials' | 'color' | 'name'>[]; max?: number }) {
  const shown = participants.slice(0, max);
  const extra = participants.length - max;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div key={i} className={i > 0 ? '-ml-2' : ''}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium text-white border-2 border-white"
            style={{ backgroundColor: p.color }}
            title={p.name}
          >
            {p.initials}
          </div>
        </div>
      ))}
      {extra > 0 && (
        <div className="-ml-2 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-100 border-2 border-white">
          +{extra}
        </div>
      )}
    </div>
  );
}
