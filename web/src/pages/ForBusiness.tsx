import { useEffect } from 'react';
import { APP_URL } from '../App';
import { Icon, type IconName } from '../icons';

const FEATURES: [IconName, string, string][] = [
  ['calendar', 'Agenda online 24/7', 'Tus clientes ven tus horas libres y reservan solos, de día o de noche.'],
  ['whatsapp', 'Recordatorios por WhatsApp', 'Avisamos 24 horas antes y bajan las inasistencias. Sin límite de mensajes.'],
  ['card', 'Cobra al reservar', 'Con Webpay el pago llega a tu cuenta. También puedes cobrar en el local.'],
  ['pin', 'Clientes que están cerca', 'Apareces en "Cerca de ti" para quienes viven o están en tu zona.'],
  ['users', 'Todo tu equipo', 'Cada profesional con su color y su horario. Vista por día, semana o mes.'],
  ['tag', 'Promociones', 'Publica ofertas en PidoHora y envía campañas por WhatsApp a tus clientes.'],
];

const STEPS = [
  ['Crea tu cuenta', 'Nombre, rubro y comuna. Toma 3 minutos.'],
  ['Agrega servicios y horario', 'Partimos con servicios típicos de tu rubro para que solo ajustes precios.'],
  ['Comparte tu link', 'pidohora.cl/tu-negocio en Instagram y WhatsApp, y empiezan a llegar reservas.'],
];

export default function ForBusiness() {
  useEffect(() => {
    if (location.hash.includes('planes')) document.getElementById('planes')?.scrollIntoView();
  }, []);
  return (
    <>
      <section className="hero pro-hero">
        <div className="container pro-hero-in">
          <div>
            <p className="hero-kicker">
              <Icon name="store" size={16} /> PidoHora para negocios
            </p>
            <h1 className="hero-title">
              Llena tu agenda <span>sin contestar mensajes</span>.
            </h1>
            <p className="hero-sub">Reservas online, recordatorios por WhatsApp y pagos en un solo lugar. Para barberías, salones, centros de salud, spa y cualquier negocio con horas.</p>
            <div className="row">
              <a className="btn mint" href={APP_URL}>
                Empieza gratis 3 meses
              </a>
              <a className="btn ghost-light" href="#planes" onClick={(e) => (e.preventDefault(), document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' }))}>
                Ver precios
              </a>
            </div>
            <p className="hero-note">Sin tarjeta de crédito. Sin contrato.</p>
          </div>
          <div className="pro-mock" aria-hidden="true">
            <div className="pro-mock-head">
              <b>Hoy · martes 3</b>
              <span className="badge ok">8 reservas</span>
            </div>
            {[
              ['10:00', 'Felipe Muñoz', 'Corte de pelo', '#3B82F6'],
              ['10:30', 'Diego Rojas', 'Corte + barba', '#EC4899'],
              ['11:15', 'Tomás Vidal', 'Degradado', '#F97316'],
              ['12:00', 'Benjamín Soto', 'Barba', '#3B82F6'],
            ].map(([t, n, s, c]) => (
              <div key={t} className="pro-mock-row" style={{ borderLeftColor: c }}>
                <b>{t}</b>
                <span>
                  {n}
                  <br />
                  <span className="muted small">{s}</span>
                </span>
                <Icon name="check" size={18} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <h2 className="h1 center">Todo lo que necesitas para tu agenda</h2>
          <div className="features">
            {FEATURES.map(([icon, title, text]) => (
              <div key={title} className="feature card">
                <span className="feature-icon">
                  <Icon name={icon} size={22} />
                </span>
                <h3 className="h3">{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="h1 center">Empieza en 3 pasos</h2>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="card">
                <span className="step-n big">{i + 1}</span>
                <h3 className="h3">{t}</h3>
                <p className="muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="planes">
          <h2 className="h1 center">Precios simples</h2>
          <p className="muted center">Los primeros 3 meses son gratis en cualquier plan.</p>
          <div className="plans">
            <div className="plan card featured">
              <span className="badge info">El más elegido</span>
              <h3 className="h2">Base</h3>
              <p className="plan-price">
                $5.990 <span className="muted">al mes</span>
              </p>
              <ul>
                <li><Icon name="check" size={18} /> Agenda online y link para compartir</li>
                <li><Icon name="check" size={18} /> Recordatorios por WhatsApp ilimitados</li>
                <li><Icon name="check" size={18} /> Hasta 3 profesionales</li>
                <li><Icon name="check" size={18} /> Pagos con Webpay (pequeña comisión por pago)</li>
                <li><Icon name="check" size={18} /> Apareces en PidoHora para clientes cerca</li>
              </ul>
              <a className="btn full" href={APP_URL}>
                Probar gratis
              </a>
            </div>
            <div className="plan card">
              <h3 className="h2">Promociones</h3>
              <p className="plan-price">
                Adicional <span className="muted">según envíos</span>
              </p>
              <ul>
                <li><Icon name="check" size={18} /> Campañas por WhatsApp a tus clientes</li>
                <li><Icon name="check" size={18} /> Ofertas destacadas en el inicio</li>
                <li><Icon name="check" size={18} /> Invita de vuelta a quienes no vienen hace tiempo</li>
              </ul>
              <a className="btn white full" href="mailto:hola@pidohora.cl">
                Hablar con nosotros
              </a>
            </div>
          </div>
        </section>

        <section className="promo-band">
          <div className="promo-band-text">
            <h2 className="h1">¿Listo para recibir reservas?</h2>
            <p>Crea tu cuenta en la app y en minutos tienes tu agenda online.</p>
            <div className="row">
              <a className="btn mint" href={APP_URL}>
                Crear mi cuenta de negocio
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
