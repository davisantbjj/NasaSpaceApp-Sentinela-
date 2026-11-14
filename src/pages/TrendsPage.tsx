import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IndicatorChart, type ChartBand, type ChartSeries } from '../components/charts/IndicatorChart';
import { displayText } from '../content/format';
import { INDICATORS } from '../content/indicators';
import { formatDate } from '../lib/dates';
import { formatNumber, rangesFor, seriesValue } from '../lib/series';
import { findBaseline, isBaselineReady } from '../rules/baseline';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { BpComponent, IndicatorId } from '../types';
import { baselineNote, trackedInOrder } from './helpers';

const PERIODS = [14, 30, 60];

export function TrendsPage() {
  const member = useActiveCrew();
  const { records, baselines } = useAppStore();
  const params = useParams<{ indicator?: string }>();
  const [period, setPeriod] = useState(30);

  const options: IndicatorId[] = trackedInOrder(member).filter((id) => id !== 'symptoms');
  const indicator = (options.includes(params.indicator as IndicatorId) ? params.indicator : options[0]) as IndicatorId | undefined;

  if (!member || !indicator) return null;

  const rule = rules.indicators[indicator]!;
  const content = INDICATORS[indicator];
  const components: (BpComponent | undefined)[] = rule.components ? ['systolic', 'diastolic'] : [undefined];
  const keyOf = (c?: BpComponent) => c ?? 'value';
  const window = records.slice(-period);

  const data = window.map((r) => ({
    date: r.date,
    ...Object.fromEntries(components.map((c) => [keyOf(c), seriesValue(r.values, indicator, c)])),
  }));

  const series: ChartSeries[] = components.map((c, i) => ({
    key: keyOf(c),
    label: c === 'systolic' ? 'Sistólica' : c === 'diastolic' ? 'Diastólica' : content.label,
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
        <span className="eyebrow">Tendências</span>
        <h1>{content.label}</h1>
        <p className="muted">{content.whyMeasure}</p>
      </header>

      <nav className="tabs" aria-label="Indicador">
        {options.map((id) => (
          <Link key={id} to={`/trends/${id}`} className={`tab${id === indicator ? ' active' : ''}`} aria-current={id === indicator ? 'page' : undefined}>
            {INDICATORS[id].label}
          </Link>
        ))}
      </nav>

      <section className="card stack" style={{ gap: 18 }}>
        <div className="row-between">
          <div className="stat-row" style={{ flex: 1 }}>
            <div className="metric">
              <span className="small muted">Último valor</span>
              <span className="metric-value">{last ? displayText(last.values, indicator) : '–'}</span>
            </div>
            {!scaleLabels && (
              <div className="metric">
                <span className="small muted">Média em {period} dias</span>
                <span className="metric-value">{average.join('/')}<span className="unit">{rule.unit}</span></span>
              </div>
            )}
          </div>
          <div className="row" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button key={p} type="button" className="tab num" aria-pressed={p === period} onClick={() => setPeriod(p)}>
                {p} dias
              </button>
            ))}
          </div>
        </div>

        {measured.length === 0 ? (
          <p className="muted">Ainda não há medidas deste indicador no período.</p>
        ) : (
          <IndicatorChart data={data} series={series} unit={rule.unit} bands={bands} baselines={baselineLines} scaleLabels={scaleLabels} />
        )}

        {baselineNote(indicator, baselines) && <p className="small muted">{baselineNote(indicator, baselines)}.</p>}
        {indicator === 'radiationDose' && (
          <p className="small muted">
            A radiação não tem faixa geral: a dose é comparada com o seu próprio histórico. Os cerca de 150 µSv por dia do detector Radi-N2 são só de nêutrons, medidos na estação, e servem apenas como escala.
          </p>
        )}

        <details>
          <summary>Ver os valores em tabela</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Data</th><th>Dia da missão</th><th>Valor</th></tr>
              </thead>
              <tbody>
                {[...measured].reverse().map((r) => (
                  <tr key={r.id}><td>{formatDate(r.date)}</td><td>{r.missionDay}</td><td>{displayText(r.values, indicator)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
