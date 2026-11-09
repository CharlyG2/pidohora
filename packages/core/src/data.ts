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
  color: string; // color de sus citas en la agenda
};

export type Review = { author: string; rating: number; text: string; daysAgo: number };

export type Hours = Partial<Record<number, { open: number; close: number }>>;

export type Business = {
  id: string;
  name: string;
  category: CategoryId;
  emoji: string;
  comuna: string;
  /** Coordenadas exactas, si las tenemos (si no, se usa la comuna). */
  lat?: number;
  lng?: number;
  address: string;
  /** Teléfono o WhatsApp del negocio, si lo tenemos. */
  phone?: string;
  description: string;
  rating: number;
  reviewsCount: number;
  /** Visitas en el último mes, para "más visitados". */
  visits: number;
  /** Horario de atención, en horas (24h). 0 = domingo ... 6 = sábado. */
  hours: Hours;
  services: Service[];
  professionals: Professional[];
  reviews: Review[];
  isNew?: boolean;
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
  /** Cuenta del cliente, si reservó con sesión iniciada. */
  clientAccountId?: string;
  paid: boolean;
  paymentMethod: 'online' | 'local';
  /** Quién creó la reserva: el cliente desde la app o el negocio a mano. */
  source: 'app' | 'manual';
  note?: string;
};

export type CategoryId = 'barberia' | 'peluqueria' | 'estetica' | 'unas' | 'salud' | 'masajes' | 'mascotas' | 'deporte';

export const categories: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'barberia', label: 'Barbería', emoji: '💈' },
  { id: 'peluqueria', label: 'Peluquería', emoji: '💇‍♀️' },
  { id: 'unas', label: 'Uñas', emoji: '💅' },
  { id: 'estetica', label: 'Estética', emoji: '✨' },
  { id: 'masajes', label: 'Masajes', emoji: '💆' },
  { id: 'salud', label: 'Salud', emoji: '🩺' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐶' },
  { id: 'deporte', label: 'Deporte', emoji: '🏋️' },
];

export function categoryOf(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

/** Servicios con los que parte un negocio nuevo según su rubro. */
export const templateServices: Record<CategoryId, Omit<Service, 'id'>[]> = {
  barberia: [
    { name: 'Corte de pelo', durationMin: 30, price: 10000 },
    { name: 'Perfilado de barba', durationMin: 20, price: 6000 },
  ],
  peluqueria: [
    { name: 'Corte y brushing', durationMin: 60, price: 18000 },
    { name: 'Color', durationMin: 120, price: 45000 },
  ],
  unas: [
    { name: 'Manicure semipermanente', durationMin: 60, price: 15000 },
    { name: 'Pedicure', durationMin: 60, price: 18000 },
  ],
  estetica: [
    { name: 'Limpieza facial', durationMin: 60, price: 30000 },
    { name: 'Diseño de cejas', durationMin: 30, price: 12000 },
  ],
  masajes: [
    { name: 'Masaje descontracturante', durationMin: 60, price: 30000 },
    { name: 'Masaje de relajación', durationMin: 45, price: 25000 },
  ],
  salud: [{ name: 'Consulta', durationMin: 45, price: 35000 }],
  mascotas: [
    { name: 'Baño', durationMin: 45, price: 15000 },
    { name: 'Corte de pelo', durationMin: 60, price: 20000 },
  ],
  deporte: [{ name: 'Clase personalizada', durationMin: 60, price: 20000 }],
};

import { teamColors } from '@pidohora/tokens';
export const proColors = teamColors;

const weekdays = (open: number, close: number, saturday?: { open: number; close: number }): Hours => ({
  1: { open, close },
  2: { open, close },
  3: { open, close },
  4: { open, close },
  5: { open, close },
  ...(saturday ? { 6: saturday } : {}),
});

const pro = (id: string, name: string, role: string, i: number): Professional => ({
  id,
  name,
  role,
  color: proColors[i % proColors.length],
});

export const seedBusinesses: Business[] = [
  {
    id: 'barberia-el-corte',
    name: 'Barbería El Corte',
    category: 'barberia',
    emoji: '💈',
    comuna: 'Providencia',
    address: 'Av. Providencia 1234, Providencia',
    description: 'Barbería clásica con estilo moderno. Cortes, degradados y barba con toalla caliente.',
    rating: 4.9,
    reviewsCount: 312,
    visits: 1840,
    hours: weekdays(10, 20, { open: 10, close: 18 }),
    services: [
      { id: 'corte', name: 'Corte de pelo', durationMin: 30, price: 10000 },
      { id: 'barba', name: 'Perfilado de barba', durationMin: 20, price: 6000 },
      { id: 'degradado', name: 'Degradado + diseño', durationMin: 45, price: 14000 },
      { id: 'lavado', name: 'Lavado y masaje capilar', durationMin: 15, price: 4000 },
    ],
    professionals: [pro('mati', 'Matías', 'Barbero', 0), pro('joaco', 'Joaquín', 'Barbero', 1), pro('seba', 'Sebastián', 'Barbero', 2)],
    reviews: [
      { author: 'Diego R.', rating: 5, text: 'El mejor degradado que me han hecho. Puntuales.', daysAgo: 2 },
      { author: 'Felipe M.', rating: 5, text: 'Reservar por la app es rapidísimo.', daysAgo: 6 },
      { author: 'Andrés P.', rating: 4, text: 'Muy buen servicio, a veces hay que esperar un poco.', daysAgo: 15 },
    ],
  },
  {
    id: 'estetica-luna',
    name: 'Centro de Estética Luna',
    category: 'estetica',
    emoji: '✨',
    comuna: 'Las Condes',
    address: 'Isidora Goyenechea 2800, Las Condes',
    description: 'Tratamientos faciales, cejas y pestañas con productos dermatológicos.',
    rating: 4.8,
    reviewsCount: 204,
    visits: 1320,
    hours: weekdays(9, 19, { open: 10, close: 15 }),
    services: [
      { id: 'limpieza', name: 'Limpieza facial', durationMin: 60, price: 30000 },
      { id: 'cejas', name: 'Diseño de cejas', durationMin: 30, price: 12000 },
      { id: 'pestanas', name: 'Lifting de pestañas', durationMin: 60, price: 25000 },
      { id: 'depilacion', name: 'Depilación con cera (piernas)', durationMin: 45, price: 18000 },
    ],
    professionals: [pro('cata', 'Catalina', 'Cosmetóloga', 3), pro('fran', 'Francisca', 'Esteticista', 4)],
    reviews: [
      { author: 'Camila G.', rating: 5, text: 'Mi piel quedó increíble. Súper recomendado.', daysAgo: 3 },
      { author: 'Javiera S.', rating: 5, text: 'Atención muy cálida y profesional.', daysAgo: 9 },
    ],
  },
  {
    id: 'nails-studio',
    name: 'Nails Studio Ñuñoa',
    category: 'unas',
    emoji: '💅',
    comuna: 'Ñuñoa',
    address: 'Av. Irarrázaval 2500, Ñuñoa',
    description: 'Manicure, pedicure, polygel y nail art. Más de 200 colores.',
    rating: 4.7,
    reviewsCount: 188,
    visits: 1610,
    hours: weekdays(10, 20, { open: 10, close: 18 }),
    services: [
      { id: 'semi', name: 'Manicure semipermanente', durationMin: 60, price: 15000 },
      { id: 'polygel', name: 'Uñas polygel', durationMin: 90, price: 25000 },
      { id: 'pedi', name: 'Pedicure spa', durationMin: 60, price: 18000 },
      { id: 'retiro', name: 'Retiro de esmalte', durationMin: 20, price: 5000 },
    ],
    professionals: [pro('dani', 'Daniela', 'Manicurista', 4), pro('kari', 'Karina', 'Manicurista', 2)],
    reviews: [{ author: 'Valentina R.', rating: 5, text: 'Me duran más de 3 semanas. Las amo.', daysAgo: 1 }],
  },
  {
    id: 'peluqueria-bella',
    name: 'Peluquería Bella',
    category: 'peluqueria',
    emoji: '💇‍♀️',
    comuna: 'Santiago Centro',
    address: 'Huérfanos 1050, Santiago',
    description: 'Cortes, color, balayage y tratamientos de keratina.',
    rating: 4.6,
    reviewsCount: 97,
    visits: 890,
    hours: weekdays(9, 19, { open: 9, close: 14 }),
    services: [
      { id: 'corte-mujer', name: 'Corte y brushing', durationMin: 60, price: 18000 },
      { id: 'color', name: 'Color completo', durationMin: 120, price: 45000 },
      { id: 'balayage', name: 'Balayage', durationMin: 180, price: 85000 },
      { id: 'keratina', name: 'Keratina', durationMin: 150, price: 60000 },
    ],
    professionals: [pro('ro', 'Rocío', 'Estilista', 2), pro('pame', 'Pamela', 'Colorista', 5)],
    reviews: [{ author: 'Antonia L.', rating: 5, text: 'El balayage quedó perfecto.', daysAgo: 12 }],
  },
  {
    id: 'kine-movete',
    name: 'Kinesiología Muévete',
    category: 'salud',
    emoji: '🩺',
    comuna: 'Providencia',
    address: 'Los Leones 450, Providencia',
    description: 'Kinesiología deportiva y rehabilitación. Atendemos con boleta para reembolso en isapre.',
    rating: 4.9,
    reviewsCount: 143,
    visits: 760,
    hours: weekdays(8, 20),
    services: [
      { id: 'kine', name: 'Sesión de kinesiología', durationMin: 45, price: 25000 },
      { id: 'eval', name: 'Evaluación inicial', durationMin: 60, price: 30000 },
    ],
    professionals: [pro('ignacio', 'Ignacio', 'Kinesiólogo', 0), pro('constanza', 'Constanza', 'Kinesióloga', 3)],
    reviews: [{ author: 'Rodrigo V.', rating: 5, text: 'Me recuperé de la rodilla en pocas semanas.', daysAgo: 20 }],
  },
  {
    id: 'psicologa-andrea',
    name: 'Ps. Andrea Muñoz',
    category: 'salud',
    emoji: '🧠',
    comuna: 'Ñuñoa',
    address: 'Online o en Ñuñoa',
    description: 'Psicóloga clínica. Adultos y parejas. Sesiones online o presenciales.',
    rating: 5.0,
    reviewsCount: 58,
    visits: 420,
    hours: weekdays(9, 18),
    services: [
      { id: 'sesion', name: 'Sesión individual', durationMin: 50, price: 35000 },
      { id: 'pareja', name: 'Terapia de pareja', durationMin: 60, price: 45000 },
    ],
    professionals: [pro('andrea', 'Andrea', 'Psicóloga', 2)],
    reviews: [{ author: 'Anónimo', rating: 5, text: 'Muy empática y profesional.', daysAgo: 30 }],
  },
  {
    id: 'spa-zen',
    name: 'Spa Zen',
    category: 'masajes',
    emoji: '💆',
    comuna: 'Vitacura',
    address: 'Av. Vitacura 3600, Vitacura',
    description: 'Masajes de relajación, descontracturantes y piedras calientes.',
    rating: 4.8,
    reviewsCount: 121,
    visits: 980,
    hours: weekdays(10, 21, { open: 10, close: 19 }),
    services: [
      { id: 'descontracturante', name: 'Masaje descontracturante', durationMin: 60, price: 32000 },
      { id: 'relajacion', name: 'Masaje de relajación', durationMin: 45, price: 26000 },
      { id: 'piedras', name: 'Piedras calientes', durationMin: 75, price: 40000 },
    ],
    professionals: [pro('marce', 'Marcela', 'Masoterapeuta', 3), pro('tomas', 'Tomás', 'Masoterapeuta', 0)],
    reviews: [{ author: 'Paula C.', rating: 5, text: 'Salí como nueva.', daysAgo: 4 }],
  },
  {
    id: 'peluqueria-canina',
    name: 'Peluquería Canina Patitas',
    category: 'mascotas',
    emoji: '🐶',
    comuna: 'Ñuñoa',
    address: 'Av. Irarrázaval 3100, Ñuñoa',
    description: 'Baño, corte y cuidado para perros y gatos. Retiro a domicilio.',
    rating: 4.7,
    reviewsCount: 86,
    visits: 650,
    hours: weekdays(10, 19, { open: 10, close: 16 }),
    services: [
      { id: 'bano', name: 'Baño', durationMin: 45, price: 15000 },
      { id: 'corte-canino', name: 'Corte de pelo', durationMin: 60, price: 20000 },
      { id: 'unas-mascota', name: 'Corte de uñas', durationMin: 15, price: 5000 },
    ],
    professionals: [pro('vale', 'Valentina', 'Groomer', 1), pro('nico', 'Nicolás', 'Groomer', 5)],
    reviews: [{ author: 'Sofía T.', rating: 5, text: 'Mi perrita volvió feliz.', daysAgo: 7 }],
  },
  {
    id: 'box-fit',
    name: 'Box Fit Maipú',
    category: 'deporte',
    emoji: '🏋️',
    comuna: 'Maipú',
    address: 'Av. Pajaritos 2100, Maipú',
    description: 'Entrenamiento personalizado y clases funcionales en grupos pequeños.',
    rating: 4.5,
    reviewsCount: 64,
    visits: 540,
    hours: weekdays(7, 21, { open: 9, close: 13 }),
    services: [
      { id: 'personal', name: 'Entrenamiento personal', durationMin: 60, price: 20000 },
      { id: 'evaluacion', name: 'Evaluación física', durationMin: 45, price: 15000 },
    ],
    professionals: [pro('cris', 'Cristóbal', 'Entrenador', 0)],
    reviews: [{ author: 'Martín A.', rating: 4, text: 'Buen ambiente y entrenadores atentos.', daysAgo: 10 }],
    isNew: true,
  },
  {
    id: 'barber-king',
    name: 'Barber King',
    category: 'barberia',
    emoji: '👑',
    comuna: 'La Florida',
    address: 'Av. Vicuña Mackenna 7110, La Florida',
    description: 'Barbería urbana. Cortes modernos, diseños y color fantasía.',
    rating: 4.6,
    reviewsCount: 75,
    visits: 1120,
    hours: weekdays(11, 21, { open: 11, close: 20 }),
    services: [
      { id: 'corte-k', name: 'Corte de pelo', durationMin: 30, price: 8000 },
      { id: 'barba-k', name: 'Barba', durationMin: 20, price: 5000 },
      { id: 'combo-k', name: 'Corte + barba', durationMin: 45, price: 12000 },
    ],
    professionals: [pro('kevin', 'Kevin', 'Barbero', 1), pro('bryan', 'Bryan', 'Barbero', 2)],
    reviews: [{ author: 'Lucas F.', rating: 5, text: 'Buena onda y buen precio.', daysAgo: 5 }],
    isNew: true,
  },
  {
    // Negocio real (datos públicos de su página de AgendaPro, nov 2026).
    id: 'innovva-barber-studio',
    name: 'Barbería Innovva Studio',
    category: 'barberia',
    emoji: '💈',
    comuna: 'La Florida',
    address: 'Av. Vicuña Mackenna Oriente 6711, La Florida',
    phone: '+56 9 2080 1809',
    description:
      'Barbería moderna con atención personalizada. Cortes con after shave, peinado con cera premium y bebestible, limpiezas faciales y packs.',
    rating: 4.9,
    reviewsCount: 76,
    visits: 980,
    hours: {
      0: { open: 10, close: 19 },
      1: { open: 11, close: 21 },
      2: { open: 10, close: 21 },
      3: { open: 10, close: 21 },
      4: { open: 10, close: 21 },
      5: { open: 10, close: 21 },
      6: { open: 10, close: 20 },
    },
    services: [
      { id: 'innovva-basico', name: 'Corte Innovva básico', durationMin: 60, price: 12000 },
      { id: 'innovva-vip', name: 'Corte Innovva VIP', durationMin: 60, price: 14990 },
      { id: 'innovva-barba', name: 'Perfilado o corte de barba', durationMin: 60, price: 12000 },
      { id: 'innovva-facial', name: 'Limpieza facial', durationMin: 30, price: 12000 },
      { id: 'innovva-vip-facial', name: 'Pack: Corte VIP + limpieza facial', durationMin: 60, price: 18000 },
      { id: 'innovva-vip-barba', name: 'Pack: Corte VIP + barba', durationMin: 60, price: 22000 },
      { id: 'innovva-full', name: 'Pack: Corte VIP + barba + limpieza facial', durationMin: 60, price: 30000 },
    ],
    professionals: [
      pro('benjamin-g', 'Benjamín García', 'Barbero', 0),
      pro('israel-b', 'Israel Barrientos', 'Barbero', 1),
      pro('gaspar-g', 'Gaspar Gómez', 'Barbero', 2),
    ],
    reviews: [],
    isNew: true,
  },
];

export type Account = {
  id: string;
  role: 'client' | 'business';
  name: string;
  email: string;
  password: string; // solo para el prototipo; en la versión real lo maneja Supabase
  phone: string;
  businessId?: string;
  /** Comuna donde vive el cliente, para mostrarle lugares cerca. */
  homeComuna?: string;
};

export const seedAccounts: Account[] = [
  {
    id: 'acc-negocio-demo',
    role: 'business',
    name: 'Matías (dueño)',
    email: 'negocio@pidohora.cl',
    password: '1234',
    phone: '+56 9 7777 1111',
    businessId: 'barberia-el-corte',
  },
  {
    id: 'acc-cliente-demo',
    role: 'client',
    name: 'Camila González',
    email: 'cliente@pidohora.cl',
    password: '1234',
    phone: '+56 9 8888 2222',
    homeComuna: 'Ñuñoa',
  },
];

const CLIENT_NAMES: [string, string][] = [
  ['Diego Rojas', '+56 9 8765 4321'],
  ['Benjamín Soto', '+56 9 1234 5678'],
  ['Tomás Pérez', '+56 9 5555 0000'],
  ['Vicente Araya', '+56 9 4444 1212'],
  ['Martín Silva', '+56 9 3333 8989'],
  ['Agustín Morales', '+56 9 2222 7070'],
  ['Felipe Muñoz', '+56 9 6161 6161'],
  ['Cristian Díaz', '+56 9 7272 7272'],
];

/**
 * Reservas de ejemplo para la semana actual, para que la agenda del negocio de prueba
 * se vea con movimiento. Se generan con fechas relativas a hoy.
 */
export function sampleBookings(): Booking[] {
  const b = seedBusinesses[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const plan: [number, number, number, string, string[], number][] = [
    // [día desde lunes, hora, minuto, profesional, servicios, cliente]
    [0, 10, 30, 'mati', ['corte'], 0],
    [0, 12, 0, 'joaco', ['degradado'], 1],
    [0, 16, 0, 'seba', ['corte', 'barba'], 2],
    [1, 11, 0, 'mati', ['corte', 'barba'], 3],
    [1, 11, 30, 'joaco', ['corte'], 4],
    [1, 15, 0, 'mati', ['degradado'], 5],
    [2, 10, 0, 'seba', ['corte'], 6],
    [2, 13, 0, 'mati', ['corte', 'lavado'], 7],
    [2, 17, 30, 'joaco', ['barba'], 0],
    [3, 11, 0, 'mati', ['corte'], 1],
    [3, 12, 0, 'mati', ['degradado'], 2],
    [3, 12, 0, 'joaco', ['corte', 'barba'], 3],
    [3, 18, 0, 'seba', ['corte'], 4],
    [4, 10, 0, 'joaco', ['corte'], 5],
    [4, 14, 30, 'mati', ['degradado'], 6],
    [4, 16, 0, 'seba', ['corte', 'barba'], 7],
    [5, 10, 30, 'mati', ['corte'], 0],
    [5, 11, 0, 'joaco', ['corte', 'barba'], 1],
    [5, 13, 0, 'seba', ['degradado'], 2],
    [7, 11, 0, 'mati', ['corte'], 3],
    [8, 12, 30, 'joaco', ['corte', 'barba'], 4],
  ];

  return plan.map(([day, h, m, proId, serviceIds, ci], i) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + day);
    start.setHours(h, m, 0, 0);
    const services = b.services.filter((s) => serviceIds.includes(s.id));
    const isPast = start.getTime() < Date.now();
    return {
      id: `demo-${i}`,
      businessId: b.id,
      professionalId: proId,
      serviceIds,
      start: start.toISOString(),
      durationMin: services.reduce((s, x) => s + x.durationMin, 0),
      total: services.reduce((s, x) => s + x.price, 0),
      clientName: CLIENT_NAMES[ci][0],
      clientPhone: CLIENT_NAMES[ci][1],
      paid: isPast || i % 3 === 0,
      paymentMethod: i % 3 === 0 ? 'online' : 'local',
      source: i % 4 === 0 ? 'manual' : 'app',
    };
  });
}
