import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crewHealthContext } from '../content/crewContext';
import { ENVIRONMENT_ORDER, environmentContent, indicatorContent } from '../content/indicators';
import { addDays, diffDays, formatDate, missionDay, todayISO } from '../lib/dates';
import { hasValue } from '../lib/series';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { DailyRecord, IndicatorId } from '../types';
import { trackedInOrder } from './helpers';
import i18n from '../i18n';

const REMINDER_OPTIONS = [
  { value: 0, label: 'noReminder' },
  { value: 1, label: 'everyDay' },
  { value: 2, label: 'everyTwoDays' },
  { value: 3, label: 'everyThreeDays' },
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

export function MissionPage() {
  const member = useActiveCrew();
  const { settings, records, session, setEnvironment, setReminder, resetDemo } = useAppStore();
  // Só o oficial médico recria a demonstração: recriar apaga também o registro de acesso de todos.
  const canReset = session?.role === 'medicalOfficer';
  const [confirmReset, setConfirmReset] = useState(false);

  if (!member) return null;
  const today = todayISO();
  const tracked = trackedInOrder(member);
  const healthContext = crewHealthContext(member.sex);

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('mission.title')}</span>
        <h1>{i18n.t('mission.of', { name: member.name.split(' ')[0] })}</h1>
      </header>

      <section className="card stat-row">
        <div className="metric">
          <span className="small muted">{i18n.t('mission.day')}</span>
          <span className="metric-value">{missionDay(member.missionStart, today)}</span>
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

      <section className="card stack">
        <h2>{i18n.t('mission.gravity')}</h2>
        <p>{healthContext.text}</p>
        <a href={healthContext.sourceUrl} target="_blank" rel="noreferrer">{i18n.t('mission.gravitySource')}</a>
      </section>

      <section className="card stack">
        <h2>{i18n.t('mission.privacy')}</h2>
        <p>{i18n.t('mission.privacyIntro')}</p>
        <div className="row"><Link className="btn" to="/your-data">{i18n.t('mission.yourData')}</Link><Link className="btn" to="/medical-contact">{i18n.t('mission.writeMedical')}</Link></div>
      </section>

      <section className="card stack" style={{ gap: 14 }}>
        <div>
          <h2>{i18n.t('mission.environment')}</h2>
          <p className="small muted">{i18n.t('mission.environmentIntro')}</p>
        </div>
        <fieldset className="env-grid options">
          <legend className="visually-hidden">{i18n.t('mission.environment')}</legend>
          {ENVIRONMENT_ORDER.map((env) => (
            <label key={env} className="option">
              <input type="radio" name="environment" checked={settings.environment === env} onChange={() => setEnvironment(env)} />
              <span className="option-face">
                {environmentContent(env).label}
                <span>{environmentContent(env).description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="card stack" style={{ gap: 14 }}>
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

      <section className="card stack">
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
