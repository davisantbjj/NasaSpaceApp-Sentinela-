import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IndicatorChart, type ChartBand, type ChartSeries } from '../components/charts/IndicatorChart';
import { displayText } from '../content/format';
import { indicatorContent } from '../content/indicators';
import { formatDate } from '../lib/dates';
import { radiationTotal } from '../lib/radiationTotal';
import { formatNumber, hasHistoryChart, rangesFor, seriesValue } from '../lib/series';
import { findBaseline, isBaselineReady } from '../rules/baseline';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { BpComponent, IndicatorId } from '../types';
import { baselineNote, symptomLabels, trackedInOrder } from './helpers';
import i18n from '../i18n';

const PERIODS = [14, 30, 60];

export function TrendsPage() {
  const member = useActiveCrew();
  const { records, baselines } = useAppStore();
  const params = useParams<{ indicator?: string }>();
  const [period, setPeriod] = useState(30);

  const options: IndicatorId[] = trackedInOrder(member).filter(hasHistoryChart);
  const indicator = (options.includes(params.indicator as IndicatorId) ? params.indicator : options[0]) as IndicatorId | undefined;

  if (!member || !indicator) return null;

  const rule = rules.indicators[indicator]!;
  const content = indicatorContent(indicator);
  const components: (BpComponent | undefined)[] = rule.components ? ['systolic', 'diastolic'] : [undefined];
  const keyOf = (c?: BpComponent) => c ?? 'value';
  const window = records.slice(-period);

  const data = window.map((r) => ({
    date: r.date,
    ...Object.fromEntries(components.map((c) => [keyOf(c), seriesValue(r.values, indicator, c)])),
  }));

  const series: ChartSeries[] = components.map((c, i) => ({
    key: keyOf(c),
    label: c === 'systolic' ? i18n.t('trends.systolic') : c === 'diastolic' ? i18n.t('trends.diastolic') : content.label,
    color: i === 0 ? 'var(--chart-1)' : 'var(--chart-2)',
  }));

  const bands: ChartBand[] = components.flatMap((c) => {
    const { green } = rangesFor(rule, c);
    return green && green.min !== green.max ? [{ range: green, label: keyOf(c) }] : [];
  });

  const baselineLines = components.flatMap((c) => {
    const b = findBaseline(baselines, indicator, c);
    return rule.useBaseline && isBaselineReady(b, rules) ? [{ value: b!.mean, label: keyOf(c) }] : [];
  });

  const scaleLabels = content.scale ? Object.fromEntries(content.scale.map((o) => [String(o.value), o.label])) : undefined;
  const measured = window.filter((r) => seriesValue(r.values, indicator, components[0]) !== undefined);
  const last = measured[measured.length - 1];
  const average = components.map((c) => {
    const values = measured.map((r) => seriesValue(r.values, indicator, c)!);
    return values.length ? formatNumber(values.reduce((s, v) => s + v, 0) / values.length) : '–';
  });

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('trends.title')}</span>
        <h1>{content.label}</h1>
        <p className="muted">{content.whyMeasure}</p>
      </header>

      <nav className="tabs" aria-label={i18n.t('trends.indicator')}>
        {options.map((id) => (
          <Link key={id} to={`/trends/${id}`} className={`tab${id === indicator ? ' active' : ''}`} aria-current={id === indicator ? 'page' : undefined}>
            {indicatorContent(id).label}
          </Link>
        ))}
      </nav>

      <section className="card stack" style={{ gap: 18 }}>
        <div className="row-between">
          <div className="stat-row" style={{ flex: 1 }}>
            <div className="metric">
              <span className="small muted">{i18n.t('trends.latest')}</span>
              <span className="metric-value">{last ? displayText(last.values, indicator, symptomLabels()) : '–'}</span>
            </div>
            {!scaleLabels && (
              <div className="metric">
                <span className="small muted">{i18n.t('trends.average', { days: period })}</span>
                <span className="metric-value">{average.join('/')}<span className="unit">{rule.unit}</span></span>
              </div>
            )}
          </div>
          <div className="row" role="group" aria-label={i18n.t('trends.period')}>
            {PERIODS.map((p) => (
              <button key={p} type="button" className="tab num" aria-pressed={p === period} onClick={() => setPeriod(p)}>
                {i18n.t('trends.days', { days: p })}
              </button>
            ))}
          </div>
        </div>

        {measured.length === 0 ? (
          <p className="muted">{i18n.t('trends.noMeasurements')}</p>
        ) : (
          <IndicatorChart data={data} series={series} unit={rule.unit} bands={bands} baselines={baselineLines} scaleLabels={scaleLabels} />
        )}

        {baselineNote(indicator, baselines) &&         <p className="small muted">{baselineNote(indicator, baselines)}.</p>}
        {indicator === 'radiationDose' && (
          <div className="stack" style={{ gap: 8 }}>
            {(() => {
              const rad = radiationTotal(records, last?.missionDay ?? records.length, rules, member.priorCareerDoseMsv);
              return rad ? (
                <p className="notice">
                  <span className="notice-icon" aria-hidden="true">i</span>
                  <span>
                    {rad.text}{' '}
                    <a href={rad.sourceUrl} target="_blank" rel="noreferrer">
                      {i18n.t('regionPanel.nasaSource')}
                    </a>
                  </span>
                </p>
              ) : null;
            })()}
            <p className="small muted">
              {i18n.t('trends.radiationNote')}
            </p>
          </div>
        )}

        <details>
          <summary>{i18n.t('trends.table')}</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{i18n.t('trends.date')}</th><th>{i18n.t('trends.missionDay')}</th><th>{i18n.t('trends.value')}</th></tr>
              </thead>
              <tbody>
                {[...measured].reverse().map((r) => (
                  <tr key={r.id}><td>{formatDate(r.date)}</td><td>{r.missionDay}</td><td>{displayText(r.values, indicator, symptomLabels())}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
