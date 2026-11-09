import { useState, type FormEvent } from 'react';
import { categories, categoryOf, type Business } from '../../../src/data';
import { formatDistance } from '../../../src/location';
import { formatCLP, norm } from '../../../src/utils';
import { Icon } from '../icons';
import { businesses, go, href, isNear, promos, useDistance, usePlace } from '../state';
import { BusinessCard, Empty, minPrice, Photo, Rating } from '../ui';

type Sort = 'near' | 'rating' | 'price';

function matches(b: Business, q: string) {
  if (!q) return true;
  const words = norm(q).split(/\s+/).filter(Boolean);
  const text = norm([b.name, categoryOf(b.category).label, b.comuna, b.description, ...b.services.map((s) => s.name)].join(' '));
  return words.every((w) => text.includes(w));
}

function openToday(b: Business) {
  return !!b.hours[new Date().getDay()];
}

export default function SearchPage({ q: initialQ, cat: initialCat }: { q: string; cat: string }) {
  const { place } = usePlace();
  const distance = useDistance();
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState<Sort>('near');
  const [maxKm, setMaxKm] = useState(0); // 0 = sin límite
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const results = businesses
    .map((b) => ({ b, km: distance(b) }))
    .filter(({ b }) => matches(b, initialQ))
    .filter(({ b }) => !cat || b.category === cat)
    .filter(({ km }) => !maxKm || km <= maxKm)
    .filter(({ b }) => !onlyOffers || promos[b.id])
    .filter(({ b }) => !onlyOpen || openToday(b))
    .sort((a, b) => (sort === 'near' ? a.km - b.km : sort === 'rating' ? b.b.rating - a.b.rating : minPrice(a.b) - minPrice(b.b)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go({ name: 'search', q: q.trim(), cat });
  };
  const clear = () => {
    setCat('');
    setMaxKm(0);
    setOnlyOffers(false);
    setOnlyOpen(false);
  };
  const activeFilters = (cat ? 1 : 0) + (maxKm ? 1 : 0) + (onlyOffers ? 1 : 0) + (onlyOpen ? 1 : 0);

  return (
    <div className="container page">
      <form className="search big-search" onSubmit={submit} role="search">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un servicio, negocio o comuna" aria-label="Busca un servicio, negocio o comuna" />
        <button type="submit" className="btn sm">
          Buscar
        </button>
      </form>

      <div className="results-head">
        <h1 className="h2">
          {initialQ ? `“${initialQ}”` : cat ? categoryOf(cat as Business['category']).label : 'Todos los lugares'}
          <span className="muted results-count"> · {results.length} {results.length === 1 ? 'lugar' : 'lugares'}</span>
        </h1>
        <p className="muted">Ordenados desde {place.label}</p>
        <div className="results-tools">
          <button type="button" className="btn white sm filters-toggle" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
            Filtros{activeFilters ? ` (${activeFilters})` : ''}
          </button>
          <label className="sort">
            <span className="muted small">Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="near">Más cerca</option>
              <option value="rating">Mejor evaluados</option>
              <option value="price">Menor precio</option>
            </select>
          </label>
        </div>
      </div>

      <div className="results-layout">
        <aside className={'filters card' + (showFilters ? ' open' : '')} aria-label="Filtros">
          <div className="filter-group">
            <p className="filter-title">Categoría</p>
            <div className="chips-wrap">
              <button type="button" className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat('')}>
                Todas
              </button>
              {categories.map((c) => (
                <button type="button" key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <p className="filter-title">Distancia</p>
            <div className="chips-wrap">
              {[0, 3, 8, 15].map((k) => (
                <button type="button" key={k} className={'chip' + (maxKm === k ? ' on' : '')} onClick={() => setMaxKm(k)}>
                  {k ? `Hasta ${k} km` : 'Cualquiera'}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="check">
              <input type="checkbox" checked={onlyOffers} onChange={(e) => setOnlyOffers(e.target.checked)} /> Solo con ofertas
            </label>
            <label className="check">
              <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> Abiertos hoy
            </label>
          </div>
          {activeFilters > 0 && (
            <button type="button" className="link" onClick={clear}>
              Quitar filtros
            </button>
          )}
        </aside>

        <div className="results">
          {results.length === 0 && (
            <Empty
              title="No encontramos lugares"
              text={initialQ ? `No hay resultados para “${initialQ}” con estos filtros. Prueba con otra palabra o quita filtros.` : 'Prueba quitando algunos filtros.'}
              action={
                <a className="btn sec" href={href({ name: 'search', q: '', cat: '' })} onClick={clear}>
                  Ver todos los lugares
                </a>
              }
            />
          )}
          {results.map(({ b, km }) => (
            <article key={b.id} className="result card">
              <a href={href({ name: 'business', id: b.id })} className="result-photo-link" tabIndex={-1} aria-hidden="true">
                <Photo b={b} className="result-photo" />
              </a>
              <div className="result-body">
                <p className="bcard-cat">{categoryOf(b.category).label}</p>
                <h2 className="h3">
                  <a href={href({ name: 'business', id: b.id })}>{b.name}</a>
                </h2>
                <div className="bcard-meta">
                  <Rating b={b} />
                  <span className="dot">·</span>
                  <span className={isNear(km) ? 'near' : 'muted'}>
                    <Icon name="pin" size={14} /> {b.address}
                    {Number.isFinite(km) ? ` · ${formatDistance(km)}` : ''}
                  </span>
                </div>
                {promos[b.id] && (
                  <p className="promo-line">
                    <Icon name="tag" size={15} /> {promos[b.id].title}
                  </p>
                )}
                <ul className="result-services">
                  {b.services.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      <span className="muted small">{s.durationMin} min</span>
                      <b>{formatCLP(s.price)}</b>
                      <a className="btn sm sec" href={href({ name: 'book', id: b.id, service: s.id })}>
                        Reservar
                      </a>
                    </li>
                  ))}
                </ul>
                {b.services.length > 3 && (
                  <a className="link small" href={href({ name: 'business', id: b.id })}>
                    Ver los {b.services.length} servicios
                  </a>
                )}
              </div>
            </article>
          ))}
          {results.length > 0 && results.length < 3 && (
            <div className="also">
              <h2 className="h3">También te puede interesar</h2>
              <div className="grid-cards">
                {businesses
                  .filter((b) => !results.some((r) => r.b.id === b.id))
                  .slice(0, 3)
                  .map((b) => (
                    <BusinessCard key={b.id} b={b} compact />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
