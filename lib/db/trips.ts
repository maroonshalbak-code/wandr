import { createClient } from '@/lib/supabase/client';
import { Trip, Participant, Photo, Plan, Ticket, TripStatus, Message, Task, Payment } from '@/lib/types';

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
    tasks: [],
    payments: [],
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
    time: (row.time as string)?.slice(0, 5) ?? undefined,
    endTime: (row.end_time as string)?.slice(0, 5) ?? undefined,
    endDate: (row.end_date as string) ?? undefined,
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

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    status: (row.status === 'done' ? 'done' : 'new') as Task['status'],
    assigneeId: (row.assignee_id as string) ?? undefined,
    assigneeName: (row.assignee_name as string) ?? undefined,
  };
}

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    cost: Number(row.cost ?? 0),
    paidById: (row.paid_by_id as string) ?? undefined,
    paidByName: (row.paid_by_name as string) ?? undefined,
    attachmentPath: (row.attachment_path as string) ?? undefined,
    attachmentUrl: (row.attachment_url as string) ?? undefined,
    createdAt: (row.created_at as string) ?? '',
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
  // Match by user_id AND by email (for participants added before they signed up)
  const [{ data: participantRows }, { data: emailRows }] = await Promise.all([
    supabase.from('participants').select('trip_id').eq('user_id', user.id),
    supabase.from('participants').select('trip_id').eq('email', user.email ?? ''),
  ]);

  const participantTripIds = [
    ...(participantRows ?? []).map((r) => r.trip_id as string),
    ...(emailRows ?? []).map((r) => r.trip_id as string),
  ];
  const uniqueTripIds = [...new Set(participantTripIds)];

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .or(`created_by.eq.${user.id},id.in.(${uniqueTripIds.join(',') || 'null'})`)
    .order('start_date', { ascending: true });

  if (!trips?.length) return [];

  const tripIds = trips.map((t) => t.id as string);

  // Fetch all related data in parallel.
  // tasks is fetched separately so a missing tasks table never kills the whole load.
  const [{ data: participants }, { data: photos }, { data: plans }, { data: tickets }] =
    await Promise.all([
      supabase.from('participants').select('*').in('trip_id', tripIds),
      supabase.from('photos').select('*').in('trip_id', tripIds).order('uploaded_at', { ascending: false }),
      supabase.from('plans').select('*').in('trip_id', tripIds).order('date').order('time'),
      supabase.from('tickets').select('*').in('trip_id', tripIds).order('date'),
    ]);
  const { data: tasks } = await supabase.from('tasks').select('*').in('trip_id', tripIds).order('created_at');
  const { data: payments } = await supabase.from('payments').select('*').in('trip_id', tripIds).order('created_at');

  return trips.map((t) => ({
    ...rowToTrip(t as Record<string, unknown>),
    participants: (participants ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToParticipant(p as Record<string, unknown>)),
    photos: (photos ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToPhoto(p as Record<string, unknown>)),
    plans: (plans ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToPlan(p as Record<string, unknown>)),
    tickets: (tickets ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToTicket(p as Record<string, unknown>)),
    tasks: (tasks ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToTask(p as Record<string, unknown>)),
    payments: (payments ?? []).filter((p) => p.trip_id === t.id).map((p) => rowToPayment(p as Record<string, unknown>)),
  }));
}

export async function insertTrip(data: Omit<Trip, 'id' | 'participants' | 'photos' | 'plans' | 'tickets' | 'tasks' | 'payments'>): Promise<Trip> {
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
  const organizerName = (user.user_metadata?.name as string) ?? user.email ?? 'You';
  const initials = organizerName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const { data: participantRow } = await supabase.from('participants').insert({
    trip_id: trip.id,
    user_id: user.id,
    name: organizerName,
    email: user.email,
    initials,
    color: '#3b82f6',
    role: 'organizer',
  }).select().single();

  const organizer: Participant = {
    id: (participantRow as Record<string, unknown>)?.id as string ?? '',
    name: organizerName,
    email: user.email ?? '',
    initials,
    color: '#3b82f6',
    role: 'organizer',
  };

  return { ...rowToTrip(trip as Record<string, unknown>), participants: [organizer], photos: [], plans: [], tickets: [], tasks: [], payments: [] };
}

export async function deleteTrip(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
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
    .insert({ trip_id: tripId, title: data.title, description: data.description, date: data.date, time: data.time ?? null, end_time: data.endTime ?? null, end_date: data.endDate ?? null, type: data.type, location: data.location ?? null })
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

// ── Tasks ─────────────────────────────────────────────────────

export async function insertTask(tripId: string, data: Omit<Task, 'id'>) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({
      trip_id: tripId,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      assignee_id: data.assigneeId ?? null,
      assignee_name: data.assigneeName ?? null,
      created_by: session?.user?.id ?? null,
    })
    .select().single();
  if (error) throw error;
  return rowToTask(row as Record<string, unknown>);
}

export async function updateTask(id: string, updates: Partial<Pick<Task, 'status' | 'title' | 'description' | 'assigneeId' | 'assigneeName'>>) {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.assigneeId !== undefined) patch.assignee_id = updates.assigneeId;
  if (updates.assigneeName !== undefined) patch.assignee_name = updates.assigneeName;
  const { data: row, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return rowToTask(row as Record<string, unknown>);
}

export async function deleteTask(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ── Payments ──────────────────────────────────────────────────

export async function insertPayment(tripId: string, data: Omit<Payment, 'id' | 'createdAt'>, file?: File): Promise<Payment> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  let attachmentPath: string | undefined;
  let attachmentUrl: string | undefined;

  if (file) {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `payment-attachments/${tripId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('trip-photos').getPublicUrl(path);
    attachmentPath = path;
    attachmentUrl = urlData.publicUrl;
  }

  const { data: row, error } = await supabase
    .from('payments')
    .insert({
      trip_id: tripId,
      name: data.name,
      description: data.description ?? null,
      cost: data.cost,
      paid_by_id: data.paidById ?? null,
      paid_by_name: data.paidByName ?? null,
      attachment_path: attachmentPath ?? null,
      attachment_url: attachmentUrl ?? null,
      created_by: user.id,
    })
    .select().single();

  if (error) throw error;
  return rowToPayment(row as Record<string, unknown>);
}

export async function deletePayment(id: string, attachmentPath?: string) {
  const supabase = createClient();
  if (attachmentPath) {
    await supabase.storage.from('trip-photos').remove([attachmentPath]);
  }
  const { error } = await supabase.from('payments').delete().eq('id', id);
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
