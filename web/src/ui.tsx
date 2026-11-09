import { useEffect, useRef, useState, type ReactNode } from 'react';
import { categoryOf, type Business } from '../../src/data';
import { COMUNAS } from '../../src/location';
import { formatDistance } from '../../src/location';
import { formatRating, norm } from '../../src/utils';
import { categoryIcon, Icon } from './icons';
import { actions, href, isNear, promos, useDistance, usePlace } from './state';

const GRADIENTS = [
  ['#6B5CF5', '#21D4AB'],
  ['#FA736B', '#FCBF59'],
  ['#3399F2', '#8C66F2'],
  ['#26BF99', '#A6E680'],
  ['#E666B3', '#8C59F2'],
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Foto de relleno (degradado + ícono del rubro) mientras no tengamos fotos reales. */
export function Photo({ b, variant = 0, className = '', children }: { b: Business; variant?: number; className?: string; children?: ReactNode }) {
  const [c1, c2] = GRADIENTS[(hash(b.id) + variant) % GRADIENTS.length];
  return (
    <div className={'photo ' + className} style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} role="img" aria-label={`Foto de ${b.name} (pendiente)`}>
      <span className="photo-icon">
        <Icon name={categoryIcon[b.category] ?? 'store'} size={34} strokeWidth={1.6} />
      </span>
      {children}
    </div>
  );
}

export function Rating({ b }: { b: Business }) {
  return (
    <span className="rating">
      <Icon name="star" size={15} fill="currentColor" strokeWidth={0} />
      <b>{formatRating(b.rating)}</b>
      <span className="muted">({b.reviewsCount})</span>
    </span>
  );
}

export function minPrice(b: Business) {
  return Math.min(...b.services.map((s) => s.price));
}

export function BusinessCard({ b, compact }: { b: Business; compact?: boolean }) {
  const dist = useDistance()(b);
  const promo = promos[b.id];
  return (
    <a className={'bcard' + (compact ? ' compact' : '')} href={href({ name: 'business', id: b.id })}>
      <Photo b={b} className="bcard-photo">
        {promo && (
          <span className="badge promo">
            <Icon name="tag" size={13} /> {promo.off === 100 ? 'Gratis' : `-${promo.off}%`}
          </span>
        )}
        {b.isNew && !promo && <span className="badge new">Nuevo</span>}
      </Photo>
      <div className="bcard-body">
        <p className="bcard-cat">{categoryOf(b.category).label}</p>
        <h3 className="bcard-name">{b.name}</h3>
        <div className="bcard-meta">
          <Rating b={b} />
          <span className="dot" aria-hidden="true">·</span>
          <span className={isNear(dist) ? 'near' : 'muted'}>
            {b.comuna}
            {Number.isFinite(dist) ? `, ${formatDistance(dist)}` : ''}
          </span>
        </div>
        {!compact && <p className="bcard-price">Desde <b>{'$' + minPrice(b).toLocaleString('es-CL')}</b></p>}
      </div>
    </a>
  );
}

/** Fila horizontal con desplazamiento (como en AgendaPro) y flechas en computador. */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div className="rail-wrap">
      <button type="button" className="rail-btn left" onClick={() => scroll(-1)} aria-label={`Ver anteriores: ${label}`}>
        <Icon name="back" />
      </button>
      <div className="rail" ref={ref}>
        {children}
      </div>
      <button type="button" className="rail-btn right" onClick={() => scroll(1)} aria-label={`Ver más: ${label}`}>
        <Icon name="chevron" />
      </button>
    </div>
  );
}

export function Section({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2 className="h2">{title}</h2>
          {sub && <p className="muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', on);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="h3">{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Ventana para elegir dónde estás: ubicación del navegador o una comuna. */
export function LocationPicker({ onClose }: { onClose: () => void }) {
  const { place } = usePlace();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = COMUNAS.filter((c) => norm(c.name).includes(norm(q.trim())));
  return (
    <Modal title="¿Dónde quieres reservar?" onClose={onClose}>
      <button
        type="button"
        className="btn sec full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const err = await actions.locate();
          setBusy(false);
          if (err) setError(err);
          else onClose();
        }}
      >
        <Icon name="navigation" size={18} /> {busy ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
      </button>
      {error && (
        <p className="alert err" role="alert">
          <Icon name="alert" /> {error}
        </p>
      )}
      <label className="search small-search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca tu comuna" aria-label="Busca tu comuna" autoFocus />
      </label>
      <div className="comuna-list">
        {list.map((c) => (
          <button
            type="button"
            key={c.name}
            className={'comuna' + (c.name === place.label ? ' on' : '')}
            onClick={() => {
              actions.setComuna(c.name);
              onClose();
            }}
          >
            <Icon name="pin" size={16} />
            <span>{c.name}</span>
            <span className="muted small">{c.region}</span>
          </button>
        ))}
        {list.length === 0 && <p className="muted">No encontramos esa comuna. Por ahora estamos en Santiago, Valparaíso, Rancagua y Concepción.</p>}
      </div>
    </Modal>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="search" size={28} />
      </span>
      <h3 className="h3">{title}</h3>
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}
