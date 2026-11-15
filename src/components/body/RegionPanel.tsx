import { Link } from 'react-router-dom';
import { INDICATORS, REGIONS } from '../../content/indicators';
import type { DisplayValue } from '../../content/format';
import { hasHistoryChart } from '../../lib/series';
import type { Alert, BodyRegion, IndicatorId, Level } from '../../types';
import { LevelBadge } from '../alerts/LevelBadge';

export interface RegionItem {
  indicator: IndicatorId;
  value?: DisplayValue; // ausente quando não foi medido no último registro
  level?: Level;
  baselineNote?: string;
  sourceNote?: string; // "Origem: sensor vestível" (M10)
}

interface Props {
  region: BodyRegion;
  level?: Level;
  items: RegionItem[];
  alerts: Alert[];
  togetherNotes: string[]; // "mudaram juntos"
  contextNotes?: { text: string; sourceUrl: string }[]; // contexto que não é alerta (ex.: perda óssea estimada)
}

// Detalhe da região selecionada na figura humana.
export function RegionPanel({ region, level, items, alerts, togetherNotes, contextNotes = [] }: Props) {
  return (
    <section className="card stack" style={{ gap: 16 }} aria-live="polite">
      <div className="row-between">
        <div>
          <span className="eyebrow">Região selecionada</span>
          <h2>{REGIONS[region].label}</h2>
        </div>
        {level ? <LevelBadge level={level} /> : <span className="chip">Sem dados</span>}
      </div>

      {items.length === 0 && (
        <p className="muted">Este tripulante não acompanha indicadores desta região.</p>
      )}

      {items.map((item) => {
        const alert = alerts.find((a) => a.indicator === item.indicator);
        return (
          <div key={item.indicator} className="card-inner stack">
            <div className="row-between">
              <div className="metric">
                <span className="small muted">{INDICATORS[item.indicator].label}</span>
                {item.value ? (
                  <span className="metric-value">
                    {item.value.text}
                    {item.value.unit && <span className="unit">{item.value.unit}</span>}
                  </span>
                ) : (
                  <span className="muted">Não medido no último registro</span>
                )}
              </div>
              {item.level && <LevelBadge level={item.level} />}
            </div>
            {alert && (
              <p className="small">
                <strong>{alert.whatChanged}.</strong> {alert.whatToDo}
              </p>
            )}
            {item.baselineNote && <p className="small muted">{item.baselineNote}</p>}
            {item.sourceNote && <p className="small muted">{item.sourceNote}</p>}
            <div className="row">
              {alert && <Link className="link-arrow" to="/alerts">Ver alerta →</Link>}
              {hasHistoryChart(item.indicator) && (
                <Link className="link-arrow" to={`/trends/${item.indicator}`}>Ver histórico →</Link>
              )}
            </div>
          </div>
        );
      })}

      {contextNotes.map((note) => (
        <p key={note.text} className="notice">
          <span className="notice-icon" aria-hidden="true">i</span>
          <span>
            {note.text}{' '}
            <a href={note.sourceUrl} target="_blank" rel="noreferrer">Fonte: NASA (abre outro site)</a>
          </span>
        </p>
      ))}

      {togetherNotes.map((note) => (
        <p key={note} className="notice">
          <span className="notice-icon" aria-hidden="true">≈</span>
          <span>{note}. Isso não quer dizer que um causou o outro.</span>
        </p>
      ))}
    </section>
  );
}
