import type { KeyboardEvent } from 'react';
import { REGIONS } from '../../content/indicators';
import type { BodyRegion, Level } from '../../types';
import { LEVEL_TEXT } from '../alerts/LevelBadge';
import { BODY_BASE, BODY_REGIONS, BODY_VIEWBOX } from './bodyRegions';

interface Props {
  levels: Record<BodyRegion, Level>;
  selected: BodyRegion;
  onSelect: (region: BodyRegion) => void;
}

// Figura humana com regiões clicáveis. Cada região mostra a cor e também o ícone do nível.
export function BodyMap({ levels, selected, onSelect }: Props) {
  const onKey = (event: KeyboardEvent, region: BodyRegion) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(region);
    }
  };

  return (
    <svg className="body-map" viewBox={BODY_VIEWBOX} role="group" aria-label="Estado de cada região do corpo">
      {BODY_BASE.map((d) => <path key={d} className="body-base" d={d} />)}
      {BODY_REGIONS.map(({ region, paths, mark, whole }) => {
        const level = levels[region];
        return (
          <g
            key={region}
            className={`body-region level-color${whole ? ' whole' : ''}`}
            data-level={level}
            role="button"
            tabIndex={0}
            aria-pressed={selected === region}
            aria-label={`${REGIONS[region].label}: ${LEVEL_TEXT[level].label}`}
            onClick={() => onSelect(region)}
            onKeyDown={(event) => onKey(event, region)}
          >
            {paths.map((d) => <path key={d} className="region-shape" d={d} />)}
            {whole && <circle className="region-mark-bg" cx={mark.x} cy={mark.y} r={13} />}
            <text className="region-mark" x={mark.x} y={mark.y} textAnchor="middle" dominantBaseline="central">
              {LEVEL_TEXT[level].mark}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
