import { useMemo, useState } from 'react';
import { sampleBookings, type Booking } from '@pidohora/core/data';
import { availableSlots, formatCLP, formatDateLong, formatDuration, formatTime, isValidChileanPhone, newId, nextDays, sameDay } from '@pidohora/core/utils';
import { Icon } from '../icons';
import { actions, businessById, href, promos, useAppState } from '../state';
import { Empty, Photo, Rating } from '../ui';

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default function BookingPage({ id, service }: { id: string; service?: string }) {
  const b = businessById(id);
  const app = useAppState();
  const [selected, setSelected] = useState<string[]>(() => (service && b?.services.some((s) => s.id === service) ? [service] : []));
  const [proId, setProId] = useState<string>('any');
  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<{ time: Date; proId: string } | null>(null);
  const [name, setName] = useState(app.name);
  const [phone, setPhone] = useState(app.phone);
  const [pay, setPay] = useState<'online' | 'local'>('local');
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const demoBookings = useMemo(() => sampleBookings(), []);

  if (!b) {
    return (
      <div className="container page">
        <Empty title="No encontramos este negocio" text="Vuelve al inicio y búscalo de nuevo." action={<a className="btn" href={href({ name: 'home' })}>Volver al inicio</a>} />
      </div>
    );
  }

  const services = b.services.filter((s) => selected.includes(s.id));
  const duration = services.reduce((t, s) => t + s.durationMin, 0);
  const subtotal = services.reduce((t, s) => t + s.price, 0);
  const promo = promos[b.id];
  const discount = promo ? Math.round((subtotal * promo.off) / 100) : 0;
  const total = subtotal - discount;
  const taken = [...demoBookings, ...app.bookings];
  const pros = proId === 'any' ? b.professionals : b.professionals.filter((p) => p.id === proId);

  /** Horas libres del día: si es "Cualquiera", junta las de todo el equipo. */
  const slotsFor = (d: Date) => {
    const map = new Map<number, string>();
    for (const p of pros) for (const t of availableSlots(b, p.id, d, duration, taken)) if (!map.has(t.getTime())) map.set(t.getTime(), p.id);
    return [...map.entries()].sort((x, y) => x[0] - y[0]).map(([t, p]) => ({ time: new Date(t), proId: p }));
  };
  const daySlots = day && duration ? slotsFor(day) : [];
  const morning = daySlots.filter((s) => s.time.getHours() < 13);
  const afternoon = daySlots.filter((s) => s.time.getHours() >= 13);

  const phoneOk = isValidChileanPhone(phone);
  const nameOk = name.trim().length >= 2;
  const ready = services.length > 0 && slot && nameOk && phoneOk;

  const toggle = (sid: string) => {
    setSelected((cur) => (cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid]));
    setSlot(null);
  };

  const confirm = () => {
    setTried(true);
    if (!ready || !slot) return;
    const booking: Booking = {
      id: newId(),
      businessId: b.id,
      professionalId: slot.proId,
      serviceIds: services.map((s) => s.id),
      start: slot.time.toISOString(),
      durationMin: duration,
      total,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      paid: pay === 'online',
      paymentMethod: pay,
      source: 'app',
    };
    actions.addBooking(booking, name.trim(), phone.trim());
    setDone(booking);
    window.scrollTo(0, 0);
  };

  if (done) {
    const pro = b.professionals.find((p) => p.id === done.professionalId);
    const start = new Date(done.start);
    return (
      <div className="container page narrow">
        <div className="card done">
          <span className="done-icon">
            <Icon name="check" size={34} strokeWidth={3} />
          </span>
          <h1 className="h1">¡Listo, tu hora está reservada!</h1>
          <p className="note">
            Versión de prueba: esta reserva se guarda solo en este navegador. No llega al negocio y no se envía ningún
            WhatsApp.
          </p>
          <dl className="summary-list">
            <div>
              <dt>Lugar</dt>
              <dd>{b.name}</dd>
            </div>
            <div>
              <dt>Cuándo</dt>
              <dd>
                {formatDateLong(start)}, {formatTime(start)}
              </dd>
            </div>
            <div>
              <dt>Con</dt>
              <dd>{pro?.name}</dd>
            </div>
            <div>
              <dt>Servicios</dt>
              <dd>{services.map((s) => s.name).join(' + ')}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                {formatCLP(done.total)} · {done.paid ? 'Pagado en línea' : 'Pagas en el local'}
              </dd>
            </div>
          </dl>
          <div className="row center">
            <a className="btn" href={href({ name: 'mine' })}>
              Ver mis horas
            </a>
            <a className="btn white" href={href({ name: 'home' })}>
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <a className="link back" href={href({ name: 'business', id: b.id })}>
        <Icon name="back" size={18} /> Volver a {b.name}
      </a>
      <h1 className="h1">Reserva tu hora</h1>

      <div className="book-layout">
        <div className="book-steps">
          <section className="card step">
            <h2 className="h3">
              <span className="step-n">1</span> Elige los servicios
            </h2>
            <p className="muted small">Puedes elegir más de uno y los hacemos seguidos.</p>
            <ul className="service-pick">
              {b.services.map((s) => (
                <li key={s.id}>
                  <label className={selected.includes(s.id) ? 'on' : ''}>
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                    <span className="sp-name">{s.name}</span>
                    <span className="muted small">{formatDuration(s.durationMin)}</span>
                    <b>{formatCLP(s.price)}</b>
                  </label>
                </li>
              ))}
            </ul>
            {tried && services.length === 0 && <p className="help err">Elige al menos un servicio.</p>}
          </section>

          <section className={'card step' + (services.length ? '' : ' locked')}>
            <h2 className="h3">
              <span className="step-n">2</span> ¿Con quién?
            </h2>
            <div className="chips-wrap">
              <button type="button" className={'chip' + (proId === 'any' ? ' on' : '')} onClick={() => (setProId('any'), setSlot(null))}>
                <Icon name="users" size={16} /> Cualquiera
              </button>
              {b.professionals.map((p) => (
                <button type="button" key={p.id} className={'chip' + (proId === p.id ? ' on' : '')} onClick={() => (setProId(p.id), setSlot(null))}>
                  <span className="avatar xs" style={{ background: p.color }}>
                    {p.name[0]}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </section>

          <section className={'card step' + (services.length ? '' : ' locked')}>
            <h2 className="h3">
              <span className="step-n">3</span> Día y hora
            </h2>
            {!services.length ? (
              <p className="muted">Primero elige un servicio para ver las horas libres.</p>
            ) : (
              <>
                <div className="days" role="listbox" aria-label="Día">
                  {days.map((d) => {
                    const closed = !b.hours[d.getDay()];
                    const on = day && sameDay(d, day);
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={!!on}
                        key={d.toISOString()}
                        className={'day' + (on ? ' on' : '') + (closed ? ' closed' : '')}
                        disabled={closed}
                        onClick={() => (setDay(d), setSlot(null))}
                      >
                        <span className="small">{DAY_SHORT[d.getDay()]}</span>
                        <b>{d.getDate()}</b>
                        <span className="small">{closed ? 'Cerrado' : MONTH_SHORT[d.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>
                {!day && <p className="muted">Elige un día.</p>}
                {day && daySlots.length === 0 && <p className="note">No quedan horas libres este día. Prueba con otro día u otra persona del equipo.</p>}
                {day &&
                  [
                    ['Mañana', morning],
                    ['Tarde', afternoon],
                  ].map(([label, list]) =>
                    (list as typeof daySlots).length ? (
                      <div key={label as string} className="slot-group">
                        <p className="filter-title">{label as string}</p>
                        <div className="slots">
                          {(list as typeof daySlots).map((s) => (
                            <button
                              type="button"
                              key={s.time.getTime()}
                              className={'slot' + (slot && slot.time.getTime() === s.time.getTime() ? ' on' : '')}
                              onClick={() => setSlot(s)}
                            >
                              {formatTime(s.time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                {tried && !slot && <p className="help err">Elige una hora.</p>}
              </>
            )}
          </section>

          <section className="card step">
            <h2 className="h3">
              <span className="step-n">4</span> Tus datos
            </h2>
            <div className="form-grid">
              <div className={'field' + (tried && !nameOk ? ' err' : '')}>
                <label htmlFor="bk-name">Nombre</label>
                <input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ej: Camila González" />
                {tried && !nameOk && <span className="help err">Escribe tu nombre.</span>}
              </div>
              <div className={'field' + (tried && !phoneOk ? ' err' : '')}>
                <label htmlFor="bk-phone">WhatsApp</label>
                <input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="+56 9 1234 5678" />
                {tried && !phoneOk ? <span className="help err">Número incompleto: +56 9 y 8 dígitos.</span> : <span className="help">Aquí te llega la confirmación.</span>}
              </div>
            </div>
            <p className="filter-title">¿Cómo quieres pagar?</p>
            <div className="pay">
              <label className={pay === 'local' ? 'on' : ''}>
                <input type="radio" name="pay" checked={pay === 'local'} onChange={() => setPay('local')} />
                <Icon name="store" />
                <span>
                  <b>En el local</b>
                  <span className="muted small">Pagas el día de tu hora.</span>
                </span>
              </label>
              <label className={pay === 'online' ? 'on' : ''}>
                <input type="radio" name="pay" checked={pay === 'online'} onChange={() => setPay('online')} />
                <Icon name="card" />
                <span>
                  <b>Ahora con Webpay</b>
                  <span className="muted small">Débito o crédito. (De prueba, no se cobra.)</span>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="book-side">
          <div className="card sticky">
            <div className="sum-biz">
              <Photo b={b} className="sum-photo" />
              <div>
                <b>{b.name}</b>
                <Rating b={b} />
              </div>
            </div>
            {services.length === 0 ? (
              <p className="muted small">Aún no eliges servicios.</p>
            ) : (
              <ul className="sum-lines">
                {services.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <span>{formatCLP(s.price)}</span>
                  </li>
                ))}
                {discount > 0 && (
                  <li className="discount">
                    <span>{promo.title}</span>
                    <span>-{formatCLP(discount)}</span>
                  </li>
                )}
              </ul>
            )}
            {slot && (
              <p className="sum-when">
                <Icon name="calendar" size={16} /> {formatDateLong(slot.time)}, {formatTime(slot.time)} · {formatDuration(duration)}
                <br />
                <Icon name="user" size={16} /> Con {b.professionals.find((p) => p.id === slot.proId)?.name}
              </p>
            )}
            <div className="sum-total">
              <span>Total</span>
              <b>{formatCLP(total)}</b>
            </div>
            <button type="button" className="btn full" onClick={confirm}>
              {pay === 'online' ? 'Pagar y reservar' : 'Confirmar reserva'}
            </button>
            {tried && !ready && <p className="help err center">Te falta completar lo que está marcado en rojo.</p>}
            <p className="muted small center">Puedes cancelar gratis hasta 2 horas antes.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
