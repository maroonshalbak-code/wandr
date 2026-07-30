import { Trip } from './types';

export const mockTrips: Trip[] = [
  {
    id: '1',
    name: 'Japan — Tokyo & Kyoto',
    destination: 'Japan',
    emoji: '🇯🇵',
    bg: '#dbeafe',
    startDate: '2026-08-11',
    endDate: '2026-08-22',
    status: 'upcoming',
    participants: [
      { id: 'p1', name: 'Maroon', email: 'maroon.shalbak@consensys.net', initials: 'MA', color: '#3b82f6', role: 'organizer' },
      { id: 'p2', name: 'Sara Alibek', email: 'sara@example.com', initials: 'SA', color: '#10b981', role: 'member' },
      { id: 'p3', name: 'Khalil Lara', email: 'khalil@example.com', initials: 'KL', color: '#f59e0b', role: 'member' },
      { id: 'p4', name: 'Nadia Jabr', email: 'nadia@example.com', initials: 'NJ', color: '#8b5cf6', role: 'member' },
    ],
    photos: [
      { id: 'ph1', url: '', emoji: '⛩️', caption: 'Senso-ji Temple', uploadedBy: 'Maroon', uploadedAt: '2026-08-12', bg: '#dbeafe' },
      { id: 'ph2', url: '', emoji: '🗼', caption: 'Tokyo Tower at night', uploadedBy: 'Sara Alibek', uploadedAt: '2026-08-13', bg: '#fef3c7' },
      { id: 'ph3', url: '', emoji: '🌸', caption: 'Cherry blossoms in Ueno', uploadedBy: 'Khalil Lara', uploadedAt: '2026-08-14', bg: '#dcfce7' },
      { id: 'ph4', url: '', emoji: '🎎', caption: 'Kimono fitting in Kyoto', uploadedBy: 'Nadia Jabr', uploadedAt: '2026-08-16', bg: '#fce7f3' },
      { id: 'ph5', url: '', emoji: '🏔️', caption: 'View of Mt Fuji', uploadedBy: 'Maroon', uploadedAt: '2026-08-18', bg: '#ede9fe' },
      { id: 'ph6', url: '', emoji: '🍣', caption: 'Tsukiji market breakfast', uploadedBy: 'Sara Alibek', uploadedAt: '2026-08-13', bg: '#fef9c3' },
    ],
    plans: [
      { id: 'pl1', title: 'Arrive at Narita Airport', description: 'Flight NH205 · Terminal 1', date: '2026-08-11', time: '14:30', type: 'transport' },
      { id: 'pl2', title: 'Hotel check-in', description: 'Park Hotel Tokyo · Shiodome', date: '2026-08-11', time: '16:00', type: 'accommodation' },
      { id: 'pl3', title: 'Senso-ji Temple', description: 'Asakusa, Tokyo', date: '2026-08-12', time: '09:00', type: 'activity' },
      { id: 'pl4', title: 'Ramen lunch in Shinjuku', description: 'Ichiran Ramen', date: '2026-08-12', time: '12:30', type: 'food' },
      { id: 'pl5', title: 'Shinkansen to Kyoto', description: 'Nozomi 7 · 09:10 → 10:51', date: '2026-08-15', time: '09:10', type: 'transport' },
      { id: 'pl6', title: 'Fushimi Inari Shrine', description: 'Early morning hike', date: '2026-08-16', time: '06:00', type: 'activity' },
      { id: 'pl7', title: 'Arashiyama Bamboo Grove', description: 'Bring the camera', date: '2026-08-17', time: '08:30', type: 'activity' },
      { id: 'pl8', title: 'Return flight departs', description: 'Flight NH206 · Terminal 2', date: '2026-08-22', time: '23:55', type: 'transport' },
    ],
    tickets: [
      { id: 't1', type: 'flight', title: 'Outbound flight', from: 'DXB', to: 'NRT', date: '2026-08-11', time: '02:15', duration: '9h 45m', passengers: 4, status: 'confirmed', reference: 'NH205' },
      { id: 't2', type: 'train', title: 'Shinkansen', from: 'Tokyo', to: 'Kyoto', date: '2026-08-15', time: '09:10', duration: '1h 41m', passengers: 4, status: 'confirmed', reference: 'Nozomi 7' },
      { id: 't3', type: 'flight', title: 'Return flight', from: 'NRT', to: 'DXB', date: '2026-08-22', time: '23:55', duration: '9h 45m', passengers: 4, status: 'pending', reference: 'NH206' },
    ],
    tasks: [],
  },
  {
    id: '2',
    name: 'Portugal road trip',
    destination: 'Portugal',
    emoji: '🇵🇹',
    bg: '#dcfce7',
    startDate: '2026-09-04',
    endDate: '2026-09-10',
    status: 'planning',
    participants: [
      { id: 'p1', name: 'Maroon', email: 'maroon.shalbak@consensys.net', initials: 'MA', color: '#3b82f6', role: 'organizer' },
      { id: 'p5', name: 'Lena Voss', email: 'lena@example.com', initials: 'LV', color: '#ef4444', role: 'member' },
    ],
    photos: [
      { id: 'ph7', url: '', emoji: '🏖️', caption: 'Algarve beach', uploadedBy: 'Maroon', uploadedAt: '2026-09-06', bg: '#dbeafe' },
      { id: 'ph8', url: '', emoji: '🏰', caption: 'Sintra palace', uploadedBy: 'Lena Voss', uploadedAt: '2026-09-08', bg: '#fef3c7' },
      { id: 'ph9', url: '', emoji: '🍷', caption: 'Wine tasting in Douro', uploadedBy: 'Maroon', uploadedAt: '2026-09-09', bg: '#fce7f3' },
    ],
    plans: [
      { id: 'pl9', title: 'Arrive in Lisbon', description: 'TP1400 from DXB', date: '2026-09-04', time: '10:00', type: 'transport' },
      { id: 'pl10', title: 'Sintra day trip', description: 'Palácio da Pena', date: '2026-09-05', time: '09:00', type: 'activity' },
    ],
    tickets: [
      { id: 't4', type: 'flight', title: 'Outbound flight', from: 'DXB', to: 'LIS', date: '2026-09-04', time: '02:00', duration: '7h', passengers: 2, status: 'confirmed', reference: 'TP1400' },
    ],
    tasks: [],
  },
  {
    id: '3',
    name: 'Italy — Amalfi coast',
    destination: 'Italy',
    emoji: '🇮🇹',
    bg: '#fef3c7',
    startDate: '2026-05-02',
    endDate: '2026-05-09',
    status: 'completed',
    participants: [
      { id: 'p1', name: 'Maroon', email: 'maroon.shalbak@consensys.net', initials: 'MA', color: '#3b82f6', role: 'organizer' },
      { id: 'p2', name: 'Sara Alibek', email: 'sara@example.com', initials: 'SA', color: '#10b981', role: 'member' },
      { id: 'p3', name: 'Khalil Lara', email: 'khalil@example.com', initials: 'KL', color: '#f59e0b', role: 'member' },
    ],
    photos: [
      { id: 'ph10', url: '', emoji: '🌊', caption: 'Positano from the sea', uploadedBy: 'Maroon', uploadedAt: '2026-05-03', bg: '#dbeafe' },
      { id: 'ph11', url: '', emoji: '🍋', caption: 'Limoncello in Ravello', uploadedBy: 'Sara Alibek', uploadedAt: '2026-05-05', bg: '#fef3c7' },
      { id: 'ph12', url: '', emoji: '⛵', caption: 'Boat tour along the coast', uploadedBy: 'Khalil Lara', uploadedAt: '2026-05-06', bg: '#dcfce7' },
    ],
    plans: [
      { id: 'pl11', title: 'Arrive in Naples', description: 'Transfer to Amalfi', date: '2026-05-02', time: '12:00', type: 'transport' },
      { id: 'pl12', title: 'Positano walk', description: 'Via Pasitea trail', date: '2026-05-03', time: '10:00', type: 'activity' },
    ],
    tickets: [
      { id: 't5', type: 'flight', title: 'Outbound flight', from: 'DXB', to: 'NAP', date: '2026-05-02', time: '06:00', duration: '6h 30m', passengers: 3, status: 'confirmed', reference: 'EK095' },
    ],
    tasks: [],
  },
];
