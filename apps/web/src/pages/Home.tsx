import { useState, type FormEvent } from 'react';
import { categories } from '@pidohora/core/data';
import { softTints } from '@pidohora/tokens';
import { APP_URL, LocationButton } from '../App';
import { categoryIcon, Icon } from '../icons';
import { businesses, go, href, isNear, promos, useDistance, usePlace } from '../state';
import { BusinessCard, Photo, Rail, Section } from '../ui';

const POPULAR = ['Corte de pelo', 'Manicure', 'Masaje', 'Limpieza facial', 'Kinesiología', 'Baño de mascota'];
const TINTS = softTints;
const INKS = ['#3F2FD9', '#0B7A61', '#8A5A00', '#B4362C', '#1D5FBF'];

export default function Home() {
  const { place, chosen } = usePlace();
  const distance = useDistance();
  const [q, setQ] = useState('');

  const withDist = businesses.map((b) => ({ b, km: distance(b) }));
  const near = withDist.filter((x) => isNear(x.km));
  const nearSorted = [...near].sort((a, b) => b.b.visits - a.b.visits).map((x) => x.b);
  const closest = [...withDist].sort((a, b) => a.km - b.km).map((x) => x.b);
  const topRated = [...withDist].sort((a, b) => b.b.rating - a.b.rating || a.km - b.km).map((x) => x.b);
  const fresh = businesses.filter((b) => b.isNew);
  const offers = closest.filter((b) => promos[b.id]);
  const comunas = Object.entries(
    businesses.reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.comuna]: (acc[b.comuna] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go({ name: 'search', q: q.trim(), cat: '' });
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-in">
          <p className="hero-kicker">
            <Icon name="sparkle" size={16} /> Reserva en línea las 24 horas
          </p>
          <h1 className="hero-title">
            Reserva tu hora <span>cerca de ti</span>, sin llamar ni esperar.
          </h1>
          <p className="hero-sub">Barberías, peluquerías, uñas, spa, salud, mascotas y más. Eliges el día, la hora y listo.</p>
          <form className="hero-search" onSubmit={submit} role="search">
            <label className="hero-field">
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué quieres reservar?" aria-label="¿Qué quieres reservar?" />
            </label>
            <span className="hero-divider" aria-hidden="true" />
            <LocationButton light />
            <button type="submit" className="btn">
              Buscar
            </button>
          </form>
          <div className="hero-popular">
            <span>Lo más buscado:</span>
            {POPULAR.map((p) => (
              <a key={p} className="chip light" href={href({ name: 'search', q: p, cat: '' })}>
                {p}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <Section title="Categorías">
          <div className="cats">
            {categories.map((c, i) => (
              <a key={c.id} className="cat" href={href({ name: 'search', q: '', cat: c.id })} style={{ background: TINTS[i % 5], color: INKS[i % 5] }}>
                <Icon name={categoryIcon[c.id] ?? 'store'} size={26} />
                <span>{c.label}</span>
              </a>
            ))}
          </div>
        </Section>

        <Section
          title={nearSorted.length ? `Recomendados cerca de ${place.label}` : `Los más cercanos a ${place.label}`}
          sub={
            chosen
              ? place.source === 'gps'
                ? 'Según tu ubicación actual.'
                : 'Según la comuna que elegiste.'
              : 'Elige tu comuna arriba para ver lo que tienes más cerca.'
          }
          action={
            <a className="link" href={href({ name: 'search', q: '', cat: '' })}>
              Ver todos
            </a>
          }
        >
          {nearSorted.length === 0 && <p className="note">Aún no hay lugares a menos de 8 km de {place.label}. Te mostramos los más cercanos.</p>}
          <Rail label="lugares cerca">
            {(nearSorted.length ? nearSorted : closest).map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </Rail>
        </Section>

        {offers.length > 0 && (
          <Section title="Ofertas de la semana" sub="Descuentos que publican los negocios. Se aplican al reservar.">
            <div className="offers">
              {offers.slice(0, 4).map((b) => (
                <a key={b.id} className="offer" href={href({ name: 'business', id: b.id })}>
                  <Photo b={b} variant={2} className="offer-photo">
                    <span className="offer-off">{promos[b.id].off === 100 ? 'Gratis' : `-${promos[b.id].off}%`}</span>
                  </Photo>
                  <div className="offer-body">
                    <p className="h3">{promos[b.id].title}</p>
                    <p className="muted small">
                      {b.name} · {b.comuna}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="Mejor evaluados" sub="Lo que más recomiendan los clientes de PidoHora.">
          <Rail label="mejor evaluados">
            {topRated.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </Rail>
        </Section>

        {fresh.length > 0 && (
          <Section title="Nuevos en PidoHora">
            <div className="grid-cards">
              {fresh.map((b) => (
                <BusinessCard key={b.id} b={b} />
              ))}
            </div>
          </Section>
        )}

        <Section title="Explora por comuna">
          <div className="comuna-chips">
            {comunas.map(([c, n]) => (
              <a key={c} className="chip" href={href({ name: 'search', q: c, cat: '' })}>
                <Icon name="pin" size={15} /> {c} <span className="muted">{n}</span>
              </a>
            ))}
          </div>
        </Section>

        <section className="promo-band">
          <div className="promo-band-text">
            <p className="eyebrow light">Para negocios</p>
            <h2 className="h1">¿Tienes un negocio? Recibe reservas las 24 horas.</h2>
            <p>Agenda online, recordatorios por WhatsApp y pagos al reservar. 3 meses gratis, después $5.990 al mes.</p>
            <div className="row">
              <a className="btn mint" href={href({ name: 'pro' })}>
                Conoce PidoHora para negocios
              </a>
            </div>
          </div>
          <ul className="promo-band-list">
            <li>
              <Icon name="calendar" /> Agenda por día, semana o mes
            </li>
            <li>
              <Icon name="whatsapp" /> Recordatorios automáticos
            </li>
            <li>
              <Icon name="card" /> Cobra al reservar con Webpay
            </li>
            <li>
              <Icon name="pin" /> Te encuentran los clientes que están cerca
            </li>
          </ul>
        </section>

        <section className="app-band">
          <span className="app-band-icon">
            <Icon name="phone" size={30} />
          </span>
          <div>
            <h2 className="h2">Lleva tus horas en el bolsillo</h2>
            <p className="muted">Con la app de PidoHora reservas en segundos y te avisamos antes de cada hora.</p>
          </div>
          <a className="btn sec" href={APP_URL}>
            Abrir la app
          </a>
        </section>
      </div>
    </>
  );
}
