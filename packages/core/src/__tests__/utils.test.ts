import { describe, expect, it } from 'vitest';

import type { Booking, Business } from '../data';
import {
  availableSlots,
  formatCLP,
  formatDuration,
  isValidChileanPhone,
  isValidEmail,
  monthGrid,
  norm,
  startOfWeek,
} from '../utils';

// Un negocio mínimo: atiende lunes de 10 a 13 y está cerrado el domingo.
const business: Business = {
  id: 'b1',
  name: 'Barbería de prueba',
  category: 'barberia',
  emoji: '💈',
  comuna: 'Providencia',
  address: '',
  description: '',
  rating: 0,
  reviewsCount: 0,
  visits: 0,
  hours: { 1: { open: 10, close: 13 } },
  services: [],
  professionals: [{ id: 'p1', name: 'Ana', role: 'Barbera', color: '#000' }],
  reviews: [],
};

// Lunes 16 de noviembre de 2026, en la hora local de quien corre las pruebas.
const monday = new Date(2026, 10, 16);
const sunday = new Date(2026, 10, 15);
// "Ahora" es el día anterior, para que ninguna hora quede en el pasado.
const before = new Date(2026, 10, 14, 9, 0);

function booking(hour: number, minute: number, durationMin: number, professionalId = 'p1'): Booking {
  return {
    id: `bk-${hour}-${minute}-${professionalId}`,
    businessId: 'b1',
    professionalId,
    serviceIds: [],
    start: new Date(2026, 10, 16, hour, minute).toISOString(),
    durationMin,
    total: 0,
    clientName: 'Cliente',
    clientPhone: '',
    paid: false,
    paymentMethod: 'local',
    source: 'app',
  };
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('availableSlots (horas libres)', () => {
  it('ofrece horas cada 15 minutos dentro del horario, sin pasarse del cierre', () => {
    const slots = availableSlots(business, 'p1', monday, 60, [], before).map(hhmm);
    expect(slots[0]).toBe('10:00');
    expect(slots.at(-1)).toBe('12:00'); // 12:00 + 60 min = 13:00, justo al cierre
    expect(slots).toHaveLength(9);
  });

  it('no ofrece horas un día cerrado', () => {
    expect(availableSlots(business, 'p1', sunday, 30, [], before)).toEqual([]);
  });

  it('no ofrece horas si la duración es cero', () => {
    expect(availableSlots(business, 'p1', monday, 0, [], before)).toEqual([]);
  });

  it('no ofrece horas que se pisan con una reserva del mismo profesional', () => {
    const slots = availableSlots(business, 'p1', monday, 30, [booking(11, 0, 30)], before).map(hhmm);
    expect(slots).not.toContain('10:45'); // 10:45-11:15 se pisa con 11:00-11:30
    expect(slots).not.toContain('11:00');
    expect(slots).not.toContain('11:15');
    expect(slots).toContain('10:30'); // termina justo cuando empieza la reserva
    expect(slots).toContain('11:30'); // empieza justo cuando termina la reserva
  });

  it('ignora las reservas de otros profesionales', () => {
    const slots = availableSlots(business, 'p1', monday, 30, [booking(11, 0, 30, 'p2')], before).map(hhmm);
    expect(slots).toContain('11:00');
  });

  it('no ofrece horas que ya pasaron', () => {
    const now = new Date(2026, 10, 16, 11, 5);
    const slots = availableSlots(business, 'p1', monday, 30, [], now).map(hhmm);
    expect(slots[0]).toBe('11:15');
  });
});

describe('formatos', () => {
  it('formatea pesos chilenos con punto de miles', () => {
    expect(formatCLP(15900)).toBe('$15.900');
    expect(formatCLP(1234567)).toBe('$1.234.567');
    expect(formatCLP(990)).toBe('$990');
  });

  it('formatea duraciones', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('normaliza texto sin tildes ni mayúsculas', () => {
    expect(norm('Ñuñoa Peluquería')).toBe('nunoa peluqueria');
  });
});

describe('validaciones', () => {
  it('acepta celulares chilenos con o sin +56', () => {
    expect(isValidChileanPhone('+56 9 1234 5678')).toBe(true);
    expect(isValidChileanPhone('912345678')).toBe(true);
  });

  it('rechaza teléfonos que no son celulares chilenos', () => {
    expect(isValidChileanPhone('22345678')).toBe(false);
    expect(isValidChileanPhone('+56 2 2345 6789')).toBe(false);
    expect(isValidChileanPhone('9123')).toBe(false);
  });

  it('valida correos', () => {
    expect(isValidEmail('negocio@pidohora.cl')).toBe(true);
    expect(isValidEmail('sin-arroba.cl')).toBe(false);
  });
});

describe('calendario', () => {
  it('la semana parte el lunes', () => {
    const wed = new Date(2026, 10, 18);
    expect(startOfWeek(wed).getDay()).toBe(1);
    expect(startOfWeek(sunday).getDate()).toBe(9); // domingo 15 pertenece a la semana del lunes 9
  });

  it('el mes muestra 42 días partiendo en lunes', () => {
    const grid = monthGrid(new Date(2026, 10, 1));
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(1);
  });
});
