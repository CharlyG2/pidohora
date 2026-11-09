// Íconos de línea (estilo Lucide), los mismos de la app y el Figma.

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  calendar: (
    <>
      <rect width={18} height={18} x={3} y={4} rx={2} />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  user: (
    <>
      <circle cx={12} cy={8} r={5} />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  users: (
    <>
      <circle cx={9} cy={7} r={4} />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9" />
    </>
  ),
  scissors: (
    <>
      <circle cx={6} cy={6} r={3} />
      <circle cx={6} cy={18} r={3} />
      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
    </>
  ),
  alert: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx={12} cy={10} r={3} />
    </>
  ),
  clock: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M12 6v6l4 2" />
    </>
  ),
  navigation: <path d="M3 11l19-9-9 19-2-8-8-2z" />,
  back: <path d="m15 18-6-6 6-6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  down: <path d="m6 9 6 6 6-6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  tag: (
    <>
      <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
      <circle cx={7.5} cy={7.5} r={1.5} />
    </>
  ),
  phone: (
    <>
      <rect width={14} height={20} x={5} y={2} rx={2} />
      <path d="M12 18h.01" />
    </>
  ),
  whatsapp: <path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z" />,
  card: (
    <>
      <rect width={20} height={14} x={2} y={5} rx={2} />
      <path d="M2 10h20" />
    </>
  ),
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </>
  ),
  chart: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, strokeWidth = 2, fill = 'none', className }: { name: IconName; size?: number; strokeWidth?: number; fill?: string; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/** Ícono por rubro, para tarjetas y categorías. */
export const categoryIcon: Record<string, IconName> = {
  barberia: 'scissors',
  peluqueria: 'scissors',
  unas: 'sparkle',
  estetica: 'sparkle',
  masajes: 'heart',
  salud: 'plus',
  mascotas: 'heart',
  deporte: 'chart',
};
