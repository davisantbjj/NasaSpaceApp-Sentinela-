import { useId, type CSSProperties, type KeyboardEvent } from 'react';
import { regionContent } from '../../content/indicators';
import type { BodyRegion, Level } from '../../types';
import { LEVEL_ICON_PATH, LEVEL_TEXT } from '../alerts/LevelBadge';
import { BODY_FIGURES, type BodyFigure, type BodyRegionDef, type RegionShape } from './bodyRegions';
import './BodyMap.css';
import i18n from '../../i18n';

interface Props {
  levels: Partial<Record<BodyRegion, Level>>; // região ausente = sem dados
  selected: BodyRegion | null;
  onSelect: (region: BodyRegion) => void;
  figure?: BodyFigure; // padrão: masculina
}

// As imagens ficam em public/ para funcionar sem internet. BASE_URL mantém o caminho certo
// se o app for publicado numa subpasta (GitHub Pages).
const imageSrc = (file: string) => `${import.meta.env.BASE_URL}${file}`;

const MARKER_R = 15;

function Shape({ shape, className }: { shape: RegionShape; className: string }) {
  if (shape.kind === 'ellipse') {
    return <ellipse className={className} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  }
  return <path className={className} d={shape.d} />;
}

// Marcador com o ícone do nível (o mesmo desenho do LevelBadge). Fica fora das formas
// pequenas, ligado a elas por uma linha curta.
function Marker({ marker, level }: { marker: BodyRegionDef['marker']; level: Level }) {
  const { x, y, leader } = marker;
  let line = null;
  if (leader) {
    const dx = leader.x - x;
    const dy = leader.y - y;
    const len = Math.hypot(dx, dy) || 1;
    line = <line className="bodymap-leader" x1={x + (dx / len) * MARKER_R} y1={y + (dy / len) * MARKER_R} x2={leader.x} y2={leader.y} />;
  }
  return (
    <g className="bodymap-marker" aria-hidden="true">
      {line}
      <g transform={`translate(${x} ${y})`}>
        <circle className="bodymap-marker-ring" r={MARKER_R} />
        <path
          className={`bodymap-marker-icon${level === 'red' ? ' is-filled' : ''}`}
          d={LEVEL_ICON_PATH[level]}
          transform="scale(1.75) translate(-6 -6)"
        />
      </g>
    </g>
  );
}

// Figura humana com regiões clicáveis. Cada região mostra a cor e também o ícone do nível:
// a cor nunca é o único sinal.
export function BodyMap({ levels, selected, onSelect, figure = 'male' }: Props) {
  const { image, viewBox, regions } = BODY_FIGURES[figure];
  const glowId = `bodymap-glow-${useId().replace(/:/g, '')}`;
  const scannerId = `bodymap-scanner-${useId().replace(/:/g, '')}`;
  const beamId = `bodymap-beam-${useId().replace(/:/g, '')}`;
  const gridId = `bodymap-grid-${useId().replace(/:/g, '')}`;
  const silhouette = regions.find((region) => region.id === 'wholeBody')?.outline;
  const [viewX, viewY, viewWidth, viewHeight] = viewBox.split(' ').map(Number);
  const band = Math.round(viewHeight * 0.14); // altura da faixa do scanner

  const onKey = (event: KeyboardEvent, region: BodyRegion) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(region);
    }
  };

  return (
    <svg
      className="bodymap"
      viewBox={viewBox}
      role="group"
      aria-label={i18n.t('bodyMap.label')}
      style={{ '--bodymap-glow': `url(#${glowId})` } as CSSProperties}
    >
      <defs>
        {/* Brilho suave que usa a cor da própria forma. */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={scannerId}>
          {silhouette ? <path d={silhouette} /> : <rect x="0" y="0" width={viewWidth} height={viewHeight} />}
        </clipPath>
        {/* Faixa do scanner: transparente em cima, mais forte perto da borda de baixo. */}
        <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.85" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.45" />
        </linearGradient>
        <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0H0V14" fill="none" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      <image href={imageSrc(image.file)} width={image.width} height={image.height} aria-hidden="true" />
      {/* Scanner: grade fina parada e uma faixa que percorre o corpo de cima a baixo, recortadas na silhueta.
          Só decoração (aria-hidden); para com prefers-reduced-motion. */}
      <g className="bodymap-scanner" clipPath={`url(#${scannerId})`} aria-hidden="true"
        style={{ '--scan-distance': `${viewHeight + band}px` } as CSSProperties}>
        <rect className="bodymap-scanner-grid" x={viewX} y={viewY} width={viewWidth} height={viewHeight} fill={`url(#${gridId})`} />
        <g className="bodymap-scanner-beam">
          <rect x={viewX} y={viewY - band} width={viewWidth} height={band} fill={`url(#${beamId})`} />
          <line x1={viewX} x2={viewX + viewWidth} y1={viewY} y2={viewY} />
        </g>
      </g>
      {regions.map((def) => {
        const { id, shapes, marker, padHit, outline } = def;
        const level = levels[id];
        const status = level ? i18n.t(LEVEL_TEXT[level].label) : i18n.t('bodyMap.noData');
        const content = regionContent(id);
        const isSelected = selected === id;
        return (
          <g
            key={id}
            className={`bodymap-region bodymap-region--${level ?? 'none'}${isSelected ? ' is-selected' : ''}`}
            data-region={id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${content.label}: ${status}. ${content.description}.`}
            onClick={() => onSelect(id)}
            onKeyDown={(event) => onKey(event, id)}
          >
            {outline && <path className="bodymap-outline" d={outline} aria-hidden="true" />}
            {padHit && shapes.map((shape, i) => <Shape key={`hit-${i}`} shape={shape} className="bodymap-hit" />)}
            {shapes.map((shape, i) => <Shape key={i} shape={shape} className="bodymap-shape" />)}
            {level && <Marker marker={marker} level={level} />}
          </g>
        );
      })}
    </svg>
  );
}
