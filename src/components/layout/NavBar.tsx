import { Link, NavLink } from 'react-router-dom';
import { ENVIRONMENTS } from '../../content/indicators';
import type { CrewMember, Environment } from '../../types';
import { CrewSwitcher } from './CrewSwitcher';

interface Props {
  crew: CrewMember[];
  activeCrewId: string;
  environment: Environment;
  alertCount: number;
  hasRedAlert?: boolean;
  onSwitchCrew: (crewId: string) => void;
}

// Ícones de 20x20, só decorativos: o texto do link continua sendo o nome acessível.
const ICONS: Record<string, string> = {
  '/': 'M3 10.5L10 4l7 6.5V17H12v-4.5H8V17H3z',
  '/checkin': 'M4 10.5l4 4 8-9',
  '/alerts': 'M10 3.5a4.5 4.5 0 0 0-4.5 4.5c0 3-1.5 4.5-2 5.5h13c-.5-1-2-2.5-2-5.5A4.5 4.5 0 0 0 10 3.5zM8.2 16.5h3.6',
  '/trends': 'M3 16V4M3 16h14M6.5 12l3-3.5 2.5 2L16 6',
  '/mission': 'M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5 8.4 10.1 4 8.5l4.4-1.6zM15.5 13.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z',
};

const LINKS = [
  { to: '/', label: 'Painel' },
  { to: '/checkin', label: 'Check-in' },
  { to: '/alerts', label: 'Alertas' },
  { to: '/trends', label: 'Tendências' },
  { to: '/mission', label: 'Missão' },
];

function NavIcon({ to }: { to: string }) {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[to]} />
    </svg>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#17213a" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#4ade80" strokeWidth="3.5" />
      <path d="M14 33h10l4-9 6 17 4-8h12" fill="none" stroke="#eef3fb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavBar({ crew, activeCrewId, environment, alertCount, hasRedAlert = false, onSwitchCrew }: Props) {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" style={{ color: 'var(--text)', textDecoration: 'none' }}>
        <Logo />
        Sentinela
      </Link>
      <nav className="navbar-links" aria-label="Navegação principal">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            <NavIcon to={link.to} />
            <span className="nav-label">{link.label}</span>
            {link.to === '/alerts' && alertCount > 0 && (
              <span className={hasRedAlert ? 'nav-count nav-count-red' : 'nav-count'}><span className="visually-hidden">, </span>{alertCount}<span className="visually-hidden"> {alertCount === 1 ? 'alerta' : 'alertas'}</span></span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="navbar-tools">
        <Link to="/mission" className="chip" title="Ambiente da missão">
          <span aria-hidden="true">◎</span> {ENVIRONMENTS[environment].label}
        </Link>
        {crew.length > 0 && <CrewSwitcher crew={crew} activeId={activeCrewId} onChange={onSwitchCrew} />}
      </div>
    </header>
  );
}
