import type { KeyboardEvent } from 'react';
import { REGIONS } from '../../content/indicators';
import type { BodyRegion, Level } from '../../types';
import { LEVEL_TEXT } from '../alerts/LevelBadge';
import { BODY_IMAGE, BODY_REGIONS, BODY_VIEWBOX, type RegionShape } from './bodyRegions';
import './BodyMap.css';

interface Props {
  levels: Partial<Record<BodyRegion, Level>>; // região ausente = sem dados
  selected: BodyRegion;
  onSelect: (region: BodyRegion) => void;
}

// A imagem fica em public/ para funcionar sem internet. BASE_URL mantém o caminho certo
// se o app for publicado numa subpasta (GitHub Pages).
const IMAGE_SRC = `${import.meta.env.BASE_URL}body/corpo.webp`;

function Shape({ shape }: { shape: RegionShape }) {
  if (shape.kind === 'ellipse') {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  }
  return <polygon points={shape.points} />;
}

// Figura humana com regiões clicáveis. Cada região mostra a cor e também o ícone do nível:
// a cor nunca é o único sinal.
export function BodyMap({ levels, selected, onSelect }: Props) {
  const onKey = (event: KeyboardEvent, region: BodyRegion) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(region);
    }
  };

  return (
    <svg className="bodymap" viewBox={BODY_VIEWBOX} role="group" aria-label="Estado de cada região do corpo">
      <image href={IMAGE_SRC} width={BODY_IMAGE.width} height={BODY_IMAGE.height} aria-hidden="true" />
      {BODY_REGIONS.map(({ id, shapes, anchor }) => {
        const level = levels[id];
        const status = level ? LEVEL_TEXT[level].label : 'sem dados';
        const isSelected = selected === id;
        return (
          <g
            key={id}
            className={`bodymap-region bodymap-region--${level ?? 'none'}${isSelected ? ' is-selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${REGIONS[id].label}: ${status}. ${REGIONS[id].description}.`}
            onClick={() => onSelect(id)}
            onKeyDown={(event) => onKey(event, id)}
          >
            {shapes.map((shape, i) => <Shape key={i} shape={shape} />)}
            {level && (
              <g className="bodymap-marker" transform={`translate(${anchor.x} ${anchor.y})`} aria-hidden="true">
                <circle r={19} />
                <text dy="0.36em">{LEVEL_TEXT[level].mark}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
