import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '../../lib/access';
import type { Session } from '../../types';
import i18n from '../../i18n';
import { LanguageSelect } from './LanguageSelect';
import { TextSizeToggle } from './TextSizeToggle';

interface Props {
  session: Session;
  pendingSync: number;
  onLock: () => void;
}

// Quem está usando, atalhos que não cabem na barra e o botão de bloquear.
export function UserMenu({ session, pendingSync, onLock }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute('open');
  const onBoard = session.role !== 'groundSurgeon';

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ref.current?.open) {
        close();
        ref.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <details ref={ref} className="user-menu">
      <summary aria-label={`${session.name}, ${i18n.t(ROLE_LABELS[session.role])}. ${i18n.t('menu.open')}`}>
        <span className="avatar" aria-hidden="true">{session.name.slice(0, 1)}</span>
        {pendingSync > 0 && <span className="user-menu-dot" aria-hidden="true" />}
      </summary>
      <div className="user-menu-panel">
        <div className="user-menu-who">
          <strong>{session.name}</strong>
          <span className="small muted">{i18n.t(ROLE_LABELS[session.role])}</span>
        </div>
        <LanguageSelect />
        <TextSizeToggle />
        {onBoard && (
          <>
            <Link to="/mission" onClick={close}>{i18n.t('menu.mission')}</Link>
            <Link to="/sync" onClick={close}>
              {i18n.t('menu.sync')}
              {pendingSync > 0 && <span className="chip num">{i18n.t('menu.queue', { count: pendingSync })}</span>}
            </Link>
            {session.crewId && (
              <>
                <Link to="/your-data" onClick={close}>{i18n.t('menu.yourData')}</Link>
                <Link to="/medical-contact" onClick={close}>{i18n.t('menu.medicalContact')}</Link>
              </>
            )}
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => { close(); onLock(); }}>
          <span aria-hidden="true">🔒</span> {i18n.t('menu.lock')}
        </button>
      </div>
    </details>
  );
}
