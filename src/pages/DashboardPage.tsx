import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardAlertCard } from '../components/alerts/DashboardAlertCard';
import { LevelBadge, LevelIcon } from '../components/alerts/LevelBadge';
import { BodyMap } from '../components/body/BodyMap';
import { RegionPanel, type RegionItem } from '../components/body/RegionPanel';
import { displayValue, sourceLabel } from '../content/format';
import { environmentContent, REGION_ORDER, regionContent } from '../content/indicators';
import { translateText } from '../content/localize';
import { daysByEnvironment, MISSION_PROFILES } from '../content/missions';
import { estimateBoneLoss } from '../lib/boneEstimate';
import { radiationTotal } from '../lib/radiationTotal';
import { formatDate, missionDay, todayISO } from '../lib/dates';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore, useViewingOther } from '../store/useAppStore';
import type { BodyRegion, Level } from '../types';
import { baselineNote, latestRecord, symptomLabels, trackedInOrder } from './helpers';
import i18n from '../i18n';

export function DashboardPage() {
  const member = useActiveCrew();
  const viewingOther = useViewingOther();
  const { records, alerts, baselines, correlations, regionLevels, settings } = useAppStore();
  const [selected, setSelected] = useState<BodyRegion | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(null);
  }, [member?.id, member?.sex]);
  useEffect(() => {
    if (!selected) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }, [selected]);

  if (!member) return null;

  const latest = latestRecord(records);
  const today = todayISO();
  const checkinDone = latest?.date === today;
  const day = missionDay(member.missionStart, today);
  const profile = settings.missionProfile ? MISSION_PROFILES[settings.missionProfile] : undefined;
  const items: RegionItem[] = trackedInOrder(member).map((indicator) => {
    const value = latest ? displayValue(latest.values, indicator, symptomLabels()) : undefined;
    const alert = alerts.find((a) => a.indicator === indicator);
    const source = latest && sourceLabel(latest.values, indicator);
    return {
      indicator,
      value,
      level: alert?.level ?? (value ? 'green' : undefined),
      baselineNote: baselineNote(indicator, baselines),
      sourceNote: source ? i18n.t('dashboard.sourceNote', { source: source.toLocaleLowerCase(i18n.language) }) : undefined,
    };
  });
  // A apresentação distingue regiões sem medida; os níveis continuam vindo do store.
  const regions = REGION_ORDER.map((region) => {
    const measured = items.filter((item) => rules.indicators[item.indicator]?.region === region && item.value);
    const level = latest && measured.length ? regionLevels[region] : undefined;
    const flagged = measured.filter((item) => alerts.some((alert) => alert.indicator === item.indicator));
    const relevant = flagged.length ? flagged : measured;
    // Evita dois números com a mesma unidade e sem rótulos no resumo compacto.
    const count = relevant[0]?.value?.unit && relevant[0].value.unit === relevant[1]?.value?.unit ? 1 : 2;
    const summary = relevant.slice(0, count).map(({ value }) => `${value!.text}${value!.unit ? ` ${value!.unit}` : ''}`).join(' · ');
    return { region, level, summary };
  });
  const mapLevels = Object.fromEntries(regions.filter((r) => r.level).map((r) => [r.region, r.level])) as Partial<Record<BodyRegion, Level>>;
  const attention = regions.filter((r) => r.level === 'red' || r.level === 'yellow');
  const normal = regions.filter((r) => r.level === 'green');
  const missing = regions.filter((r) => !r.level);
  const hasMeasurements = regions.some((r) => r.level);
  const selectedItems = items.filter((item) => rules.indicators[item.indicator]?.region === selected);
  const bone = selected === 'musculoskeletal'
    ? estimateBoneLoss(day, profile ? daysByEnvironment(profile, day) : { [settings.environment]: day }, rules)
    : undefined;
  const radiation = selected === 'wholeBody' && member.trackedIndicators.includes('radiationDose')
    ? radiationTotal(records, latest?.missionDay ?? day, rules, member.priorCareerDoseMsv)
    : undefined;

  const regionRows = (rows: typeof regions) => (
    <ul className="console-region-list">
      {rows.map(({ region, level, summary }) => (
        <li key={region}>
          <button className="console-region-row" type="button" data-region={region} data-level={level ?? 'none'} aria-pressed={selected === region} onClick={() => setSelected(region)}>
            <span className="console-region-name">
              {level ? <span className="level-color" data-level={level}><LevelIcon level={level} /></span> : <span className="console-no-data" aria-hidden="true">—</span>}
              {regionContent(region).label}
            </span>
            <span className="console-region-reading">{summary || i18n.t('status.noData')}</span>
            <span className="console-region-state">{level ? i18n.t(`level.${level}`) : i18n.t('status.notMeasured')}</span>
            <span className="console-region-arrow" aria-hidden="true">↗</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="page console-page">
      <h1 className={viewingOther ? 'console-viewed-name' : 'visually-hidden'}>{i18n.t('dashboard.eyebrow')} · {member.name}</h1>
      <header className="mission-strip">
        <dl className="mission-strip-data">
          <div><dt>{i18n.t('dashboard.dayLabel')}</dt><dd>{day}{profile && <span> {i18n.t('dashboard.ofDays', { total: profile.durationDays })}</span>}</dd></div>
          <div><dt>{i18n.t('dashboard.environmentLabel')}</dt><dd>{environmentContent(settings.environment).label}</dd></div>
          <div><dt>{i18n.t('dashboard.lastRecordLabel')}</dt><dd>{latest ? formatDate(latest.date, true) : '—'}</dd></div>
        </dl>
        <div className="mission-strip-checkin">
          <span className="level-color" data-level={checkinDone ? 'green' : 'yellow'}><LevelIcon level={checkinDone ? 'green' : 'yellow'} />{i18n.t(checkinDone ? 'dashboard.todayDone' : 'dashboard.todayPending')}</span>
          {!viewingOther && <Link to="/checkin">{i18n.t(checkinDone ? 'dashboard.redo' : 'dashboard.startCheckin')} <span aria-hidden="true">↗</span></Link>}
        </div>
      </header>

      <div className="dashboard-console">
        <section className="console-body" aria-labelledby="body-heading">
          <h2 id="body-heading" className="console-heading">{i18n.t('dashboard.systems')}</h2>
          <p className="muted small">{i18n.t('dashboard.regionHint')}</p>
          <div className="console-figure">
            <BodyMap levels={mapLevels} selected={selected} onSelect={setSelected} figure={member.sex === 'female' ? 'female' : 'male'} />
          </div>
          <p className="console-figure-note">{i18n.t('dashboard.mapHint')}</p>
          <div className="console-legend">
            <LevelBadge level="green" label={i18n.t('status.ok')} />
            <LevelBadge level="yellow" />
            <LevelBadge level="red" />
          </div>
        </section>

        <section className="console-priority" aria-labelledby="priority-heading">
          <header className="console-section-heading">
            <h2 id="priority-heading" className="console-heading level-color" data-level={alerts.some((alert) => alert.level === 'red') ? 'red' : alerts.length ? 'yellow' : undefined}>
              {i18n.t(alerts.length ? 'dashboard.needsAttention' : hasMeasurements ? 'dashboard.allExpected' : 'status.noData')}
            </h2>
            {alerts.length > 0 && <span className="console-count">{i18n.t('dashboard.alerts', { count: alerts.length })} · {i18n.t('dashboard.regionsCount', { count: attention.length })}</span>}
          </header>
          {latest && alerts.map((alert) => <DashboardAlertCard key={alert.id} alert={alert} record={latest} baselines={baselines} />)}
          {alerts.length === 0 && <div className="console-empty">
            {hasMeasurements && <LevelBadge level="green" />}
            <p>{i18n.t(hasMeasurements ? 'dashboard.noAlerts' : latest ? 'status.notMeasured' : 'dashboard.noRecords')}</p>
          </div>}
        </section>

        <div className="console-regions">
          {attention.length > 0 && <section aria-labelledby="attention-regions-heading">
            <header className="console-section-heading"><h2 id="attention-regions-heading" className="console-heading">{i18n.t('dashboard.regionsAttention')}</h2><span className="console-count">{attention.length}</span></header>
            {regionRows(attention)}
          </section>}
          {normal.length > 0 && <section aria-labelledby="normal-regions-heading">
            <header className="console-section-heading"><h2 id="normal-regions-heading" className="console-heading">{i18n.t('level.green')}</h2><span className="console-count">{i18n.t('dashboard.regionsCount', { count: normal.length })}</span></header>
            {regionRows(normal)}
          </section>}
          {missing.length > 0 && <section aria-labelledby="missing-regions-heading">
            <header className="console-section-heading"><h2 id="missing-regions-heading" className="console-heading">{i18n.t('status.noData')}</h2></header>
            {regionRows(missing)}
          </section>}
        </div>

        {correlations.length > 0 && <aside className="console-correlations" aria-label={i18n.t('alerts:page.together')}>
          {correlations.map((correlation) => <p key={correlation.indicators.join('-')}><span className="correlation-mark" aria-hidden="true">≈</span><span>{translateText(correlation.description)}. {i18n.t('regionPanel.togetherNote')}</span></p>)}
        </aside>}

        {selected && <div className="console-detail region-panel-anchor" ref={panelRef}>
          <div className="console-detail-toolbar"><button className="btn btn-ghost" type="button" onClick={() => {
            document.querySelector<HTMLButtonElement>(`.console-region-row[data-region="${selected}"]`)?.focus();
            setSelected(null);
          }}>{i18n.t('dashboard.closeRegion')} ×</button></div>
          <RegionPanel region={selected} level={mapLevels[selected]} items={selectedItems} alerts={alerts} togetherNotes={[]} contextNotes={[bone, radiation].filter((note) => note !== undefined)} />
        </div>}
      </div>
    </div>
  );
}
