// Datos de ejemplo. Más adelante vendrán de la base de datos (Supabase).

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number; // en pesos chilenos
};

export type Professional = {
  id: string;
  name: string;
  role: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  address: string;
  /** Horario de atención, en horas (24h). 0 = domingo ... 6 = sábado. */
  hours: Partial<Record<number, { open: number; close: number }>>;
  services: Service[];
  professionals: Professional[];
};

export type Booking = {
  id: string;
  businessId: string;
  professionalId: string;
  serviceIds: string[];
  start: string; // fecha y hora ISO
  durationMin: number;
  total: number;
  clientName: string;
  clientPhone: string;
  paid: boolean;
  paymentMethod: 'online' | 'local';
};

const weekdays = (open: number, close: number, saturday?: { open: number; close: number }) => ({
  1: { open, close },
  2: { open, close },
  3: { open, close },
  4: { open, close },
  5: { open, close },
  ...(saturday ? { 6: saturday } : {}),
});

export const businesses: Business[] = [
  {
    id: 'barberia-el-corte',
    name: 'Barbería El Corte',
    category: 'Barbería',
    emoji: '💈',
    address: 'Av. Providencia 1234, Providencia',
    hours: weekdays(10, 20, { open: 10, close: 18 }),
    services: [
      { id: 'corte', name: 'Corte de pelo', durationMin: 30, price: 10000 },
      { id: 'barba', name: 'Perfilado de barba', durationMin: 20, price: 6000 },
      { id: 'degradado', name: 'Degradado + diseño', durationMin: 45, price: 14000 },
      { id: 'lavado', name: 'Lavado y masaje capilar', durationMin: 15, price: 4000 },
    ],
    professionals: [
      { id: 'mati', name: 'Matías', role: 'Barbero' },
      { id: 'joaco', name: 'Joaquín', role: 'Barbero' },
    ],
  },
  {
    id: 'estetica-luna',
    name: 'Centro de Estética Luna',
    category: 'Estética',
    emoji: '💅',
    address: 'Isidora Goyenechea 2800, Las Condes',
    hours: weekdays(9, 19, { open: 10, close: 15 }),
    services: [
      { id: 'manicure', name: 'Manicure semipermanente', durationMin: 60, price: 18000 },
      { id: 'pedicure', name: 'Pedicure', durationMin: 60, price: 20000 },
      { id: 'cejas', name: 'Diseño de cejas', durationMin: 30, price: 12000 },
      { id: 'limpieza', name: 'Limpieza facial', durationMin: 60, price: 30000 },
    ],
    professionals: [
      { id: 'cata', name: 'Catalina', role: 'Manicurista' },
      { id: 'fran', name: 'Francisca', role: 'Cosmetóloga' },
    ],
  },
  {
    id: 'psicologa-andrea',
    name: 'Ps. Andrea Muñoz',
    category: 'Psicología',
    emoji: '🧠',
    address: 'Online o en Ñuñoa',
    hours: weekdays(9, 18),
    services: [
      { id: 'sesion', name: 'Sesión individual', durationMin: 50, price: 35000 },
      { id: 'pareja', name: 'Terapia de pareja', durationMin: 60, price: 45000 },
    ],
    professionals: [{ id: 'andrea', name: 'Andrea', role: 'Psicóloga' }],
  },
  {
    id: 'peluqueria-canina',
    name: 'Peluquería Canina Patitas',
    category: 'Mascotas',
    emoji: '🐶',
    address: 'Av. Irarrázaval 3100, Ñuñoa',
    hours: weekdays(10, 19, { open: 10, close: 16 }),
    services: [
      { id: 'bano', name: 'Baño', durationMin: 45, price: 15000 },
      { id: 'corte-canino', name: 'Corte de pelo', durationMin: 60, price: 20000 },
      { id: 'unas', name: 'Corte de uñas', durationMin: 15, price: 5000 },
    ],
    professionals: [
      { id: 'vale', name: 'Valentina', role: 'Groomer' },
      { id: 'nico', name: 'Nicolás', role: 'Groomer' },
    ],
  },
];

/** Crea algunas reservas de ejemplo para hoy y mañana, para que la agenda no parta vacía. */
export function sampleBookings(): Booking[] {
  const b = businesses[0];
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: 'demo-1',
      businessId: b.id,
      professionalId: 'mati',
      serviceIds: ['corte', 'barba'],
      start: at(0, 11),
      durationMin: 50,
      total: 16000,
      clientName: 'Diego Rojas',
      clientPhone: '+56 9 8765 4321',
      paid: true,
      paymentMethod: 'online',
    },
    {
      id: 'demo-2',
      businessId: b.id,
      professionalId: 'joaco',
      serviceIds: ['degradado'],
      start: at(0, 12, 30),
      durationMin: 45,
      total: 14000,
      clientName: 'Benjamín Soto',
      clientPhone: '+56 9 1234 5678',
      paid: false,
      paymentMethod: 'local',
    },
    {
      id: 'demo-3',
      businessId: b.id,
      professionalId: 'mati',
      serviceIds: ['corte'],
      start: at(1, 16),
      durationMin: 30,
      total: 10000,
      clientName: 'Tomás Pérez',
      clientPhone: '+56 9 5555 0000',
      paid: false,
      paymentMethod: 'local',
    },
  ];
}
