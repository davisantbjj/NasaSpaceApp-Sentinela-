import { Link } from 'react-router-dom';
import { indicatorContent, regionContent } from '../../content/indicators';
import type { DisplayValue } from '../../content/format';
import { hasHistoryChart } from '../../lib/series';
import type { Alert, BodyRegion, IndicatorId, Level, LocalizedText } from '../../types';
import { LevelBadge } from '../alerts/LevelBadge';
import { translateText } from '../../content/localize';
import i18n from '../../i18n';

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
  togetherNotes: LocalizedText[]; // "mudaram juntos"
  contextNotes?: { text: string; sourceUrl: string }[]; // contexto que não é alerta (ex.: perda óssea estimada)
}

// Detalhe da região selecionada na figura humana.
export function RegionPanel({ region, level, items, alerts, togetherNotes, contextNotes = [] }: Props) {
  const regionText = regionContent(region);
  return (
    <section className="card stack" style={{ gap: 16 }} aria-live="polite">
      <div className="row-between">
        <div>
          <span className="eyebrow">{i18n.t('regionPanel.selected')}</span>
          <h2>{regionText.label}</h2>
        </div>
        {level ? <LevelBadge level={level} /> : <span className="chip">{i18n.t('status.noData')}</span>}
      </div>

      {items.length === 0 && (
        <p className="muted">{i18n.t('regionPanel.noTracked')}</p>
      )}

      {items.map((item) => {
        const alert = alerts.find((a) => a.indicator === item.indicator);
        return (
          <div key={item.indicator} className="card-inner stack">
            <div className="row-between">
              <div className="metric">
                <span className="small muted">{indicatorContent(item.indicator).label}</span>
                {item.value ? (
                  <span className="metric-value">
                    {item.value.text}
                    {item.value.unit && <span className="unit">{item.value.unit}</span>}
                  </span>
                ) : (
                  <span className="muted">{i18n.t('status.notMeasured')}</span>
                )}
              </div>
              {item.level && <LevelBadge level={item.level} />}
            </div>
            {alert && (
              <p className="small">
                <strong>{translateText(alert.whatChanged)}.</strong> {i18n.t(alert.whatToDo)}
              </p>
            )}
            {item.baselineNote && <p className="small muted">{item.baselineNote}</p>}
            {item.sourceNote && <p className="small muted">{item.sourceNote}</p>}
            <div className="row">
              {alert && <Link className="link-arrow" to="/alerts">{i18n.t('regionPanel.viewAlert')}</Link>}
              {hasHistoryChart(item.indicator) && (
                <Link className="link-arrow" to={`/trends/${item.indicator}`}>{i18n.t('regionPanel.history')}</Link>
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
            <a href={note.sourceUrl} target="_blank" rel="noreferrer">{i18n.t('regionPanel.nasaSource')}</a>
          </span>
        </p>
      ))}

      {togetherNotes.map((note) => (
        <p key={`${note.key}_${JSON.stringify(note.params)}`} className="notice">
          <span className="notice-icon" aria-hidden="true">≈</span>
          <span>{translateText(note)}. {i18n.t('regionPanel.togetherNote')}</span>
        </p>
      ))}
    </section>
  );
}
