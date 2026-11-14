import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { displayValue } from '../content/format';
import { CHECKIN_ORDER, ENVIRONMENTS, INDICATORS } from '../content/indicators';
import { useNow } from '../hooks/useNow';
import { formatDate, formatDateTime, formatDuration } from '../lib/dates';
import { worstLevel } from '../lib/levels';
import { useAppStore } from '../store/useAppStore';
import { packetStatus } from '../sync/packets';
import type { GroundPacket } from '../types';
import { SYMPTOM_LABELS } from './helpers';

function packetLevel(packet: GroundPacket) {
  return worstLevel(...packet.payload.alerts.map((a) => a.level));
}

// O médico do solo só vê o que chegou à Terra, sempre com a hora do dado e a hora de chegada.
export function GroundPage() {
  const { crewId } = useParams();
  const { crew, sync, settings } = useAppStore();
  const now = useNow(1000);
  const env = ENVIRONMENTS[settings.environment];

  const delivered = sync.delivered
    .filter((p) => packetStatus(p, now) === 'delivered')
    .sort((a, b) => b.deliverAt!.localeCompare(a.deliverAt!));
  const inTransit = sync.delivered.filter((p) => packetStatus(p, now) === 'inTransit');

  const notice = (
    <p className="notice">
      <span className="notice-icon" aria-hidden="true">⏱</span>
      <span>
        Os dados chegam em pacotes, quando há janela de comunicação, com atraso de ida de {env.signalDelayLabel} ({env.label}).
        O que está aqui pode já ter mudado a bordo. A decisão imediata é sempre de bordo.
      </span>
    </p>
  );

  if (crewId) {
    const member = crew.find((c) => c.id === crewId);
    const packets = delivered.filter((p) => p.crewId === crewId);
    return (
      <div className="page">
        <Link className="link-arrow" to="/ground">← Toda a tripulação</Link>
        <header className="page-header">
          <span className="eyebrow">Visão do solo</span>
          <h1>{member?.name ?? crewId}</h1>
          {member && <p className="muted">{member.role}</p>}
        </header>
        {notice}
        {packets.length === 0 ? (
          <section className="card empty"><p className="muted">Nenhum pacote deste tripulante chegou ainda.</p></section>
        ) : (
          <GroundPacketDetail packet={packets[0]} history={packets.slice(1)} />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Médico do solo</span>
        <h1>Visão do solo</h1>
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
                    label={latest.payload.alerts.length === 0 ? 'Tudo dentro do esperado' : `${latest.payload.alerts.length} ${latest.payload.alerts.length === 1 ? 'alerta' : 'alertas'}`}
                  />
                ) : (
                  <span className="chip">Sem pacote</span>
                )}
              </div>
              {latest && (
                <dl className="ground-times">
                  <div><dt>Dado de</dt><dd className="num">{formatDateTime(latest.payload.recordedAt)}</dd></div>
                  <div><dt>Chegou</dt><dd className="num">{formatDateTime(latest.deliverAt!)}</dd></div>
                  <div><dt>Atraso</dt><dd className="num">{formatDuration(Date.parse(latest.deliverAt!) - Date.parse(latest.payload.recordedAt))}</dd></div>
                </dl>
              )}
              {coming > 0 && <p className="small" style={{ color: 'var(--accent)' }}>{coming} {coming === 1 ? 'pacote a caminho' : 'pacotes a caminho'}</p>}
              {latest && <Link className="link-arrow" to={`/ground/${member.id}`}>Abrir pacote →</Link>}
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

  const measured = CHECKIN_ORDER.map((id) => ({ id, value: displayValue(payload.values, id, SYMPTOM_LABELS) })).filter((m) => m.value);

  return (
    <>
      <section className="card stack">
        <div className="row-between">
          <div>
            <span className="eyebrow">Pacote de {formatDate(packet.date)} · dia {payload.missionDay} da missão</span>
            <h2>Registro feito em {formatDateTime(payload.recordedAt)}</h2>
            <p className="small muted num">Saiu da nave {formatDateTime(packet.sentAt!)} · chegou {formatDateTime(packet.deliverAt!)} · ambiente: {ENVIRONMENTS[payload.environment].label}</p>
          </div>
          <LevelBadge level={packetLevel(packet)} />
        </div>
        <ul className="summary-list">
          {measured.map(({ id, value }) => (
            <li key={id}>
              <span>{INDICATORS[id].label}</span>
              <span className="num">{value!.text}{value!.unit && <span className="muted"> {value!.unit}</span>}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>Alertas</h2>
        {payload.alerts.length === 0 ? (
          <p className="muted">Nenhum alerta neste registro.</p>
        ) : (
          <ul className="summary-list">
            {payload.alerts.map((a) => (
              <li key={a.id}><span>{a.whatChanged}</span><LevelBadge level={a.level} /></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2>Anotações do oficial médico</h2>
        {payload.notes.length === 0 ? (
          <p className="muted">Nenhuma anotação neste pacote.</p>
        ) : (
          payload.notes.map((n) => (
            <div key={`${n.indicator}_${n.seenAt}`} className="card-inner stack" style={{ gap: 4 }}>
              <span className="small muted">{INDICATORS[n.indicator].label} · {n.seenBy}, {formatDateTime(n.seenAt)}</span>
              <p>{n.note}</p>
            </div>
          ))
        )}
      </section>

      {history.length > 0 && (
        <section className="card stack">
          <h2>Pacotes anteriores</h2>
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
