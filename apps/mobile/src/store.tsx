import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

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
} from '@pidohora/core/data';
import { businessPoint, distanceKm, findComuna, nearestComuna } from '@pidohora/core/location';
import { cleanSaved } from '@pidohora/core/persist';
import { newId } from '@pidohora/core/utils';

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
  | { name: 'serviceEdit'; serviceId?: string }
  | { name: 'location' };

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

/** Desde dónde mostramos los lugares: GPS, la comuna donde vive o una comuna elegida. */
export type Place = { source: 'gps' | 'home' | 'comuna'; label: string; lat: number; lng: number };

type Persisted = {
  version: 2;
  place?: Place | null;
  session: Session;
  accounts: Account[];
  businesses: Business[];
  bookings: Booking[];
  guestBookingIds: string[];
};

const STORAGE_KEY = 'pidohora-demo-v4';

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
      if (parsed.version === 2) {
        const saved = cleanSaved(parsed);
        // Suma los negocios de ejemplo nuevos que no estaban cuando se guardaron los datos.
        const missing = seedBusinesses.filter((sb) => !saved.businesses.some((b) => b.id === sb.id));
        return missing.length ? { ...saved, businesses: [...saved.businesses, ...missing] } : saved;
      }
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
  /** Se pide en el formulario, pero el prototipo no la guarda ni la revisa (ver docs/auditoria-seguridad-2026-11.md). */
  password: string;
  phone: string;
  businessName?: string;
  category?: CategoryId;
  comuna?: string;
  address?: string;
};

function homePlace(comunaName: string | undefined): Place | null {
  const c = findComuna(comunaName);
  return c ? { source: 'home', label: c.name, lat: c.lat, lng: c.lng } : null;
}

type Store = {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  /** Vuelve a la pantalla principal (pestañas). */
  home: () => void;

  session: Session;
  account: Account | null;
  /** Prototipo: entra con el correo; la contraseña no se guarda ni se revisa. */
  login: (email: string) => string | null;
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

  /** Ubicación activa (o null si aún no la sabemos). */
  place: Place | null;
  setPlaceComuna: (comunaName: string) => void;
  chooseHomePlace: () => void;
  /** Pide la ubicación al teléfono/navegador. Devuelve un mensaje de error o null si funcionó. */
  locate: () => Promise<string | null>;
  setHomeComuna: (comunaName: string) => void;
  /** Distancia en km desde la ubicación activa, o null si no se puede calcular. */
  distanceTo: (b: Business) => number | null;

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

    const place: Place | null = data.place ?? homePlace(account?.homeComuna);
    const setPlace = (p: Place | null) => setData((d) => ({ ...d, place: p }));

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
      login: (email) => {
        const acc = data.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!acc) return 'No encontramos una cuenta con ese correo.';
        setData((d) => ({ ...d, session: { role: acc.role, accountId: acc.id }, place: d.place ?? homePlace(acc.homeComuna) }));
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
          phone: input.phone.trim(),
          businessId,
          homeComuna: input.role === 'client' ? findComuna(input.comuna)?.name : undefined,
        };
        setData((d) => ({
          ...d,
          accounts: [...d.accounts, acc],
          businesses: newBusiness ? [...d.businesses, newBusiness] : d.businesses,
          session: { role: acc.role, accountId },
          place: d.place ?? homePlace(acc.homeComuna),
        }));
        enterMain();
        return null;
      },
      continueAsGuest: () => {
        setData((d) => ({ ...d, session: { role: 'guest' } }));
        enterMain();
      },
      logout: () => {
        setData((d) => ({ ...d, session: null, place: null }));
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

      place,
      setPlaceComuna: (name) => {
        const c = findComuna(name);
        if (c) setPlace({ source: 'comuna', label: c.name, lat: c.lat, lng: c.lng });
      },
      chooseHomePlace: () => setPlace(homePlace(account?.homeComuna)),
      locate: async () => {
        try {
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.status !== 'granted') {
            return 'No nos diste permiso para ver tu ubicación. Puedes activarlo en los ajustes del teléfono o elegir tu comuna.';
          }
          const pos = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
          ]);
          const { latitude: lat, longitude: lng } = pos.coords;
          const c = nearestComuna(lat, lng);
          if (distanceKm(lat, lng, c.lat, c.lng) > 60) {
            return 'Por ahora PidoHora funciona en Santiago, Valparaíso, Rancagua y Concepción. Elige una comuna.';
          }
          setPlace({ source: 'gps', label: c.name, lat, lng });
          return null;
        } catch {
          return 'No pudimos obtener tu ubicación. Revisa que el GPS esté activo o elige tu comuna.';
        }
      },
      setHomeComuna: (name) => {
        const c = findComuna(name);
        if (!c || !account) return;
        setData((d) => ({
          ...d,
          accounts: d.accounts.map((a) => (a.id === account.id ? { ...a, homeComuna: c.name } : a)),
          place: { source: 'home', label: c.name, lat: c.lat, lng: c.lng },
        }));
      },
      distanceTo: (b) => {
        if (!place) return null;
        const pt = businessPoint(b);
        return pt ? distanceKm(place.lat, place.lng, pt.lat, pt.lng) : null;
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
