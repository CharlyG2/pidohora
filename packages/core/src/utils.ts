import type { Booking, Business } from './data';

export function formatCLP(amount: number): string {
  return '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function dayShort(d: Date) {
  return DAYS_SHORT[d.getDay()];
}

export function formatDateLong(d: Date) {
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function formatDateShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Próximos `count` días, partiendo por hoy. */
export function nextDays(count: number): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const SLOT_STEP_MIN = 15;

/**
 * Horas disponibles para un profesional en un día, considerando:
 * horario del negocio, duración total de los servicios y reservas ya tomadas.
 */
export function availableSlots(
  business: Business,
  professionalId: string,
  day: Date,
  durationMin: number,
  bookings: Booking[],
  now: Date = new Date(),
): Date[] {
  const hours = business.hours[day.getDay()];
  if (!hours || durationMin <= 0) return [];

  const taken = bookings
    .filter((b) => b.businessId === business.id && b.professionalId === professionalId)
    .map((b) => {
      const s = new Date(b.start).getTime();
      return [s, s + b.durationMin * 60_000] as const;
    });

  const slots: Date[] = [];
  const cursor = startOfDay(day);
  cursor.setHours(hours.open, 0, 0, 0);
  const close = startOfDay(day);
  close.setHours(hours.close, 0, 0, 0);

  while (cursor.getTime() + durationMin * 60_000 <= close.getTime()) {
    const s = cursor.getTime();
    const e = s + durationMin * 60_000;
    const overlaps = taken.some(([ts, te]) => s < te && e > ts);
    if (!overlaps && s > now.getTime()) slots.push(new Date(s));
    cursor.setMinutes(cursor.getMinutes() + SLOT_STEP_MIN);
  }
  return slots;
}

/** Valida un celular chileno: +56 9 XXXX XXXX (acepta espacios y sin +56). */
export function isValidChileanPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return /^(56)?9\d{8}$/.test(digits);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatMonthYear(d: Date) {
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Lunes de la semana de `d`. */
export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** Las 6 semanas (42 días) que muestra un calendario mensual, partiendo en lunes. */
export function monthGrid(d: Date): Date[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Texto normalizado para buscar sin importar tildes ni mayúsculas. */
export function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function formatRating(r: number) {
  return r.toFixed(1).replace('.', ',');
}

export function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
