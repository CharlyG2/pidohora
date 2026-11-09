// Estado de la página web: dónde está la persona, sus reservas y la navegación.
// Se guarda en el navegador (localStorage). Más adelante vendrá de la base de datos.

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { seedBusinesses, type Booking, type Business } from '../../src/data';
import { businessPoint, distanceKm, findComuna, nearestComuna, NEARBY_KM } from '../../src/location';
import { cleanBookings } from '../../src/persist';

export type Place = { source: 'gps' | 'comuna'; label: string; lat: number; lng: number };

type State = { place: Place | null; bookings: Booking[]; name: string; phone: string };

const KEY = 'pidohora-web-v1';
const DEFAULT_PLACE: Place = (() => {
  const c = findComuna('Providencia')!;
  return { source: 'comuna', label: c.name, lat: c.lat, lng: c.lng };
})();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = { place: null, bookings: [], name: '', phone: '', ...JSON.parse(raw) } as State;
      const bookings = cleanBookings(saved.bookings);
      if (bookings.length !== saved.bookings.length) {
        localStorage.setItem(KEY, JSON.stringify({ ...saved, bookings }));
      }
      return { ...saved, bookings };
    }
  } catch {
    /* sin almacenamiento: seguimos con lo de fábrica */
  }
  return { place: null, bookings: [], name: '', phone: '' };
}

let state: State = load();
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state);
}

export const actions = {
  setComuna(name: string) {
    const c = findComuna(name);
    if (c) set({ place: { source: 'comuna', label: c.name, lat: c.lat, lng: c.lng } });
  },
  /** Pide la ubicación al navegador. Devuelve un mensaje de error en español, o null si funcionó. */
  locate(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve('Tu navegador no permite compartir la ubicación. Elige tu comuna.');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          set({ place: { source: 'gps', label: nearestComuna(lat, lng).name, lat, lng } });
          resolve(null);
        },
        (err) =>
          resolve(
            err.code === err.PERMISSION_DENIED
              ? 'No nos diste permiso para ver tu ubicación. Puedes elegir tu comuna.'
              : 'No pudimos encontrar tu ubicación. Intenta de nuevo o elige tu comuna.',
          ),
        { timeout: 10000, maximumAge: 300000 },
      );
    });
  },
  addBooking(b: Booking, name: string, phone: string) {
    set({ bookings: [...state.bookings, b], name, phone });
  },
  cancelBooking(id: string) {
    set({ bookings: state.bookings.filter((b) => b.id !== id) });
  },
};

/** Lugar actual (o Providencia si la persona aún no elige). */
export function usePlace() {
  const { place } = useAppState();
  return { place: place ?? DEFAULT_PLACE, chosen: !!place };
}

export function useDistance() {
  const { place } = usePlace();
  return (b: Business) => {
    const p = businessPoint(b);
    return p ? distanceKm(place.lat, place.lng, p.lat, p.lng) : Infinity;
  };
}

export function isNear(km: number) {
  return km <= NEARBY_KM;
}

export const businesses = seedBusinesses;
export function businessById(id: string) {
  return businesses.find((b) => b.id === id);
}

/** Ofertas de ejemplo que publican los negocios (solo en la página web por ahora). */
export const promos: Record<string, { title: string; off: number; serviceId?: string }> = {
  'barberia-el-corte': { title: '20% en tu primer corte', off: 20 },
  'nails-studio': { title: 'Semipermanente + diseño a precio de semipermanente', off: 15 },
  'spa-zen': { title: 'Masaje en pareja 25% off de lunes a jueves', off: 25 },
  'peluqueria-canina': { title: 'Baño gratis en tu quinta visita', off: 10 },
  'box-fit': { title: 'Primera clase gratis', off: 100 },
};

// ---------- Navegación con # (funciona en cualquier hosting estático) ----------

export type Route =
  | { name: 'home' }
  | { name: 'search'; q: string; cat: string }
  | { name: 'business'; id: string }
  | { name: 'book'; id: string; service?: string }
  | { name: 'mine' }
  | { name: 'pro' };

function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const qs = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'buscar':
      return { name: 'search', q: qs.get('q') ?? '', cat: qs.get('cat') ?? '' };
    case 'negocio':
      return parts[1] ? { name: 'business', id: parts[1] } : { name: 'home' };
    case 'reservar':
      return parts[1] ? { name: 'book', id: parts[1], service: qs.get('servicio') ?? undefined } : { name: 'home' };
    case 'mis-horas':
      return { name: 'mine' };
    case 'negocios':
      return { name: 'pro' };
    default:
      return { name: 'home' };
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'search': {
      const qs = new URLSearchParams();
      if (r.q) qs.set('q', r.q);
      if (r.cat) qs.set('cat', r.cat);
      const s = qs.toString();
      return '#/buscar' + (s ? '?' + s : '');
    }
    case 'business':
      return '#/negocio/' + r.id;
    case 'book':
      return '#/reservar/' + r.id + (r.service ? '?servicio=' + r.service : '');
    case 'mine':
      return '#/mis-horas';
    case 'pro':
      return '#/negocios';
  }
}

export function go(r: Route) {
  location.hash = href(r);
}

export function useRoute(): Route {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return useMemo(() => parse(hash), [hash]);
}

/** Si el ancho de la ventana es de celular. */
export function useIsMobile() {
  const q = '(max-width: 760px)';
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}
