import { Link } from 'react-router-dom';
import { indicatorContent } from '../../content/indicators';
import { translateText } from '../../content/localize';
import i18n from '../../i18n';
import { hasHistoryChart } from '../../lib/series';
import type { Alert, AlertReview } from '../../types';
import { AlertReviewBox } from './AlertReviewBox';
import { LevelBadge } from './LevelBadge';

const TRIGGER_TEXT: Record<Alert['trigger'], string> = {
  generalRange: 'alerts:trigger.generalRange',
  baselineDeviation: 'alerts:trigger.baselineDeviation',
  symptom: 'alerts:trigger.symptom',
  missedMedication: 'alerts:trigger.missedMedication',
  missedMeals: 'alerts:trigger.missedMeals',
  lowWater: 'alerts:trigger.lowWater',
};

// As seis partes de todo alerta: o que mudou, a referência, por que importa,
// o que fazer, a confiança do dado e a fonte.
interface Props {
  alert: Alert;
  review?: AlertReview;
  onReview?: (note: string) => Promise<void>; // só para o oficial médico
}

export function AlertCard({ alert, review, onReview }: Props) {
  const content = indicatorContent(alert.indicator);
  return (
    <article className="card alert-card level-color" data-level={alert.level}>
      <div className="row-between">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">{content.label} · {i18n.t(TRIGGER_TEXT[alert.trigger])}</span>
          <h2 style={{ color: 'var(--text)' }}>{translateText(alert.whatChanged)}</h2>
        </div>
        <LevelBadge level={alert.level} />
      </div>

      <p className="alert-action card-inner">
        <strong>{i18n.t('alerts:card.action')}</strong>
        {i18n.t(alert.whatToDo)}
      </p>

      <dl className="alert-parts">
        <div>
          <dt>{i18n.t('alerts:card.reference')}</dt>
          <dd>{translateText(alert.reference)}</dd>
        </div>
        <div>
          <dt>{i18n.t('alerts:card.why')}</dt>
          <dd className="muted">{i18n.t(alert.whyItMatters)}</dd>
        </div>
        <div>
          <dt>{i18n.t('alerts:card.confidence')}</dt>
          <dd className="muted">
            {i18n.t(alert.confidence === 'low' ? 'alerts:card.low' : 'alerts:card.normal')}
            {alert.confidenceNote ? `: ${translateText(alert.confidenceNote).toLocaleLowerCase(i18n.language)}` : ''}
          </dd>
        </div>
        {alert.environmentNote && (
          <div>
            <dt>{i18n.t('alerts:card.environment')}</dt>
            <dd className="muted">{i18n.t(alert.environmentNote)}</dd>
          </div>
        )}
      </dl>

      {alert.notifyGround && (
        <p className="notice" style={{ color: 'var(--text)' }}>
          <span className="notice-icon" aria-hidden="true">↗</span>
          <span>{i18n.t('alerts:card.groundPriority')}</span>
        </p>
      )}

      {(review || onReview) && <AlertReviewBox review={review} onReview={onReview} />}

      <div className="row-between">
        {hasHistoryChart(alert.indicator) ? (
          <Link className="link-arrow" to={`/trends/${alert.indicator}`}>{i18n.t('alerts:card.history')}</Link>
        ) : <span />}
        <a className="link-arrow muted small" href={alert.sourceUrl} target="_blank" rel="noreferrer">
          {i18n.t('alerts:card.source')}
        </a>
      </div>
    </article>
  );
}
