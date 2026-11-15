import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { displayValue, exerciseSummary, sleepQualityText, sourceLabel } from '../content/format';
import { CHECKIN_ORDER, environmentContent, indicatorContent } from '../content/indicators';
import { translateText } from '../content/localize';
import { MISSION_PROFILES } from '../content/missions';
import { useNow } from '../hooks/useNow';
import { formatDate, formatDateTime, formatDuration } from '../lib/dates';
import { worstLevel } from '../lib/levels';
import { useAppStore } from '../store/useAppStore';
import { packetStatus } from '../sync/packets';
import type { GroundPacket } from '../types';
import { symptomLabels } from './helpers';
import i18n from '../i18n';

function packetLevel(packet: GroundPacket) {
  return worstLevel(...packet.payload.alerts.map((a) => a.level));
}

// O médico do solo só vê o que chegou à Terra, sempre com a hora do dado e a hora de chegada.
export function GroundPage() {
  const { crewId } = useParams();
  const { crew, sync, settings } = useAppStore();
  const now = useNow(1000);
  const env = environmentContent(settings.environment);

  const delivered = sync.delivered
    .filter((p) => packetStatus(p, now) === 'delivered')
    .sort((a, b) => b.deliverAt!.localeCompare(a.deliverAt!));
  const inTransit = sync.delivered.filter((p) => packetStatus(p, now) === 'inTransit');

  const notice = (
    <p className="notice">
      <span className="notice-icon" aria-hidden="true">⏱</span>
      <span>
        {i18n.t('ground.notice', { delay: env.signalDelayLabel, environment: env.label })}
      </span>
    </p>
  );

  if (crewId) {
    const member = crew.find((c) => c.id === crewId);
    const packets = delivered.filter((p) => p.crewId === crewId);
    return (
      <div className="page">
        <Link className="link-arrow" to="/ground">{i18n.t('ground.allCrew')}</Link>
        <header className="page-header">
          <span className="eyebrow">{i18n.t('ground.title')}</span>
          <h1>{member?.name ?? crewId}</h1>
          {member && <p className="muted">{member.role}</p>}
        </header>
        {notice}
        {packets.length === 0 ? (
          <section className="card empty"><p className="muted">{i18n.t('ground.noCrewPacket')}</p></section>
        ) : (
          <GroundPacketDetail packet={packets[0]} history={packets.slice(1)} />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('ground.physician')}</span>
        <h1>{i18n.t('ground.title')}</h1>
      </header>
      {notice}
      <ul className="crew-grid">
        {crew.map((member) => {
          const latest = delivered.find((p) => p.crewId === member.id);
          const coming = inTransit.filter((p) => p.crewId === member.id).length;
          const level = latest ? packetLevel(latest) : undefined;
          return (
            <li key={member.id} className="card stack crew-card level-color" data-level={level}>
              <div className="row-between">
                <div>
                  <h2 style={{ color: 'var(--text)' }}>{member.name}</h2>
                  <p className="small muted">{member.role}</p>
                </div>
                {latest && level ? (
                  <LevelBadge
                    level={level}
                    label={latest.payload.alerts.length === 0 ? i18n.t('dashboard.allExpected') : i18n.t('dashboard.alerts', { count: latest.payload.alerts.length })}
                  />
                ) : (
                  <span className="chip">{i18n.t('ground.noPacket')}</span>
                )}
              </div>
              {latest && (
                <dl className="ground-times">
                  <div><dt>{i18n.t('ground.recorded')}</dt><dd className="num">{formatDateTime(latest.payload.recordedAt)}</dd></div>
                  <div><dt>{i18n.t('ground.arrived')}</dt><dd className="num">{formatDateTime(latest.deliverAt!)}</dd></div>
                  <div><dt>{i18n.t('ground.delay')}</dt><dd className="num">{formatDuration(Date.parse(latest.deliverAt!) - Date.parse(latest.payload.recordedAt))}</dd></div>
                </dl>
              )}
              {coming > 0 && <p className="small" style={{ color: 'var(--accent)' }}>{i18n.t('ground.packetsComing', { count: coming })}</p>}
              {latest && <Link className="link-arrow" to={`/ground/${member.id}`}>{i18n.t('ground.openPacket')}</Link>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GroundPacketDetail({ packet, history }: { packet: GroundPacket; history: GroundPacket[] }) {
  const { recordGroundAccess } = useAppStore();
  const logged = useRef<string>();
  const { payload } = packet;

  // Abrir o pacote fica no registro de acesso do tripulante (uma vez por pacote).
  useEffect(() => {
    if (logged.current === packet.id) return;
    logged.current = packet.id;
    void recordGroundAccess(packet.crewId, `Abriu na Terra o pacote de ${formatDate(packet.date)}`);
  }, [packet.id, packet.crewId, packet.date, recordGroundAccess]);

  const measured = CHECKIN_ORDER.map((id) => ({ id, value: displayValue(payload.values, id, symptomLabels()) })).filter((m) => m.value);

  return (
    <>
      <section className="card stack">
        <div className="row-between">
          <div>
            <span className="eyebrow">{i18n.t('ground.packetTitle', { date: formatDate(packet.date), day: payload.missionDay })}</span>
            <h2>{i18n.t('ground.recordedAt', { date: formatDateTime(payload.recordedAt) })}</h2>
            {payload.mission && (
              <p className="small">
                {i18n.t('ground.mission', {
                  profile: i18n.t(MISSION_PROFILES[payload.mission.profile].labelKey),
                  day: payload.mission.day,
                  total: payload.mission.durationDays,
                  phase: i18n.t(payload.mission.phaseLabelKey),
                })}
              </p>
            )}
            <p className="small muted num">{i18n.t('ground.sent', { sent: formatDateTime(packet.sentAt!), arrived: formatDateTime(packet.deliverAt!), environment: environmentContent(payload.environment).label })}</p>
          </div>
          <LevelBadge level={packetLevel(packet)} />
        </div>
        <ul className="summary-list">
          {measured.map(({ id, value }) => (
            <li key={id}>
              <span>{indicatorContent(id).label}</span>
              <span className="num">
                {value!.text}{value!.unit && <span className="muted"> {value!.unit}</span>}
                {id === 'sleepHours' && sleepQualityText(payload.values) && ` · ${sleepQualityText(payload.values)}`}
                {id === 'exerciseMinutes' && payload.values.exerciseSession && ` · ${exerciseSummary(payload.values.exerciseSession)}`}
                {sourceLabel(payload.values, id) && <span className="muted"> · {sourceLabel(payload.values, id)}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>{i18n.t('ground.alerts')}</h2>
        {payload.alerts.length === 0 ? (
          <p className="muted">{i18n.t('ground.noAlerts')}</p>
        ) : (
          <ul className="summary-list">
            {payload.alerts.map((a) => (
              <li key={a.id}><span>{translateText(a.whatChanged)}</span><LevelBadge level={a.level} /></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2>{i18n.t('ground.notes')}</h2>
        {payload.notes.length === 0 ? (
          <p className="muted">{i18n.t('ground.noNotes')}</p>
        ) : (
          payload.notes.map((n) => (
            <div key={`${n.indicator}_${n.seenAt}`} className="card-inner stack" style={{ gap: 4 }}>
              <span className="small muted">{indicatorContent(n.indicator).label} · {n.seenBy}, {formatDateTime(n.seenAt)}</span>
              <p>{n.note}</p>
            </div>
          ))
        )}
      </section>

      {history.length > 0 && (
        <section className="card stack">
          <h2>{i18n.t('ground.previous')}</h2>
          <ul className="summary-list">
            {history.slice(0, 10).map((p) => (
              <li key={p.id}>
                <span className="num">{formatDate(p.date)} · chegou {formatDateTime(p.deliverAt!)}</span>
                <LevelBadge level={packetLevel(p)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
