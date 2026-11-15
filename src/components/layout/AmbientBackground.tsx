import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { useTranslation } from 'react-i18next';
import '../../styles/ambient.css';

const storageKey = 'sentinela-background-motion';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (onChange: () => void) => {
  reducedMotion.addEventListener('change', onChange);
  return () => reducedMotion.removeEventListener('change', onChange);
};
const getSnapshot = () => reducedMotion.matches;

// Preferência visual local; não altera os dados nem as configurações da missão.
const useMotion = create<{ enabled: boolean; toggle: () => void }>((set) => {
  let enabled = true;
  try { enabled = localStorage.getItem(storageKey) !== 'off'; } catch { /* navegador sem armazenamento */ }
  return {
    enabled,
    toggle: () => set((state) => {
      const next = !state.enabled;
      try { localStorage.setItem(storageKey, next ? 'on' : 'off'); } catch { /* mantém durante a sessão */ }
      return { enabled: next };
    }),
  };
});

export function AmbientBackground() {
  const enabled = useMotion((state) => state.enabled);
  return <div className="ambient-background" data-motion={enabled ? 'on' : 'off'} aria-hidden="true" />;
}

export function BackgroundMotionToggle() {
  const { t } = useTranslation();
  const { enabled, toggle } = useMotion();
  const reduced = useSyncExternalStore(subscribe, getSnapshot);
  return (
    <button type="button" className="btn btn-ghost background-motion-toggle" aria-pressed={enabled && !reduced}
      disabled={reduced} onClick={toggle}>
      <span aria-hidden="true">✧</span>
      <span>{t('background.label')}<span className="small muted motion-state">{t(reduced ? 'background.reduced' : enabled ? 'background.on' : 'background.off')}</span></span>
    </button>
  );
}
