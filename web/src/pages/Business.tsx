import { categoryOf } from '../../../src/data';
import { formatDistance } from '../../../src/location';
import { formatCLP, formatDuration } from '../../../src/utils';
import { Icon } from '../icons';
import { businessById, businesses, href, promos, useDistance } from '../state';
import { BusinessCard, Empty, Photo, Rating } from '../ui';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function BusinessPage({ id }: { id: string }) {
  const b = businessById(id);
  const distance = useDistance();
  if (!b) {
    return (
      <div className="container page">
        <Empty
          title="No encontramos este negocio"
          text="Puede que el link esté mal escrito o que el negocio ya no esté en PidoHora."
          action={
            <a className="btn" href={href({ name: 'home' })}>
              Volver al inicio
            </a>
          }
        />
      </div>
    );
  }
  const km = distance(b);
  const promo = promos[b.id];
  const today = new Date().getDay();
  const similar = businesses.filter((x) => x.id !== b.id && x.category === b.category).concat(businesses.filter((x) => x.id !== b.id && x.category !== b.category)).slice(0, 4);

  return (
    <div className="container page">
      <nav className="crumbs small" aria-label="Ruta">
        <a href={href({ name: 'home' })}>Inicio</a>
        <Icon name="chevron" size={14} />
        <a href={href({ name: 'search', q: '', cat: b.category })}>{categoryOf(b.category).label}</a>
        <Icon name="chevron" size={14} />
        <span>{b.name}</span>
      </nav>

      <div className="gallery">
        <Photo b={b} className="g-main" />
        <Photo b={b} variant={1} className="g-side" />
        <Photo b={b} variant={3} className="g-side" />
      </div>

      <div className="biz-layout">
        <div className="biz-main">
          <header className="biz-head">
            <p className="bcard-cat">{categoryOf(b.category).label}</p>
            <h1 className="h1">{b.name}</h1>
            <div className="bcard-meta">
              <Rating b={b} />
              <span className="dot">·</span>
              <span className="muted">
                <Icon name="pin" size={15} /> {b.address}
              </span>
              {Number.isFinite(km) && (
                <>
                  <span className="dot">·</span>
                  <span className="near">{formatDistance(km)}</span>
                </>
              )}
            </div>
            <p className="biz-desc">{b.description}</p>
            {promo && (
              <p className="promo-line big">
                <Icon name="tag" size={17} /> {promo.title}
              </p>
            )}
          </header>

          <section className="biz-section" aria-labelledby="servicios">
            <h2 id="servicios" className="h2">
              Servicios
            </h2>
            <ul className="service-list">
              {b.services.map((s) => (
                <li key={s.id} className="service">
                  <div>
                    <p className="service-name">{s.name}</p>
                    <p className="muted small">
                      <Icon name="clock" size={14} /> {formatDuration(s.durationMin)}
                    </p>
                  </div>
                  <b className="service-price">{formatCLP(s.price)}</b>
                  <a className="btn sm" href={href({ name: 'book', id: b.id, service: s.id })}>
                    Reservar
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="biz-section" aria-labelledby="equipo">
            <h2 id="equipo" className="h2">
              Equipo
            </h2>
            <div className="team">
              {b.professionals.map((p) => (
                <div key={p.id} className="pro">
                  <span className="avatar" style={{ background: p.color }}>
                    {p.name[0]}
                  </span>
                  <p className="service-name">{p.name}</p>
                  <p className="muted small">{p.role}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="biz-section" aria-labelledby="resenas">
            <h2 id="resenas" className="h2">
              Reseñas <span className="muted">({b.reviewsCount})</span>
            </h2>
            <div className="reviews">
              {b.reviews.map((r, i) => (
                <article key={i} className="review card">
                  <div className="review-head">
                    <span className="avatar sm">{r.author[0]}</span>
                    <b>{r.author}</b>
                    <span className="stars" aria-label={`${r.rating} de 5 estrellas`}>
                      {Array.from({ length: 5 }, (_, k) => (
                        <Icon key={k} name="star" size={14} strokeWidth={0} fill={k < r.rating ? 'currentColor' : '#E4E3EF'} />
                      ))}
                    </span>
                    <span className="muted small">hace {r.daysAgo} {r.daysAgo === 1 ? 'día' : 'días'}</span>
                  </div>
                  <p>{r.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="biz-side">
          <div className="card sticky">
            <a className="btn full" href={href({ name: 'book', id: b.id })}>
              <Icon name="calendar" size={18} /> Reservar hora
            </a>
            <p className="muted small center">Confirmación al instante y recordatorio por WhatsApp.</p>
            <h3 className="h3 side-title">Horario</h3>
            <ul className="hours">
              {ORDER.map((d) => {
                const h = b.hours[d];
                return (
                  <li key={d} className={d === today ? 'today' : ''}>
                    <span>{DAY_NAMES[d]}</span>
                    <span className={h ? '' : 'muted'}>{h ? `${String(h.open).padStart(2, '0')}:00 – ${String(h.close).padStart(2, '0')}:00` : 'Cerrado'}</span>
                  </li>
                );
              })}
            </ul>
            <h3 className="h3 side-title">Ubicación</h3>
            <div className="map" role="img" aria-label={`Mapa de ${b.address}`}>
              <span className="map-pin">
                <Icon name="pin" size={26} />
              </span>
            </div>
            <p className="small">{b.address}</p>
            <a className="link small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`} target="_blank" rel="noreferrer">
              Cómo llegar
            </a>
          </div>
        </aside>
      </div>

      <section className="section">
        <h2 className="h2">Otros lugares que te pueden gustar</h2>
        <div className="grid-cards four">
          {similar.map((x) => (
            <BusinessCard key={x.id} b={x} compact />
          ))}
        </div>
      </section>

      <div className="mobile-cta">
        <div>
          <b>{b.name}</b>
          <p className="muted small">Desde {formatCLP(Math.min(...b.services.map((s) => s.price)))}</p>
        </div>
        <a className="btn" href={href({ name: 'book', id: b.id })}>
          Reservar
        </a>
      </div>
    </div>
  );
}
