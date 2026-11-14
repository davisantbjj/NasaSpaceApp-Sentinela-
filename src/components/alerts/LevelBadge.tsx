import type { Level } from '../../types';

// Único componente que traduz nível em cor, ícone e texto. A cor nunca é o único sinal.
export const LEVEL_TEXT: Record<Level, { label: string; mark: string }> = {
  green: { label: 'Dentro do esperado', mark: '✓' },
  yellow: { label: 'Acompanhar', mark: '!' },
  red: { label: 'Atenção imediata', mark: '▲' },
};

export const LEVEL_ICON_PATH: Record<Level, string> = {
  green: 'M2.5 6.2l2.4 2.4 4.6-5',
  yellow: 'M6 2.5v4.2M6 9.3v.2',
  red: 'M6 2.6l3.7 6.6H2.3z',
};

export function LevelIcon({ level }: { level: Level }) {
  return (
    <span className="level-icon" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill={level === 'red' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={LEVEL_ICON_PATH[level]} />
      </svg>
    </span>
  );
}

export function LevelBadge({ level, label }: { level: Level; label?: string }) {
  return (
    <span className="level-badge" data-level={level}>
      <LevelIcon level={level} />
      <span className="level-text">{label ?? LEVEL_TEXT[level].label}</span>
    </span>
  );
}
