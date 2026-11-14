import { Link, NavLink } from 'react-router-dom';
import { ENVIRONMENTS } from '../../content/indicators';
import type { CrewMember, Environment } from '../../types';
import { CrewSwitcher } from './CrewSwitcher';

interface Props {
  crew: CrewMember[];
  activeCrewId: string;
  environment: Environment;
  alertCount: number;
  onSwitchCrew: (crewId: string) => void;
}

const LINKS = [
  { to: '/', label: 'Painel' },
  { to: '/checkin', label: 'Check-in' },
  { to: '/alerts', label: 'Alertas' },
  { to: '/trends', label: 'Tendências' },
  { to: '/mission', label: 'Missão' },
];

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#17213a" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#4ade80" strokeWidth="3.5" />
      <path d="M14 33h10l4-9 6 17 4-8h12" fill="none" stroke="#eef3fb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavBar({ crew, activeCrewId, environment, alertCount, onSwitchCrew }: Props) {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" style={{ color: 'var(--text)', textDecoration: 'none' }}>
        <Logo />
        Sentinela
      </Link>
      <nav className="navbar-links" aria-label="Navegação principal">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            {link.label}
            {link.to === '/alerts' && alertCount > 0 && (
              <span className="nav-count" aria-label={`${alertCount} alertas`}>{alertCount}</span>
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
