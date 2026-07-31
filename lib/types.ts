export type TripStatus = 'planning' | 'upcoming' | 'active' | 'completed';

export interface Participant {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: 'organizer' | 'member';
}

export interface Photo {
  id: string;
  url: string;
  storagePath?: string;
  emoji: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
  bg: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  endTime?: string;
  type: 'transport' | 'activity' | 'accommodation' | 'food';
  location?: string;
}

export interface Message {
  id: string;
  tripId: string;
  userId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'hotel' | 'other';
  title: string;
  from: string;
  to: string;
  date: string;
  time?: string;
  duration?: string;
  passengers: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  reference?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'new' | 'done';
  assigneeId?: string;
  assigneeName?: string;
}

export interface Payment {
  id: string;
  name: string;
  description?: string;
  cost: number;
  paidById?: string;
  paidByName?: string;
  attachmentPath?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  bg: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  participants: Participant[];
  photos: Photo[];
  plans: Plan[];
  tickets: Ticket[];
  tasks: Task[];
  payments: Payment[];
}
