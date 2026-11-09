import { describe, expect, it } from 'vitest';

import { businessPoint, distanceKm, findComuna, formatDistance, nearestComuna } from '../location';

describe('ubicación', () => {
  it('encuentra comunas sin importar tildes ni mayúsculas', () => {
    expect(findComuna('nunoa')?.name).toBe('Ñuñoa');
    expect(findComuna('  PROVIDENCIA ')?.name).toBe('Providencia');
    expect(findComuna('No existe')).toBeNull();
    expect(findComuna(undefined)).toBeNull();
  });

  it('calcula distancias en kilómetros', () => {
    const a = findComuna('Providencia')!;
    expect(distanceKm(a.lat, a.lng, a.lat, a.lng)).toBe(0);
    const b = findComuna('Ñuñoa')!;
    const d = distanceKm(a.lat, a.lng, b.lat, b.lng);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(10);
  });

  it('la comuna más cercana a un punto es la misma comuna', () => {
    const c = findComuna('La Florida')!;
    expect(nearestComuna(c.lat, c.lng).name).toBe('La Florida');
  });

  it('formatea distancias como en la app', () => {
    expect(formatDistance(0.34)).toBe('a 350 m');
    expect(formatDistance(1.24)).toBe('a 1,2 km');
    expect(formatDistance(14.4)).toBe('a 14 km');
  });

  it('usa las coordenadas propias del negocio si las tiene', () => {
    expect(businessPoint({ id: 'x', comuna: 'Providencia', lat: -33.4, lng: -70.6 })).toEqual({ lat: -33.4, lng: -70.6 });
  });

  it('sin coordenadas, ubica al negocio cerca del centro de su comuna y siempre en el mismo punto', () => {
    const c = findComuna('Providencia')!;
    const p1 = businessPoint({ id: 'abc', comuna: 'Providencia' })!;
    const p2 = businessPoint({ id: 'abc', comuna: 'Providencia' })!;
    expect(p1).toEqual(p2);
    expect(distanceKm(p1.lat, p1.lng, c.lat, c.lng)).toBeLessThan(2);
    expect(businessPoint({ id: 'abc', comuna: 'Comuna inventada' })).toBeNull();
  });
});
