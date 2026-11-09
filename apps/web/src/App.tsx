import { useState, type FormEvent } from 'react';
import { Icon } from './icons';
import BookingPage from './pages/Booking';
import BusinessPage from './pages/Business';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import ForBusiness from './pages/ForBusiness';
import SearchPage from './pages/Search';
import { go, href, useAppState, usePlace, useRoute } from './state';
import { LocationPicker } from './ui';

/** Dirección de la app (versión para celular), publicada aparte de la página web. */
export const APP_URL = './app/';

export function Logo() {
  return (
    <a className="logo" href={href({ name: 'home' })} aria-label="PidoHora, inicio">
      <span className="logo-mark" aria-hidden="true">
        <Icon name="clock" size={18} strokeWidth={2.6} />
      </span>
      <span className="logo-text">
        Pido<span>Hora</span>
      </span>
    </a>
  );
}

export function LocationButton({ light }: { light?: boolean }) {
  const { place, chosen } = usePlace();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={'locbtn' + (light ? ' light' : '')} onClick={() => setOpen(true)} aria-label={`Ubicación: ${place.label}. Cambiar`}>
        <Icon name={place.source === 'gps' ? 'navigation' : 'pin'} size={17} />
        <span className="locbtn-label">{chosen ? place.label : 'Elige tu comuna'}</span>
        <Icon name="down" size={16} />
      </button>
      {open && <LocationPicker onClose={() => setOpen(false)} />}
    </>
  );
}

function HeaderSearch() {
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go({ name: 'search', q: q.trim(), cat: '' });
  };
  return (
    <form className="search header-search" onSubmit={submit} role="search">
      <Icon name="search" size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un servicio o negocio" aria-label="Busca un servicio o negocio" />
    </form>
  );
}

function Header({ onHome }: { onHome: boolean }) {
  const { bookings } = useAppState();
  const [menu, setMenu] = useState(false);
  const upcoming = bookings.filter((b) => new Date(b.start) > new Date()).length;
  return (
    <header className={'topbar' + (onHome ? ' on-home' : '')}>
      <div className="container topbar-in">
        <Logo />
        {!onHome && <HeaderSearch />}
        <div className="topbar-spacer" />
        <LocationButton />
        <nav className={'topnav' + (menu ? ' open' : '')} aria-label="Principal">
          <a href={href({ name: 'mine' })} onClick={() => setMenu(false)}>
            <Icon name="calendar" size={18} /> Mis horas{upcoming > 0 && <span className="count">{upcoming}</span>}
          </a>
          <a href={href({ name: 'pro' })} onClick={() => setMenu(false)}>
            <Icon name="store" size={18} /> Para negocios
          </a>
          <a className="btn sm" href={APP_URL}>
            <Icon name="phone" size={17} /> Descarga la app
          </a>
        </nav>
        <button type="button" className="iconbtn menu-btn" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <Icon name={menu ? 'x' : 'menu'} />
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-in">
        <div className="footer-brand">
          <Logo />
          <p className="muted">Reserva tu hora en barberías, peluquerías, uñas, spa, salud y más, cerca de ti.</p>
        </div>
        <div>
          <p className="eyebrow">Para clientes</p>
          <a href={href({ name: 'search', q: '', cat: '' })}>Buscar lugares</a>
          <a href={href({ name: 'mine' })}>Mis horas</a>
          <a href={APP_URL}>App para el celular</a>
        </div>
        <div>
          <p className="eyebrow">Para negocios</p>
          <a href={href({ name: 'pro' })}>Cómo funciona</a>
          <a href={href({ name: 'pro' }) + '?planes'}>Planes y precios</a>
          <a href={APP_URL}>Entrar a mi agenda</a>
        </div>
        <div>
          <p className="eyebrow">PidoHora</p>
          <a href="mailto:hola@pidohora.cl">hola@pidohora.cl</a>
          <span className="muted">Santiago, Chile</span>
        </div>
      </div>
      <div className="container footer-legal muted small">© 2026 PidoHora · Versión de prueba: las reservas se guardan solo en este navegador.</div>
    </footer>
  );
}

export default function App() {
  const route = useRoute();
  let page;
  switch (route.name) {
    case 'home':
      page = <Home />;
      break;
    case 'search':
      page = <SearchPage key={route.q + route.cat} q={route.q} cat={route.cat} />;
      break;
    case 'business':
      page = <BusinessPage id={route.id} />;
      break;
    case 'book':
      page = <BookingPage key={route.id} id={route.id} service={route.service} />;
      break;
    case 'mine':
      page = <MyBookings />;
      break;
    case 'pro':
      page = <ForBusiness />;
      break;
  }
  return (
    <>
      <button type="button" className="skip" onClick={() => document.getElementById('contenido')?.focus()}>
        Saltar al contenido
      </button>
      <Header onHome={route.name === 'home'} />
      <main id="contenido" tabIndex={-1}>{page}</main>
      <Footer />
    </>
  );
}
