import { useState } from 'react';
import { formatCLP, formatDateLong, formatTime } from '../../../src/utils';
import { Icon } from '../icons';
import { actions, businessById, href, useAppState } from '../state';
import { Empty, Modal, Photo } from '../ui';

export default function MyBookings() {
  const { bookings } = useAppState();
  const [cancel, setCancel] = useState<string | null>(null);
  const now = new Date();
  const sorted = [...bookings].sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = sorted.filter((b) => new Date(b.start) > now);
  const past = sorted.filter((b) => new Date(b.start) <= now).reverse();

  const row = (bk: (typeof bookings)[number], isPast: boolean) => {
    const biz = businessById(bk.businessId);
    if (!biz) return null;
    const start = new Date(bk.start);
    const services = biz.services.filter((s) => bk.serviceIds.includes(s.id));
    const pro = biz.professionals.find((p) => p.id === bk.professionalId);
    return (
      <article key={bk.id} className={'card booking' + (isPast ? ' past' : '')}>
        <Photo b={biz} className="booking-photo" />
        <div className="booking-body">
          <p className="booking-when">
            <Icon name="calendar" size={16} /> {formatDateLong(start)}, {formatTime(start)}
          </p>
          <h2 className="h3">
            <a href={href({ name: 'business', id: biz.id })}>{biz.name}</a>
          </h2>
          <p className="muted small">
            {services.map((s) => s.name).join(' + ')} · con {pro?.name} · {biz.address}
          </p>
          <span className={'badge ' + (bk.paid ? 'ok' : 'warn')}>{bk.paid ? `Pagado ${formatCLP(bk.total)}` : `Pagas ${formatCLP(bk.total)} en el local`}</span>
        </div>
        <div className="booking-actions">
          {isPast ? (
            <a className="btn sec sm" href={href({ name: 'book', id: biz.id, service: bk.serviceIds[0] })}>
              Volver a reservar
            </a>
          ) : (
            <>
              <a className="btn white sm" href={href({ name: 'book', id: biz.id, service: bk.serviceIds[0] })}>
                Reservar otra
              </a>
              <button type="button" className="btn ghost sm danger" onClick={() => setCancel(bk.id)}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="container page narrow">
      <h1 className="h1">Mis horas</h1>
      {bookings.length === 0 ? (
        <Empty
          title="Aún no tienes horas reservadas"
          text="Cuando reserves, tus horas aparecen aquí para cambiarlas o cancelarlas."
          action={
            <a className="btn" href={href({ name: 'home' })}>
              Buscar un lugar
            </a>
          }
        />
      ) : (
        <>
          <h2 className="h3 list-title">Próximas</h2>
          {upcoming.length ? upcoming.map((b) => row(b, false)) : <p className="muted">No tienes horas próximas.</p>}
          {past.length > 0 && (
            <>
              <h2 className="h3 list-title">Anteriores</h2>
              {past.map((b) => row(b, true))}
            </>
          )}
        </>
      )}
      {cancel && (
        <Modal title="¿Cancelar esta hora?" onClose={() => setCancel(null)}>
          <p>Le avisaremos al negocio que no vas. Si pagaste en línea, te devolvemos el dinero en 5 días hábiles.</p>
          <div className="row end">
            <button type="button" className="btn white" onClick={() => setCancel(null)}>
              No, mantener
            </button>
            <button
              type="button"
              className="btn danger-fill"
              onClick={() => {
                actions.cancelBooking(cancel);
                setCancel(null);
              }}
            >
              Sí, cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
