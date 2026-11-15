import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { BodyMap } from '../components/body/BodyMap';
import { RegionPanel, type RegionItem } from '../components/body/RegionPanel';
import { displayValue, sourceLabel } from '../content/format';
import { environmentContent, REGION_ORDER, regionContent } from '../content/indicators';
import { daysByEnvironment, MISSION_PROFILES } from '../content/missions';
import { estimateBoneLoss } from '../lib/boneEstimate';
import { radiationTotal } from '../lib/radiationTotal';
import { formatDate, missionDay, todayISO } from '../lib/dates';
import { compareLevels, worstLevel } from '../lib/levels';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore, useViewingOther } from '../store/useAppStore';
import type { BodyRegion } from '../types';
import { baselineNote, latestRecord, symptomLabels, trackedInOrder } from './helpers';
import i18n from '../i18n';

export function DashboardPage() {
  const member = useActiveCrew();
  const viewingOther = useViewingOther();
  const { records, alerts, baselines, correlations, regionLevels, settings } = useAppStore();
  const [selected, setSelected] = useState<BodyRegion | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelected(null), [member?.id]);

  // Em telas de até 1100 px o detalhe fica abaixo da figura: ao escolher uma região, leva a tela até ele.
  const choose = (r: BodyRegion) => {
    setSelected(r);
    if (window.matchMedia('(max-width: 1100px)').matches) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panelRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    }
  };

  if (!member) return null;

  const latest = latestRecord(records);
  const today = todayISO();
  const checkinDone = latest?.date === today;
  const overall = worstLevel(...Object.values(regionLevels));
  // Sem seleção, abre a região mais grave.
  const worstRegion = [...REGION_ORDER].sort((a, b) => compareLevels(regionLevels[b], regionLevels[a]))[0];
  const region = selected ?? worstRegion;

  const items: RegionItem[] = trackedInOrder(member)
    .filter((id) => rules.indicators[id]?.region === region)
    .map((indicator) => {
      const value = latest ? displayValue(latest.values, indicator, symptomLabels()) : undefined;
      const alert = alerts.find((a) => a.indicator === indicator);
      return {
        indicator,
        value,
        level: alert?.level ?? (value ? 'green' : undefined),
        baselineNote: baselineNote(indicator, baselines),
        sourceNote: latest && sourceLabel(latest.values, indicator)
          ? i18n.t('dashboard.sourceNote', { source: sourceLabel(latest.values, indicator)!.toLocaleLowerCase(i18n.language) })
          : undefined,
      };
    });

  // Perda óssea estimada (M5): com perfil, conta os dias de cada fase; sem perfil, todos no ambiente atual.
  const day = missionDay(member.missionStart, today);
  const profile = settings.missionProfile ? MISSION_PROFILES[settings.missionProfile] : undefined;
  const bone = region === 'musculoskeletal'
    ? estimateBoneLoss(day, profile ? daysByEnvironment(profile, day) : { [settings.environment]: day }, rules)
    : undefined;
  // Radiação acumulada (M6): só para quem acompanha a dose.
  const radiation = region === 'wholeBody' && member.trackedIndicators.includes('radiationDose')
    ? radiationTotal(records, latest?.missionDay ?? day, rules) // até o último registro: hoje pode estar pendente
    : undefined;

  const togetherNotes = correlations
    .filter((c) => c.indicators.some((id) => rules.indicators[id]?.region === region))
    .map((c) => c.description);

  return (
    <div className="page">
      <section className="card hero">
        <div>
          <span className="eyebrow">{i18n.t('dashboard.eyebrow')}</span>
          <h1>{member.name}</h1>
          <div className="hero-meta">
            <span className="chip">{member.role}</span>
            <span className="chip num">{i18n.t('status.missionDay', { day: missionDay(member.missionStart, today) })}</span>
            <span className="chip">{environmentContent(settings.environment).label}</span>
            {latest && <span className="chip num">{i18n.t('status.lastRecord', { date: formatDate(latest.date) })}</span>}
          </div>
        </div>
        <div className="stack" style={{ justifyItems: 'start' }}>
          {latest ? <LevelBadge level={overall} label={alerts.length === 0 ? i18n.t('dashboard.allExpected') : i18n.t('dashboard.alerts', { count: alerts.length })} /> : <span className="chip">{i18n.t('status.recordsNone')}</span>}
          {viewingOther ? null : checkinDone ? (
            <Link className="btn" to="/checkin">{i18n.t('dashboard.checkinDone')}</Link>
          ) : (
            <Link className="btn btn-primary" to="/checkin">{i18n.t('dashboard.checkinPending')}</Link>
          )}
        </div>
      </section>

      {!checkinDone && (
        <p className="notice">
          <span className="notice-icon" aria-hidden="true">!</span>
          <span>
            {viewingOther
              ? i18n.t('dashboard.checkinOtherPending', { date: latest ? formatDate(latest.date) : i18n.t('status.noRecords') })
              : i18n.t('dashboard.checkinOwnPending', { date: latest ? formatDate(latest.date) : i18n.t('status.noRecords') })}
          </span>
        </p>
      )}

      <div className="dashboard">
        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <h2>{i18n.t('dashboard.systems')}</h2>
            <p className="small muted">{i18n.t('dashboard.regionHint')}</p>
          </div>
          <div className="body-layout">
            <BodyMap
              levels={latest ? regionLevels : {}}
              selected={region}
              onSelect={choose}
              figure={member.sex === 'female' ? 'female' : 'male'}
            />
            <ul className="region-list">
              {REGION_ORDER.map((r) => (
                <li key={r}>
                  <button type="button" className="region-button" aria-pressed={region === r} onClick={() => choose(r)}>
                    <span className="region-name">{regionContent(r).label}</span>
                    {latest ? <LevelBadge level={regionLevels[r]} label={regionLevels[r] === 'green' ? i18n.t('status.ok') : undefined} /> : <span className="chip">{i18n.t('status.noData')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div ref={panelRef} className="region-panel-anchor">
        <RegionPanel
          region={region}
          level={latest ? regionLevels[region] : undefined}
          items={items}
          alerts={alerts}
          togetherNotes={togetherNotes}
          contextNotes={[bone, radiation].filter((note) => note !== undefined)}
        />
        </div>
      </div>
    </div>
  );
}
