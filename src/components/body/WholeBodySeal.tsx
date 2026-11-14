import { REGIONS } from '../../content/indicators';
import type { Level } from '../../types';
import { LevelIcon, LEVEL_TEXT } from '../alerts/LevelBadge';
import './BodyMap.css';

interface Props {
  level?: Level; // ausente = sem dados
  selected: boolean;
  onSelect: () => void;
}

// Selo do "Corpo inteiro": fica junto da figura, não sobre ela. Mostra nível em cor, ícone e texto.
export function WholeBodySeal({ level, selected, onSelect }: Props) {
  const status = level ? LEVEL_TEXT[level].label : 'sem dados';
  return (
    <button
      type="button"
      className="wholebody-seal"
      data-level={level ?? 'none'}
      aria-pressed={selected}
      aria-label={`${REGIONS.wholeBody.label}: ${status}. ${REGIONS.wholeBody.description}.`}
      onClick={onSelect}
    >
      <span className="wholebody-seal-title">{REGIONS.wholeBody.label}</span>
      <span className="wholebody-seal-status">
        {level ? <LevelIcon level={level} /> : null}
        <span>{status}</span>
      </span>
    </button>
  );
}
