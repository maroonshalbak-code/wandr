'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Trip, Participant, Photo, Plan, Ticket } from '@/lib/types';
import * as db from '@/lib/db/trips';

interface TripsContextValue {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getTrip: (id: string) => Trip | undefined;
  addTrip: (data: Omit<Trip, 'id' | 'participants' | 'photos' | 'plans' | 'tickets'>) => Promise<Trip>;
  addParticipant: (tripId: string, data: Omit<Participant, 'id'>) => Promise<void>;
  removeParticipant: (tripId: string, participantId: string) => Promise<void>;
  addPhoto: (tripId: string, data: Omit<Photo, 'id'> & { storagePath?: string }) => Promise<void>;
  removePhoto: (tripId: string, photoId: string) => Promise<void>;
  addPlan: (tripId: string, data: Omit<Plan, 'id'>) => Promise<void>;
  removePlan: (tripId: string, planId: string) => Promise<void>;
  addTicket: (tripId: string, data: Omit<Ticket, 'id'>) => Promise<void>;
  removeTicket: (tripId: string, ticketId: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.fetchTrips();
      setTrips(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, [reload]);

  const getTrip = (id: string) => trips.find((t) => t.id === id);

  const updateLocal = (id: string, updater: (t: Trip) => Trip) =>
    setTrips((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));

  const addTrip = async (data: Omit<Trip, 'id' | 'participants' | 'photos' | 'plans' | 'tickets'>) => {
    const trip = await db.insertTrip(data);
    setTrips((prev) => [trip, ...prev]);
    return trip;
  };

  const addParticipant = async (tripId: string, data: Omit<Participant, 'id'>) => {
    const p = await db.insertParticipant(tripId, data);
    updateLocal(tripId, (t) => ({ ...t, participants: [...t.participants, p] }));
  };

  const removeParticipant = async (tripId: string, participantId: string) => {
    await db.deleteParticipant(participantId);
    updateLocal(tripId, (t) => ({ ...t, participants: t.participants.filter((p) => p.id !== participantId) }));
  };

  const addPhoto = async (tripId: string, data: Omit<Photo, 'id'> & { storagePath?: string }) => {
    const ph = await db.insertPhoto(tripId, data);
    updateLocal(tripId, (t) => ({ ...t, photos: [ph, ...t.photos] }));
  };

  const removePhoto = async (tripId: string, photoId: string) => {
    const photo = getTrip(tripId)?.photos.find((p) => p.id === photoId);
    await db.deletePhoto(photoId, photo?.storagePath);
    updateLocal(tripId, (t) => ({ ...t, photos: t.photos.filter((p) => p.id !== photoId) }));
  };

  const addPlan = async (tripId: string, data: Omit<Plan, 'id'>) => {
    const pl = await db.insertPlan(tripId, data);
    updateLocal(tripId, (t) => ({
      ...t,
      plans: [...t.plans, pl].sort((a, b) =>
        `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`)
      ),
    }));
  };

  const removePlan = async (tripId: string, planId: string) => {
    await db.deletePlan(planId);
    updateLocal(tripId, (t) => ({ ...t, plans: t.plans.filter((p) => p.id !== planId) }));
  };

  const addTicket = async (tripId: string, data: Omit<Ticket, 'id'>) => {
    const tk = await db.insertTicket(tripId, data);
    updateLocal(tripId, (t) => ({ ...t, tickets: [...t.tickets, tk] }));
  };

  const removeTicket = async (tripId: string, ticketId: string) => {
    await db.deleteTicket(ticketId);
    updateLocal(tripId, (t) => ({ ...t, tickets: t.tickets.filter((tk) => tk.id !== ticketId) }));
  };

  return (
    <TripsContext.Provider value={{ trips, loading, error, reload, getTrip, addTrip, addParticipant, removeParticipant, addPhoto, removePhoto, addPlan, removePlan, addTicket, removeTicket }}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used inside TripsProvider');
  return ctx;
}
