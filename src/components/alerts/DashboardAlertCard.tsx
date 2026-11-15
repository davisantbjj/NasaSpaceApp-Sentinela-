import { Link } from 'react-router-dom';
import { displayValue } from '../../content/format';
import { indicatorContent } from '../../content/indicators';
import { translateText } from '../../content/localize';
import { formatNumber } from '../../lib/format';
import { hasHistoryChart } from '../../lib/series';
import { baselineNote, symptomLabels } from '../../pages/helpers';
import type { Alert, Baseline, DailyRecord } from '../../types';
import { LevelBadge } from './LevelBadge';
import i18n from '../../i18n';

// Resumo visual dos alertas já calculados pelo motor; nenhuma regra é reavaliada aqui.
export function DashboardAlertCard({ alert, record, baselines }: { alert: Alert; record: DailyRecord; baselines: Baseline[] }) {
  const content = indicatorContent(alert.indicator);
  const display = displayValue(record.values, alert.indicator, symptomLabels());
  const raw = record.values[alert.indicator];
  const numeric = typeof raw === 'number';
  const pattern = baselineNote(alert.indicator, baselines);
  const value = numeric ? formatNumber(raw) : display?.text ?? translateText(alert.whatChanged);
  const unit = numeric ? content.unit : display?.unit;
  const scaleLabel = numeric ? content.scale?.find((option) => option.value === raw)?.label : undefined;

  return (
    <article className="dashboard-alert level-color" data-level={alert.level} aria-labelledby={`summary-${alert.id}`}>
      <header className="dashboard-alert-heading">
        <h3 id={`summary-${alert.id}`}>{content.label}</h3>
        <LevelBadge level={alert.level} />
      </header>
      <p className="dashboard-alert-trigger">{i18n.t(`alerts:trigger.${alert.trigger}`)}</p>
      <div className="dashboard-reading">
        <p className={`dashboard-value${numeric ? '' : ' dashboard-value-text'}`}>
          {value}{unit && <span className="dashboard-unit">{unit}</span>}
        </p>
        <div className="dashboard-reference">
          {scaleLabel && <p>{scaleLabel}</p>}
          <p>{translateText(alert.reference)}</p>
          {pattern && alert.trigger !== 'baselineDeviation' && <p>{pattern}</p>}
        </div>
      </div>
      <p className="dashboard-action">{i18n.t(alert.whatToDo)}</p>
      <div className="dashboard-alert-links">
        <Link to="/alerts">{i18n.t('dashboard.fullAlert')}<span aria-hidden="true"> ↗</span></Link>
        {hasHistoryChart(alert.indicator) && <Link to={`/trends/${alert.indicator}`}>{i18n.t('dashboard.history')}</Link>}
      </div>
    </article>
  );
}
