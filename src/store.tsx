import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { businesses, sampleBookings, type Booking, type Business } from './data';
import { newId } from './utils';

/** Pantallas de la app. Navegación simple, sin librerías, para la primera versión. */
export type Route =
  | { name: 'home' }
  | { name: 'services'; businessId: string }
  | { name: 'professional' }
  | { name: 'datetime' }
  | { name: 'details' }
  | { name: 'confirmed'; bookingId: string }
  | { name: 'agenda'; businessId: string };

/** Lo que el cliente va eligiendo mientras reserva. */
export type Draft = {
  businessId: string;
  serviceIds: string[];
  /** null = "cualquiera disponible" */
  professionalId: string | null;
  start: string | null;
  /** Profesional asignado al elegir la hora (cuando eligió "cualquiera"). */
  assignedProfessionalId: string | null;
};

type Store = {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  reset: () => void;
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id'>) => Booking;
  togglePaid: (id: string) => void;
  cancelBooking: (id: string) => void;
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  business: (id: string) => Business;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);
  const [draft, setDraft] = useState<Draft | null>(null);

  const value = useMemo<Store>(
    () => ({
      route: stack[stack.length - 1],
      go: (r) => setStack((s) => [...s, r]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      reset: () => {
        setStack([{ name: 'home' }]);
        setDraft(null);
      },
      bookings,
      addBooking: (b) => {
        const booking = { ...b, id: newId() };
        setBookings((list) => [...list, booking]);
        return booking;
      },
      togglePaid: (id) =>
        setBookings((list) => list.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b))),
      cancelBooking: (id) => setBookings((list) => list.filter((b) => b.id !== id)),
      draft,
      setDraft,
      business: (id) => {
        const found = businesses.find((b) => b.id === id);
        if (!found) throw new Error(`Negocio no encontrado: ${id}`);
        return found;
      },
    }),
    [stack, bookings, draft],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore debe usarse dentro de StoreProvider');
  return s;
}
