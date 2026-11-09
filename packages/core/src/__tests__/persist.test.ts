import { describe, expect, it } from 'vitest';

import { seedAccounts, seedBusinesses } from '../data';
import { cleanBookings, cleanSaved, RETIRED_BUSINESS_IDS } from '../persist';

const retired = RETIRED_BUSINESS_IDS[0];

describe('negocios retirados de la demo', () => {
  it('ningún negocio de ejemplo está en la lista de retirados', () => {
    expect(seedBusinesses.some((b) => RETIRED_BUSINESS_IDS.includes(b.id))).toBe(false);
  });

  it('quita el negocio retirado y sus reservas de los datos guardados', () => {
    const saved = {
      businesses: [{ id: 'barberia-el-corte' }, { id: retired }],
      bookings: [{ businessId: 'barberia-el-corte' }, { businessId: retired }],
    };
    const clean = cleanSaved(saved);
    expect(clean.businesses.map((b) => b.id)).toEqual(['barberia-el-corte']);
    expect(clean.bookings).toEqual([{ businessId: 'barberia-el-corte' }]);
  });

  it('quita las reservas web de negocios retirados', () => {
    expect(cleanBookings([{ businessId: retired }, { businessId: 'spa-zen' }])).toEqual([{ businessId: 'spa-zen' }]);
  });
});

describe('contraseñas', () => {
  it('las cuentas de ejemplo no traen contraseña', () => {
    for (const a of seedAccounts) expect('password' in a).toBe(false);
  });

  it('borra contraseñas guardadas por versiones anteriores', () => {
    const saved = {
      businesses: [],
      bookings: [],
      accounts: [{ id: 'a1', email: 'x@y.cl', password: 'secreta' }],
    };
    const clean = cleanSaved(saved);
    expect(clean.accounts).toEqual([{ id: 'a1', email: 'x@y.cl' }]);
    expect(JSON.stringify(clean)).not.toContain('secreta');
  });
});
