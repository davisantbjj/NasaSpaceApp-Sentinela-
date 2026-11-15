import { Link } from 'react-router-dom';
import { AlertCard } from '../components/alerts/AlertCard';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { formatDate } from '../lib/dates';
import { currentReview } from '../lib/reviews';
import { useAppStore } from '../store/useAppStore';
import { latestRecord } from './helpers';
import i18n from '../i18n';
import { translateText } from '../content/localize';

export function AlertsPage() {
  const { alerts, correlations, records, reviews, session, reviewAlert } = useAppStore();
  const isMedicalOfficer = session?.role === 'medicalOfficer';
  const latest = latestRecord(records);
  const red = alerts.filter((a) => a.level === 'red').length;
  const yellow = alerts.length - red;

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('alerts:page.title')}</span>
        <h1>{alerts.length === 0 ? i18n.t('alerts:page.none') : i18n.t('alerts:page.inLatest', { count: alerts.length })}</h1>
        {latest && (
          <p className="muted num">{i18n.t('alerts:page.record', { date: formatDate(latest.date), day: latest.missionDay })}</p>
        )}
        {alerts.length > 0 && (
          <div className="row" style={{ marginTop: 6 }}>
            {red > 0 && <LevelBadge level="red" label={i18n.t('alerts:page.redCount', { count: red })} />}
            {yellow > 0 && <LevelBadge level="yellow" label={i18n.t('alerts:page.yellowCount', { count: yellow })} />}
          </div>
        )}
      </header>
      <p><Link to="/medical-contact">{i18n.t('alerts:page.contact')}</Link></p>

      {alerts.length === 0 ? (
        <section className="card empty">
          {latest && <LevelBadge level="green" />}
          <p className="muted">{i18n.t(latest ? 'alerts:page.allWithin' : 'alerts:page.noRecords')}</p>
          <Link className="link-arrow" to="/">{i18n.t('alerts:page.back')}</Link>
        </section>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              review={currentReview(alert, reviews, records)}
              onReview={isMedicalOfficer ? (note) => reviewAlert(alert, note) : undefined}
            />
          ))}
        </div>
      )}

      <section className="card stack">
        <div>
          <h2>{i18n.t('alerts:page.together')}</h2>
          <p className="small muted">
            {i18n.t('alerts:page.togetherExplanation')}
          </p>
        </div>
        {correlations.length === 0 ? (
          <p className="muted">{i18n.t('alerts:page.noTogether')}</p>
        ) : (
          correlations.map((c) => (
            <p key={c.indicators.join('-')} className="notice">
              <span className="notice-icon" aria-hidden="true">≈</span>
              <span>
                {translateText(c.description)} <span className="muted num">{i18n.t('alerts:page.dateRange', { from: formatDate(c.fromDate, true), to: formatDate(c.toDate, true) })}</span>
              </span>
            </p>
          ))
        )}
      </section>
    </div>
  );
}
