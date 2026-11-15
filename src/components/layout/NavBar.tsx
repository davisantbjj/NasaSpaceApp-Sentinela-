import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import i18n from '../../i18n';
import type { CrewMember, Environment, Session } from '../../types';
import { CrewSwitcher } from './CrewSwitcher';
import { UserMenu } from './UserMenu';
import { BrandMark } from './BrandMark';

interface Props {
  session: Session;
  crew: CrewMember[];
  activeCrewId: string;
  environment: Environment;
  alertCount: number;
  hasRedAlert?: boolean;
  pendingSync: number;
  onSwitchCrew: (crewId: string) => void;
  onLock: () => void;
}

// Ícones de 20x20, só decorativos: o texto do link continua sendo o nome acessível.
const ICONS: Record<string, string> = {
  '/': 'M3 10.5L10 4l7 6.5V17H12v-4.5H8V17H3z',
  '/checkin': 'M4 10.5l4 4 8-9',
  '/alerts': 'M10 3.5a4.5 4.5 0 0 0-4.5 4.5c0 3-1.5 4.5-2 5.5h13c-.5-1-2-2.5-2-5.5A4.5 4.5 0 0 0 10 3.5zM8.2 16.5h3.6',
  '/trends': 'M3 16V4M3 16h14M6.5 12l3-3.5 2.5 2L16 6',
  '/mission': 'M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5 8.4 10.1 4 8.5l4.4-1.6zM15.5 13.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z',
  '/crew': 'M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.4-5 5.5-5s5.5 2 5.5 5M13.5 3.2a3 3 0 0 1 0 5.6M15 12.2c1.8.6 3 2.4 3 4.8',
  '/ground': 'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM2.5 10h15M10 2.5c2 2 3 4.6 3 7.5s-1 5.5-3 7.5c-2-2-3-4.6-3-7.5s1-5.5 3-7.5z',
};

// No máximo cinco links: no celular eles viram a barra de baixo.
const LINKS: Record<Session['role'], { to: string; label: string }[]> = {
  crew: [
    { to: '/', label: 'nav.dashboard' },
    { to: '/checkin', label: 'nav.checkin' },
    { to: '/alerts', label: 'nav.alerts' },
    { to: '/trends', label: 'nav.trends' },
    { to: '/mission', label: 'nav.mission' },
  ],
  commander: [
    { to: '/crew', label: 'nav.crew' },
    { to: '/', label: 'nav.dashboard' },
    { to: '/checkin', label: 'nav.checkin' },
    { to: '/alerts', label: 'nav.alerts' },
    { to: '/trends', label: 'nav.trends' },
  ],
  medicalOfficer: [
    { to: '/crew', label: 'nav.crew' },
    { to: '/', label: 'nav.dashboard' },
    { to: '/checkin', label: 'nav.checkin' },
    { to: '/alerts', label: 'nav.alerts' },
    { to: '/trends', label: 'nav.trends' },
  ],
  groundSurgeon: [{ to: '/ground', label: 'nav.ground' }],
};

function NavIcon({ to }: { to: string }) {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[to]} />
    </svg>
  );
}

export function NavBar({ session, crew, activeCrewId, alertCount, hasRedAlert = false, pendingSync, onSwitchCrew, onLock }: Props) {
  const onBoard = session.role !== 'groundSurgeon';
  const home = onBoard ? '/' : '/ground';
  // Altura real da barra (muda com o texto maior e com o seletor de tripulante): o banner de
  // alarme e as âncoras usam --navbar-h para ficar logo abaixo dela.
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = ref.current;
    if (!header || typeof ResizeObserver === 'undefined') return undefined;
    const nav = header.querySelector<HTMLElement>('.navbar-links');
    const update = () => {
      document.documentElement.style.setProperty('--navbar-h', `${header.offsetHeight}px`);
      const bottomHeight = nav && getComputedStyle(nav).position === 'fixed' ? nav.offsetHeight : 0;
      document.documentElement.style.setProperty('--bottom-nav-h', `${bottomHeight}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    if (nav) observer.observe(nav);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--navbar-h');
      document.documentElement.style.removeProperty('--bottom-nav-h');
    };
  }, []);
  return (
    <header ref={ref} className={session.role === 'medicalOfficer' ? 'navbar navbar-crowded' : 'navbar'}>
      <Link to={home} className="navbar-brand" style={{ color: 'var(--text)', textDecoration: 'none' }}>
        <BrandMark />
        Sentinela
      </Link>
      <nav className="navbar-links" aria-label={i18n.t('nav.main')}>
        {LINKS[session.role].map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            <NavIcon to={link.to} />
            <span className="nav-label">{i18n.t(link.label)}</span>
            {link.to === '/alerts' && alertCount > 0 && (
              <span className={hasRedAlert ? 'nav-count nav-count-red' : 'nav-count'}><span className="visually-hidden">, </span>{alertCount}<span className="visually-hidden"> {i18n.t('nav.alert', { count: alertCount })}</span></span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="navbar-tools">
        {session.role === 'medicalOfficer' && crew.length > 0 && (
          <CrewSwitcher crew={crew} activeId={activeCrewId} onChange={onSwitchCrew} />
        )}
        <UserMenu session={session} pendingSync={pendingSync} onLock={onLock} />
      </div>
    </header>
  );
}
