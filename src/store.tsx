import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  categoryOf,
  sampleBookings,
  seedAccounts,
  seedBusinesses,
  templateServices,
  proColors,
  type Account,
  type Booking,
  type Business,
  type CategoryId,
} from './data';
import { newId } from './utils';

/** Pantallas que se apilan sobre la pantalla principal. */
export type Route =
  | { name: 'welcome' }
  | { name: 'login' }
  | { name: 'register'; role: 'client' | 'business' }
  | { name: 'main' }
  | { name: 'business'; businessId: string }
  | { name: 'professional' }
  | { name: 'datetime' }
  | { name: 'details' }
  | { name: 'confirmed'; bookingId: string }
  | { name: 'bookingDetail'; bookingId: string }
  | { name: 'newBooking'; start?: string; professionalId?: string }
  | { name: 'serviceEdit'; serviceId?: string };

export type ClientTab = 'home' | 'search' | 'bookings' | 'profile';
export type BusinessTab = 'agenda' | 'clients' | 'services' | 'settings';

export type Session = { role: 'guest' } | { role: 'client' | 'business'; accountId: string } | null;

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

type Persisted = {
  version: 2;
  session: Session;
  accounts: Account[];
  businesses: Business[];
  bookings: Booking[];
  guestBookingIds: string[];
};

const STORAGE_KEY = 'pidohora-demo-v2';

function initialData(): Persisted {
  return {
    version: 2,
    session: null,
    accounts: seedAccounts,
    businesses: seedBusinesses,
    bookings: sampleBookings(),
    guestBookingIds: [],
  };
}

// En web guardamos los datos de prueba en el navegador para que no se pierdan al recargar.
// En el celular, por ahora, viven en memoria. La versión real usará la base de datos.
function load(): Persisted {
  if (Platform.OS !== 'web') return initialData();
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed.version === 2) return parsed;
    }
  } catch {
    // almacenamiento bloqueado: seguimos con los datos de ejemplo
  }
  return initialData();
}

function save(data: Persisted) {
  if (Platform.OS !== 'web') return;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sin almacenamiento disponible, no pasa nada
  }
}

type RegisterInput = {
  role: 'client' | 'business';
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName?: string;
  category?: CategoryId;
  comuna?: string;
  address?: string;
};

type Store = {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  /** Vuelve a la pantalla principal (pestañas). */
  home: () => void;

  session: Session;
  account: Account | null;
  login: (email: string, password: string) => string | null;
  register: (input: RegisterInput) => string | null;
  continueAsGuest: () => void;
  logout: () => void;

  clientTab: ClientTab;
  setClientTab: (t: ClientTab) => void;
  businessTab: BusinessTab;
  setBusinessTab: (t: BusinessTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchCategory: CategoryId | null;
  setSearchCategory: (c: CategoryId | null) => void;

  businesses: Business[];
  business: (id: string) => Business;
  myBusiness: Business | null;
  updateBusiness: (id: string, patch: Partial<Business>) => void;

  bookings: Booking[];
  myBookings: Booking[];
  addBooking: (b: Omit<Booking, 'id'>) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;

  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  startBooking: (businessId: string, serviceIds?: string[]) => void;

  resetDemo: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(load);
  const [stack, setStack] = useState<Route[]>(() => [data.session ? { name: 'main' } : { name: 'welcome' }]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('home');
  const [businessTab, setBusinessTab] = useState<BusinessTab>('agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<CategoryId | null>(null);

  useEffect(() => save(data), [data]);

  const value = useMemo<Store>(() => {
    const account =
      data.session && data.session.role !== 'guest'
        ? (data.accounts.find((a) => a.id === (data.session as { accountId: string }).accountId) ?? null)
        : null;
    const myBusiness =
      account?.role === 'business' ? (data.businesses.find((b) => b.id === account.businessId) ?? null) : null;

    const myBookings =
      data.session?.role === 'guest'
        ? data.bookings.filter((b) => data.guestBookingIds.includes(b.id))
        : account?.role === 'client'
          ? data.bookings.filter((b) => b.clientAccountId === account.id)
          : [];

    const enterMain = () => {
      setStack([{ name: 'main' }]);
      setClientTab('home');
      setBusinessTab('agenda');
    };

    return {
      route: stack[stack.length - 1],
      go: (r) => setStack((s) => [...s, r]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      home: () => setStack((s) => [s[0]]),

      session: data.session,
      account,
      login: (email, password) => {
        const acc = data.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!acc || acc.password !== password) return 'El correo o la contraseña no coinciden.';
        setData((d) => ({ ...d, session: { role: acc.role, accountId: acc.id } }));
        enterMain();
        return null;
      },
      register: (input) => {
        if (data.accounts.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) {
          return 'Ya existe una cuenta con ese correo. Prueba iniciando sesión.';
        }
        const accountId = newId();
        let businessId: string | undefined;
        let newBusiness: Business | undefined;
        if (input.role === 'business') {
          const cat = input.category ?? 'barberia';
          businessId = `${slug(input.businessName ?? 'mi-negocio')}-${accountId.slice(0, 4)}`;
          newBusiness = {
            id: businessId,
            name: input.businessName!.trim(),
            category: cat,
            emoji: categoryOf(cat).emoji,
            comuna: input.comuna?.trim() || 'Santiago',
            address: input.address?.trim() || '',
            description: '',
            rating: 0,
            reviewsCount: 0,
            visits: 0,
            hours: {
              1: { open: 10, close: 19 },
              2: { open: 10, close: 19 },
              3: { open: 10, close: 19 },
              4: { open: 10, close: 19 },
              5: { open: 10, close: 19 },
              6: { open: 10, close: 14 },
            },
            services: templateServices[cat].map((s) => ({ ...s, id: newId() })),
            professionals: [{ id: newId(), name: input.name.trim().split(' ')[0], role: 'Dueño/a', color: proColors[0] }],
            reviews: [],
            isNew: true,
          };
        }
        const acc: Account = {
          id: accountId,
          role: input.role,
          name: input.name.trim(),
          email: input.email.trim(),
          password: input.password,
          phone: input.phone.trim(),
          businessId,
        };
        setData((d) => ({
          ...d,
          accounts: [...d.accounts, acc],
          businesses: newBusiness ? [...d.businesses, newBusiness] : d.businesses,
          session: { role: acc.role, accountId },
        }));
        enterMain();
        return null;
      },
      continueAsGuest: () => {
        setData((d) => ({ ...d, session: { role: 'guest' } }));
        enterMain();
      },
      logout: () => {
        setData((d) => ({ ...d, session: null }));
        setStack([{ name: 'welcome' }]);
        setDraft(null);
      },

      clientTab,
      setClientTab,
      businessTab,
      setBusinessTab,
      searchQuery,
      setSearchQuery,
      searchCategory,
      setSearchCategory,

      businesses: data.businesses,
      business: (id) => {
        const found = data.businesses.find((b) => b.id === id);
        if (!found) throw new Error(`Negocio no encontrado: ${id}`);
        return found;
      },
      myBusiness,
      updateBusiness: (id, patch) =>
        setData((d) => ({ ...d, businesses: d.businesses.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      bookings: data.bookings,
      myBookings,
      addBooking: (b) => {
        const booking = { ...b, id: newId() };
        setData((d) => ({
          ...d,
          bookings: [...d.bookings, booking],
          guestBookingIds: d.session?.role === 'guest' ? [...d.guestBookingIds, booking.id] : d.guestBookingIds,
          businesses: d.businesses.map((x) => (x.id === b.businessId ? { ...x, visits: x.visits + 1 } : x)),
        }));
        return booking;
      },
      updateBooking: (id, patch) =>
        setData((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      cancelBooking: (id) => setData((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) })),

      draft,
      setDraft,
      startBooking: (businessId, serviceIds = []) => {
        setDraft({ businessId, serviceIds, professionalId: null, start: null, assignedProfessionalId: null });
        setStack((s) => [...s, { name: 'business', businessId }]);
      },

      resetDemo: () => {
        setData(initialData());
        setStack([{ name: 'welcome' }]);
        setDraft(null);
      },
    };
  }, [data, stack, draft, clientTab, businessTab, searchQuery, searchCategory]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore debe usarse dentro de StoreProvider');
  return s;
}
