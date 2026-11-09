// Ubicación: comunas con coordenadas aproximadas y cálculo de distancias.
// En la versión real cada negocio guardará su dirección exacta (latitud y longitud).

import { norm } from './utils';

export type Comuna = { name: string; region: string; lat: number; lng: number };

export const COMUNAS: Comuna[] = [
  { name: 'Santiago Centro', region: 'Santiago', lat: -33.4372, lng: -70.6506 },
  { name: 'Providencia', region: 'Santiago', lat: -33.4314, lng: -70.6093 },
  { name: 'Las Condes', region: 'Santiago', lat: -33.408, lng: -70.567 },
  { name: 'Vitacura', region: 'Santiago', lat: -33.39, lng: -70.595 },
  { name: 'Lo Barnechea', region: 'Santiago', lat: -33.352, lng: -70.518 },
  { name: 'Ñuñoa', region: 'Santiago', lat: -33.4569, lng: -70.5973 },
  { name: 'La Reina', region: 'Santiago', lat: -33.445, lng: -70.54 },
  { name: 'Peñalolén', region: 'Santiago', lat: -33.485, lng: -70.542 },
  { name: 'Macul', region: 'Santiago', lat: -33.49, lng: -70.598 },
  { name: 'La Florida', region: 'Santiago', lat: -33.522, lng: -70.598 },
  { name: 'Puente Alto', region: 'Santiago', lat: -33.611, lng: -70.575 },
  { name: 'San Miguel', region: 'Santiago', lat: -33.497, lng: -70.651 },
  { name: 'San Joaquín', region: 'Santiago', lat: -33.495, lng: -70.628 },
  { name: 'La Cisterna', region: 'Santiago', lat: -33.53, lng: -70.664 },
  { name: 'Estación Central', region: 'Santiago', lat: -33.459, lng: -70.698 },
  { name: 'Quinta Normal', region: 'Santiago', lat: -33.428, lng: -70.697 },
  { name: 'Independencia', region: 'Santiago', lat: -33.417, lng: -70.665 },
  { name: 'Recoleta', region: 'Santiago', lat: -33.406, lng: -70.64 },
  { name: 'Huechuraba', region: 'Santiago', lat: -33.367, lng: -70.633 },
  { name: 'Quilicura', region: 'Santiago', lat: -33.36, lng: -70.73 },
  { name: 'Pudahuel', region: 'Santiago', lat: -33.44, lng: -70.76 },
  { name: 'Maipú', region: 'Santiago', lat: -33.511, lng: -70.758 },
  { name: 'Cerrillos', region: 'Santiago', lat: -33.495, lng: -70.716 },
  { name: 'San Bernardo', region: 'Santiago', lat: -33.592, lng: -70.7 },
  { name: 'Viña del Mar', region: 'Valparaíso', lat: -33.0245, lng: -71.5518 },
  { name: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
  { name: 'Rancagua', region: "O'Higgins", lat: -34.1701, lng: -70.7444 },
  { name: 'Concepción', region: 'Biobío', lat: -36.827, lng: -73.05 },
];

/** Busca una comuna por nombre, sin importar tildes ni mayúsculas ("santiago" = Santiago Centro). */
export function findComuna(name: string | undefined): Comuna | null {
  if (!name) return null;
  const n = norm(name.trim());
  if (!n) return null;
  if (n === 'santiago') return COMUNAS[0];
  return COMUNAS.find((c) => norm(c.name) === n) ?? null;
}

/** La comuna más cercana a un punto (para mostrar "Cerca de Ñuñoa" con el GPS). */
export function nearestComuna(lat: number, lng: number): Comuna {
  return COMUNAS.reduce((best, c) => (distanceKm(lat, lng, c.lat, c.lng) < distanceKm(lat, lng, best.lat, best.lng) ? c : best));
}

/** Distancia en línea recta entre dos puntos, en kilómetros. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** "a 350 m", "a 1,2 km", "a 14 km". */
export function formatDistance(km: number) {
  if (km < 1) return `a ${Math.max(100, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `a ${km.toFixed(1).replace('.', ',')} km`;
  return `a ${Math.round(km)} km`;
}

/** Hasta qué distancia mostramos lugares como "cerca de ti". */
export const NEARBY_KM = 8;

/**
 * Coordenadas de un negocio. Si no tiene las suyas, usamos su comuna con un pequeño
 * desplazamiento estable (para que no queden todos en el mismo punto).
 */
export function businessPoint(b: { id: string; comuna: string; lat?: number; lng?: number }): { lat: number; lng: number } | null {
  if (b.lat != null && b.lng != null) return { lat: b.lat, lng: b.lng };
  const c = findComuna(b.comuna);
  if (!c) return null;
  let h = 0;
  for (const ch of b.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const dx = ((h % 1000) / 1000 - 0.5) * 0.02;
  const dy = (((h >>> 10) % 1000) / 1000 - 0.5) * 0.02;
  return { lat: c.lat + dy, lng: c.lng + dx };
}
