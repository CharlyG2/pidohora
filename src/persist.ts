// Limpieza de los datos de prueba que quedaron guardados en el navegador de versiones anteriores.
// Es pura (no toca el navegador) para poder probarla.

import type { Booking } from './data';

/**
 * Negocios que ya no deben aparecer en la demo aunque estén guardados en el navegador.
 * Barbería Innovva Studio es un negocio real: se retiró hasta tener el permiso de su dueño.
 */
export const RETIRED_BUSINESS_IDS: readonly string[] = ['innovva-barber-studio'];

type WithId = { id: string };

/** Quita negocios retirados, sus reservas y cualquier contraseña que haya quedado guardada. */
export function cleanSaved<
  T extends { businesses: WithId[]; bookings: Pick<Booking, 'businessId'>[]; accounts?: object[] },
>(data: T): T {
  const keepBiz = (id: string) => !RETIRED_BUSINESS_IDS.includes(id);
  return {
    ...data,
    businesses: data.businesses.filter((b) => keepBiz(b.id)),
    bookings: data.bookings.filter((b) => keepBiz(b.businessId)),
    ...(data.accounts ? { accounts: data.accounts.map(withoutPassword) } : {}),
  };
}

/** Reservas guardadas en la página web, sin las de negocios retirados. */
export function cleanBookings<T extends Pick<Booking, 'businessId'>>(bookings: T[]): T[] {
  return bookings.filter((b) => !RETIRED_BUSINESS_IDS.includes(b.businessId));
}

function withoutPassword<A extends object>(a: A): A {
  if (!('password' in a)) return a;
  const { password: _omit, ...rest } = a as A & { password: unknown };
  return rest as A;
}
