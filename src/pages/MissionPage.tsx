import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CabinCo2Card, CrewMissionDataCard } from '../components/mission/MissionDataCards';
import { crewHealthContext } from '../content/crewContext';
import { ENVIRONMENT_ORDER, environmentContent, indicatorContent } from '../content/indicators';
import { MISSION_PROFILE_ORDER, MISSION_PROFILES, missionStartOf, nextGravityChange, phaseOnDay } from '../content/missions';
import { addDays, diffDays, formatDate, missionDay, todayISO } from '../lib/dates';
import { hasValue } from '../lib/series';
import { exerciseVolumeSummary, weeklyGoals, type WeeklyGoal } from '../lib/weeklyGoals';
import { saveAlarmVolume } from '../data/alarmPrefsRepo';
import { setAlarmVolume, testAlarmSound, useAlarmStore, type AlarmLevel } from '../lib/alarm';
import { rules } from '../rules/rules';
import { canEditMission } from '../lib/access';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { DailyRecord, IndicatorId, MissionProfileId } from '../types';
import { trackedInOrder } from './helpers';
import i18n from '../i18n';

const REMINDER_OPTIONS = [
  { value: 0, label: 'noReminder' },
  { value: 1, label: 'everyDay' },
  { value: 2, label: 'everyTwoDays' },
  { value: 3, label: 'everyThreeDays' },
  { value: 4, label: 'everyFourDays' }, // como o teste de reação na estação (M4)
  { value: 7, label: 'weekly' },
];

// Dias seguidos com check-in, terminando hoje ou ontem.
function streak(records: DailyRecord[], today: string): number {
  const dates = new Set(records.map((r) => r.date));
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

function lastMeasured(records: DailyRecord[], indicator: IndicatorId): string | undefined {
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (hasValue(records[i].values, indicator)) return records[i].date;
  }
  return undefined;
}

// "5 dos últimos 7 dias na faixa · meta de 5 dias ✓ atingida" ou "1 dos últimos 7 dias na faixa · meta de 5 dias, faltam 4".
function goalText(goal: WeeklyGoal): string {
  const missing = goal.targetDays - goal.daysInGreen;
  const status = goal.met ? i18n.t('mission.goals.met') : i18n.t('mission.goals.missing', { count: missing });
  return i18n.t('mission.goals.progress', { days: goal.daysInGreen, window: goal.windowDays, target: goal.targetDays }) + status;
}

// "hoje", "amanhã" ou "em 5 dias" (M11).
function gravityWhen(inDays: number): string {
  if (inDays === 0) return i18n.t('mission.gravityChange.today');
  if (inDays === 1) return i18n.t('mission.gravityChange.tomorrow');
  return i18n.t('mission.gravityChange.inDays', { days: inDays });
}

export function MissionPage() {
  const member = useActiveCrew();
  const { crew, settings, records, session, setEnvironment, setMissionProfile, applyPhaseEnvironment, setReminder, resetDemo } = useAppStore();
  // Só o oficial médico recria a demonstração: recriar apaga também o registro de acesso de todos.
  const canReset = session?.role === 'medicalOfficer';
  const canEdit = canEditMission(session);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!member) return null;
  const today = todayISO();
  // O treino resistido é digitado no passo de exercício: o lembrete de exercício vale para os dois.
  const tracked = trackedInOrder(member).filter((id) => id !== 'resistanceMinutes');
  const healthContext = crewHealthContext(member.sex);
  const day = missionDay(member.missionStart, today);
  const profile = settings.missionProfile ? MISSION_PROFILES[settings.missionProfile] : undefined;
  const missionStart = missionStartOf(crew) ?? member.missionStart;
  const crewDay = missionDay(missionStart, today);
  const phase = profile ? phaseOnDay(profile, crewDay) : undefined;
  const offPhase = !!phase && settings.environment !== phase.environment;
  const goals = weeklyGoals(records, today, rules).filter((g) => member.trackedIndicators.includes(g.indicator));
  const exerciseVolume = member.trackedIndicators.includes('exerciseMinutes')
    ? exerciseVolumeSummary(records, today, rules)
    : undefined;
  // Readaptação (M11): próxima mudança de gravidade e se já está perto.
  const gravity = profile ? nextGravityChange(profile, crewDay) : undefined;
  const gravitySoon = !!gravity && gravity.inDays <= (rules.context?.readaptation?.noticeDaysBefore ?? 0);

  return (
    <div className="page mission-page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('mission.title')}</span>
        <h1>{i18n.t('mission.of', { name: member.name.split(' ')[0] })}</h1>
      </header>

      <section className="card stat-row mission-stats">
        <div className="metric">
          <span className="small muted">{i18n.t('mission.day')}</span>
          <span className="metric-value">{day}{profile && <span className="unit">{i18n.t('mission.dayOf', { total: profile.durationDays })}</span>}</span>
        </div>
        <div className="metric">
          <span className="small muted">{i18n.t('mission.start')}</span>
          <span className="metric-value">{formatDate(member.missionStart)}</span>
        </div>
        <div className="metric">
          <span className="small muted">{i18n.t('mission.streak')}</span>
          <span className="metric-value">{streak(records, today)}<span className="unit">dias</span></span>
        </div>
        <div className="metric">
          <span className="small muted">{i18n.t('mission.records')}</span>
          <span className="metric-value">{records.length}</span>
        </div>
      </section>

      {goals.length > 0 && (
        <section className="card stack">
          <div>
            <h2>{i18n.t('mission.goals.title')}</h2>
            <p className="small muted">{i18n.t('mission.goals.intro', { window: goals[0].windowDays, target: goals[0].targetDays })}</p>
          </div>
          <ul className="summary-list">
            {goals.map((goal) => (
              <li key={goal.indicator}>
                <span>{i18n.t(goal.labelKey)} ({goal.greenText})</span>
                <span className="num">
                  {goalText(goal)}
                </span>
              </li>
            ))}
          </ul>
          {exerciseVolume && (
            <p className="small muted">
              {i18n.t('mission.goals.exerciseVolume', {
                week: exerciseVolume.weekMinutes,
                plan: exerciseVolume.planMinutes,
                baseline: exerciseVolume.baselineMinutes === undefined ? i18n.t('mission.goals.noBaseline') : Math.round(exerciseVolume.baselineMinutes),
              })}
            </p>
          )}
        </section>
      )}

      <section className="card stack">
        <h2>{i18n.t('mission.gravity')}</h2>
        {gravity && gravitySoon && (
          <p className="notice" style={{ color: 'var(--text)' }}>
            <span className="notice-icon" aria-hidden="true">!</span>
            <span>
              <strong>{i18n.t(gravity.labelKey)} {gravityWhen(gravity.inDays)}.</strong>{' '}
              {i18n.t('mission.gravityChange.soonAdvice')}
            </span>
          </p>
        )}
        {gravity && !gravitySoon && (
          <p className="small muted">{i18n.t('mission.gravityChange.next', { label: i18n.t(gravity.labelKey), day: gravity.day, inDays: gravity.inDays })}</p>
        )}
        <p>{healthContext.text}</p>
        <a href={healthContext.sourceUrl} target="_blank" rel="noreferrer">{i18n.t('mission.gravitySource')}</a>
      </section>

      <section className="card stack">
        <h2>{i18n.t('mission.privacy')}</h2>
        <p>{i18n.t('mission.privacyIntro')}</p>
        <div className="row"><Link className="btn" to="/your-data">{i18n.t('mission.yourData')}</Link><Link className="btn" to="/medical-contact">{i18n.t('mission.writeMedical')}</Link></div>
      </section>

      <section className="card stack mission-wide" style={{ gap: 14 }}>
        <div>
          <h2>{i18n.t('mission.profile.title')}</h2>
          <p className="small muted">{i18n.t('mission.profile.intro')}</p>
        </div>
        <select
          className="select"
          aria-label={i18n.t('mission.profile.title')}
          value={settings.missionProfile ?? ''}
          disabled={!canEdit}
          onChange={(event) => void setMissionProfile((event.target.value || undefined) as MissionProfileId | undefined)}
        >
          <option value="">{i18n.t('mission.profile.none')}</option>
          {MISSION_PROFILE_ORDER.map((id) => (
            <option key={id} value={id}>{i18n.t(MISSION_PROFILES[id].labelKey)} ({i18n.t(MISSION_PROFILES[id].exampleKey)})</option>
          ))}
        </select>
        {profile && phase && (
          <>
            <ul className="summary-list">
              <li><span>{i18n.t('mission.profile.vehicle')}</span><span>{i18n.t(profile.vehicleKey)}</span></li>
              <li><span>{i18n.t('mission.profile.crew')}</span><span>{i18n.t(profile.crewSizeKey)}</span></li>
              <li><span>{i18n.t('mission.profile.duration')}</span><span className="num">{i18n.t('mission.profile.durationDays', { days: profile.durationDays })}</span></li>
              {profile.phases.map((p) => (
                <li key={p.labelKey}>
                  <span>{p === phase ? <strong>{i18n.t('mission.profile.currentPhase', { label: i18n.t(p.labelKey) })}</strong> : i18n.t('mission.profile.phase', { label: i18n.t(p.labelKey) })}</span>
                  <span className="num">{i18n.t('mission.profile.phaseDays', { from: p.fromDay, to: p.toDay, environment: environmentContent(p.environment).label })}</span>
                </li>
              ))}
            </ul>
            <p className="small muted">
              {i18n.t(profile.noteKey)}{' '}
              {crewDay > profile.durationDays && i18n.t('mission.profile.pastEnd', { day: crewDay, total: profile.durationDays })}
              <a href={profile.sourceUrl} target="_blank" rel="noreferrer">{i18n.t('mission.profile.source')}</a>
            </p>
          </>
        )}
      </section>

      <CabinCo2Card />

      <CrewMissionDataCard member={member} />

      <section className="card stack mission-wide" style={{ gap: 14 }}>
        <div>
          <h2>{i18n.t('mission.environment')}</h2>
          <p className="small muted">{i18n.t('mission.environmentIntro')}</p>
        </div>
        {offPhase && (
          <p className="notice">
            <span className="notice-icon" aria-hidden="true">!</span>
            <span>
              {i18n.t('mission.profile.offPhase', { environment: environmentContent(phase!.environment).label })}{' '}
              <button type="button" className="btn btn-ghost" disabled={!canEdit} onClick={() => void applyPhaseEnvironment()}>{i18n.t('mission.profile.usePhase')}</button>
            </span>
          </p>
        )}
        <fieldset className="env-grid options">
          <legend className="visually-hidden">{i18n.t('mission.environment')}</legend>
          {ENVIRONMENT_ORDER.map((env) => (
            <label key={env} className="option">
              <input type="radio" name="environment" checked={settings.environment === env} disabled={!canEdit} onChange={() => setEnvironment(env)} />
              <span className="option-face">
                {environmentContent(env).label}
                <span>{environmentContent(env).description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {!canEdit && <p className="small muted">{i18n.t('mission.editorsOnly')}</p>}
      </section>

      <AlarmVolumeCard />

      <section className="card stack mission-wide" style={{ gap: 14 }}>
        <div>
          <h2>{i18n.t('mission.reminders')}</h2>
          <p className="small muted">{i18n.t('mission.remindersIntro')}</p>
        </div>
        <div className="table-wrap">
          <table className="reminders-table">
            <thead>
              <tr><th>{i18n.t('mission.indicator')}</th><th>{i18n.t('mission.lastMeasure')}</th><th>{i18n.t('mission.reminder')}</th></tr>
            </thead>
            <tbody>
              {tracked.map((indicator) => {
                const reminder = settings.reminders.find((r) => r.indicator === indicator);
                const last = lastMeasured(records, indicator);
                const due = reminder && (!last || diffDays(last, today) >= reminder.everyDays);
                return (
                  <tr key={indicator}>
                    <td style={{ fontVariantNumeric: 'normal' }}>{indicatorContent(indicator).label}</td>
                    <td>
                      {last ? formatDate(last) : i18n.t('mission.never')}
                      {due && <span className="chip" style={{ marginLeft: 8, color: 'var(--level-yellow)' }}>! {i18n.t('mission.measureToday')}</span>}
                    </td>
                    <td>
                      <select
                        className="select"
                        aria-label={i18n.t('mission.reminderFor', { indicator: indicatorContent(indicator).label })}
                        value={reminder?.everyDays ?? 0}
                        onChange={(event) => setReminder(indicator, Number(event.target.value))}
                      >
                        {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{i18n.t(`mission.${o.label}`)}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack mission-wide demo-controls">
        <div>
          <h2>{i18n.t('mission.demoData')}</h2>
          <p className="small muted">
            {i18n.t('mission.demoExplanation')}
          </p>
          {!canReset && <p className="small muted">{i18n.t('mission.medicalOnly')}</p>}
        </div>
        {canReset && <div className="row">
          {confirmReset ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => { setConfirmReset(false); void resetDemo(); }}>
                {i18n.t('mission.resetConfirm')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>{i18n.t('buttons.cancel')}</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setConfirmReset(true)}>{i18n.t('mission.reset')}</button>
          )}
        </div>}
      </section>
    </div>
  );
}

// Volume dos alarmes por nível (WCAG 1.4.2). Preferência do aparelho, guardada sem dado de saúde.
function AlarmVolumeCard() {
  const volume = useAlarmStore((state) => state.volume);
  const change = (level: AlarmLevel, percent: number) => {
    setAlarmVolume({ [level]: percent / 100 });
    void saveAlarmVolume(useAlarmStore.getState().volume);
  };
  return (
    <section className="card stack" style={{ gap: 14 }}>
      <div>
        <h2>{i18n.t('mission.alarms.title')}</h2>
        <p className="small muted">{i18n.t('mission.alarms.intro')}</p>
      </div>
      {(['yellow', 'red'] as const).map((level) => {
        const percent = Math.round(volume[level] * 100);
        return (
          <div key={level} className="field alarm-volume">
            <label htmlFor={`alarm-volume-${level}`}>{i18n.t(`mission.alarms.${level}`)}</label>
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <input
                id={`alarm-volume-${level}`}
                type="range"
                min="0"
                max="100"
                step="10"
                value={percent}
                aria-valuetext={percent === 0 ? i18n.t('mission.alarms.off') : `${percent}%`}
                onChange={(event) => change(level, Number(event.target.value))}
              />
              <span className="num small" style={{ minWidth: 72 }}>{percent === 0 ? i18n.t('mission.alarms.off') : `${percent}%`}</span>
              <button type="button" className="btn btn-ghost" disabled={percent === 0} onClick={() => testAlarmSound(level)}>
                {i18n.t('mission.alarms.test')}
              </button>
            </div>
          </div>
        );
      })}
      <p className="small muted">{i18n.t('mission.alarms.note')}</p>
    </section>
  );
}
