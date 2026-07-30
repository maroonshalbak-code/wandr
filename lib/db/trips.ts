import { createClient } from '@/lib/supabase/client';
import { Trip, Participant, Photo, Plan, Ticket, TripStatus, Message } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────

function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    destination: (row.destination as string) ?? '',
    emoji: (row.emoji as string) ?? '🌍',
    bg: (row.bg as string) ?? '#dbeafe',
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    status: row.status as TripStatus,
    participants: [],
    photos: [],
    plans: [],
    tickets: [],
  };
}

function rowToParticipant(row: Record<string, unknown>): Participant {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? '',
    initials: (row.initials as string) ?? '?',
    color: (row.color as string) ?? '#3b82f6',
    role: row.role as 'organizer' | 'member',
  };
}

function rowToPhoto(row: Record<string, unknown>): Photo {
  return {
    id: row.id as string,
    url: (row.url as string) ?? '',
    emoji: (row.emoji as string) ?? '📸',
    caption: (row.caption as string) ?? '',
    uploadedBy: (row.uploaded_by_name as string) ?? 'Unknown',
    uploadedAt: ((row.uploaded_at as string) ?? '').slice(0, 10),
    bg: (row.bg as string) ?? '#dbeafe',
    storagePath: (row.storage_path as string) ?? undefined,
  } as Photo;
}

function rowToPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    date: row.date as string,
    time: (row.time as string) ?? undefined,
    type: row.type as Plan['type'],
    location: (row.location as string) ?? undefined,
  };
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    senderName: (row.sender_name as string) ?? 'Unknown',
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

function rowToTicket(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    type: row.type as Ticket['type'],
    title: (row.title as string) ?? '',
    from: (row.from_place as string) ?? '',
    to: (row.to_place as string) ?? '',
    date: (row.date as string) ?? '',
    time: (row.time as string) ?? undefined,
    duration: (row.duration as string) ?? undefined,
    passengers: (row.passengers as number) ?? 1,
    status: row.status as Ticket['status'],
    reference: (row.reference as string) ?? undefined,
  };
}

// ── Trips ─────────────────────────────────────────────────────

export async function fetchTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get trips where user is a participant or creator
  const { data: participantRows } = await supabase
    .from('participants')
    .select('trip_id')
    .eq('user_id', user.id);

  const participantTripIds = (participantRows ?? []).map((r) => r.trip_id as string);

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .or(`created_by.eq.${user.id},id.in.(${participantTripIds.join(',') || 'null'})`)
    .order('start_date', { ascending: true });

  if (!trips?.length) return [];

  const tripIds = trips.map((t) => t.id as string);

  // Fetch all related data in parallel
  const [{ data: participants }, { data: photos }, { data: plans }, { data: tickets }] =
    await Promise.all([
      supabase.from('participants').select('*').in('trip_id', tripIds),
      supabase.from('photos').select('*').in('trip_id', tripIds).order('uploaded_at', { ascending: false }),
      supabase.from('plans').select('*').in('trip_id', tripIds).order('date').order('time'),
      supabase.from('tickets').select('*').in('trip_id', tripIds).order('date'),
    ]);

  return trips.map((t) => ({
    ...rowToTrip(t as Record<string, unknown>),
    participants: (participants ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToParticipant(p as Record<string, unknown>)),
    photos: (photos ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToPhoto(p as Record<string, unknown>)),
    plans: (plans ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToPlan(p as Record<string, unknown>)),
    tickets: (tickets ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToTicket(p as Record<string, unknown>)),
  }));
}

export async function insertTrip(data: Omit<Trip, 'id' | 'participants' | 'photos' | 'plans' | 'tickets'>): Promise<Trip> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      name: data.name,
      destination: data.destination,
      emoji: data.emoji,
      bg: data.bg,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-add the creator as organizer participant
  const initials = (user.user_metadata?.name as string ?? user.email ?? 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  await supabase.from('participants').insert({
    trip_id: trip.id,
    user_id: user.id,
    name: (user.user_metadata?.name as string) ?? user.email ?? 'You',
    email: user.email,
    initials,
    color: '#3b82f6',
    role: 'organizer',
  });

  return { ...rowToTrip(trip as Record<string, unknown>), participants: [], photos: [], plans: [], tickets: [] };
}

// ── Participants ───────────────────────────────────────────────

export async function insertParticipant(tripId: string, data: Omit<Participant, 'id'>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('participants')
    .insert({ trip_id: tripId, name: data.name, email: data.email, initials: data.initials, color: data.color, role: data.role })
    .select().single();
  if (error) throw error;
  return rowToParticipant(row as Record<string, unknown>);
}

export async function deleteParticipant(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) throw error;
}

// ── Photos ────────────────────────────────────────────────────

export async function insertPhoto(tripId: string, data: Omit<Photo, 'id'> & { storagePath?: string }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: row, error } = await supabase
    .from('photos')
    .insert({
      trip_id: tripId,
      url: data.url,
      storage_path: data.storagePath,
      emoji: data.emoji,
      caption: data.caption,
      bg: data.bg,
      uploaded_by: user?.id,
    })
    .select().single();
  if (error) throw error;
  return rowToPhoto({ ...row as Record<string, unknown>, uploaded_by_name: user?.user_metadata?.name ?? user?.email ?? 'You' });
}

export async function deletePhoto(id: string, storagePath?: string) {
  const supabase = createClient();
  if (storagePath) {
    await supabase.storage.from('trip-photos').remove([storagePath]);
  }
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
}

// ── Plans ─────────────────────────────────────────────────────

export async function insertPlan(tripId: string, data: Omit<Plan, 'id'>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('plans')
    .insert({ trip_id: tripId, title: data.title, description: data.description, date: data.date, time: data.time, type: data.type, location: data.location ?? null })
    .select().single();
  if (error) throw error;
  return rowToPlan(row as Record<string, unknown>);
}

export async function deletePlan(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
}

// ── Tickets ───────────────────────────────────────────────────

export async function insertTicket(tripId: string, data: Omit<Ticket, 'id'>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('tickets')
    .insert({
      trip_id: tripId,
      type: data.type,
      title: data.title,
      from_place: data.from,
      to_place: data.to,
      date: data.date,
      time: data.time,
      duration: data.duration,
      passengers: data.passengers,
      status: data.status,
      reference: data.reference,
    })
    .select().single();
  if (error) throw error;
  return rowToTicket(row as Record<string, unknown>);
}

export async function deleteTicket(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw error;
}

// ── Messages ──────────────────────────────────────────────────

export async function fetchMessages(tripId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToMessage(r as Record<string, unknown>));
}

export async function insertMessage(tripId: string, content: string): Promise<Message> {
  const supabase = createClient();
  // Use getSession() — reads JWT from cookie, no extra network round-trip
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');
  const senderName = (user.user_metadata?.name as string) ?? user.email ?? 'Someone';
  const { data: row, error } = await supabase
    .from('messages')
    .insert({ trip_id: tripId, user_id: user.id, sender_name: senderName, content })
    .select().single();
  if (error) throw error;
  return rowToMessage(row as Record<string, unknown>);
}
