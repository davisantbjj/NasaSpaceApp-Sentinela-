import { useEffect, useState } from 'react';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { environmentContent } from '../content/indicators';
import { useNow } from '../hooks/useNow';
import { formatDate, formatDateTime, formatDuration } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';
import { earthLinkStatus } from '../sync/central';
import { packetStatus, transmitOrder } from '../sync/packets';
import type { PacketMeta } from '../data/packetsRepo';
import i18n from '../i18n';

const MAX_PACKETS = 15;

// Conexão real do navegador: é por ela que os pacotes vão para a Terra.
function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function Status({ ok, okText, waitText }: { ok: boolean; okText: string; waitText: string }) {
  return (
    <p role="status">
      <strong style={{ color: ok ? 'var(--level-green)' : 'var(--level-yellow)' }}>{ok ? `✓ ${okText}` : `! ${waitText}`}</strong>
    </p>
  );
}

// Fila do aparelho → central de bordo → Terra. Tudo automático: ninguém liga ou desliga nada.
export function SyncPage() {
  const { session, crew, settings, sync, deliverNow } = useAppStore();
  const now = useNow(1000);
  const online = useOnline();
  const earth = earthLinkStatus(); // relido a cada segundo junto com `now`
  const name = (crewId: string) => crew.find((c) => c.id === crewId)?.name ?? crewId;
  const env = environmentContent(settings.environment);
  // Só quem cuida da tripulação vê a fila de todos; tripulante e comandante veem só a própria.
  const seesAll = session?.role === 'medicalOfficer';

  const queued = transmitOrder(sync.packets);
  const others = sync.packets
    .filter((p) => p.sentAt)
    .sort((a, b) => b.sentAt!.localeCompare(a.sentAt!));
  const packets: PacketMeta[] = [...queued, ...others].slice(0, MAX_PACKETS);
  const inTransit = sync.packets.some((p) => packetStatus(p, now) === 'inTransit');

  return (
    <div className="page sync-page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('sync.communication')}</span>
        <h1>{i18n.t('sync.title')}</h1>
        <p className="muted">{i18n.t('sync.intro')}</p>
        {sync.lastRunAt && <p className="small muted num">{i18n.t('sync.lastSync', { date: formatDateTime(sync.lastRunAt, true) })}</p>}
        {sync.lastError && (
          <p className="notice" role="alert">
            <span className="notice-icon" aria-hidden="true">!</span>
            <span>{i18n.t('sync.failed', { error: sync.lastError })}</span>
          </p>
        )}
      </header>

      <div className="grid-2">
        <section className="card stack">
          <div>
            <h2>{i18n.t('sync.hub')}</h2>
            <p className="small muted">{i18n.t('sync.hubIntro')}</p>
          </div>
          <Status ok={sync.outbox.length === 0} okText={i18n.t('sync.arrived')} waitText={i18n.t('sync.sending')} />
          {sync.outbox.length > 0 && (
            <ul className="summary-list">
              {sync.outbox.map((item) => (
                <li key={`${item.kind}_${item.id}`}>
                  <span>
                    {i18n.t(item.kind === 'record' ? 'sync.checkin' : 'sync.medicalNote')}
                    {seesAll && ` · ${name(item.crewId)}`}
                    <span className="muted num"> · {formatDate(item.date, true)}</span>
                  </span>
                  <span className="chip">{i18n.t('sync.queued')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack">
          <div>
            <h2>{i18n.t('sync.earth')}</h2>
            <p className="small muted">{i18n.t('sync.delay', { environment: env.label, delay: env.signalDelayLabel })}</p>
          </div>
          {!online ? (
            <Status ok={false} okText="" waitText={i18n.t('sync.offline')} />
          ) : earth.mode === 'simulated' ? (
            <p role="status">
              <strong style={{ color: 'var(--accent)' }}>◎ {i18n.t('sync.simulated')}</strong>
              <span className="small muted">{i18n.t('sync.noServer')}</span>
            </p>
          ) : earth.reachable === undefined ? (
            <p role="status" className="muted">{i18n.t('sync.checking')}</p>
          ) : (
            <Status
              ok={earth.reachable}
              okText={i18n.t('sync.connected')}
              waitText={i18n.t('sync.unreachable')}
            />
          )}
          <p className="small muted">
            {i18n.t('sync.destination', { name: earth.name })}
            {earth.checkedAt && earth.mode === 'server' && i18n.t('sync.checked', { date: formatDateTime(earth.checkedAt, true) })}
            {earth.lastError && online && earth.mode === 'server' && earth.reachable === false && earth.lastErrorAt &&
              i18n.t('sync.lastError', { date: formatDateTime(earth.lastErrorAt, true), error: earth.lastError })}
          </p>
          {inTransit && (
            <div className="row">
              <button type="button" className="btn" onClick={() => void deliverNow()}>{i18n.t('sync.deliverNow')}</button>
            </div>
          )}
        </section>
      </div>

      <section className="card stack">
        <div>
          <h2>{i18n.t(seesAll ? 'sync.packets' : 'sync.yourPackets')}</h2>
          <p className="small muted">{i18n.t('sync.recentPackets')}</p>
        </div>
        {packets.length === 0 ? (
          <p className="muted">{i18n.t('sync.noPackets')}</p>
        ) : (
          <div className="table-wrap">
            <table className="packets-table">
              <thead>
                <tr><th>{i18n.t('sync.crewMember')}</th><th>{i18n.t('sync.day')}</th><th>{i18n.t('sync.priority')}</th><th>{i18n.t('sync.situation')}</th></tr>
              </thead>
              <tbody>
                {packets.map((p) => {
                  const status = packetStatus(p, now);
                  return (
                    <tr key={p.id}>
                      <td>{name(p.crewId)}</td>
                      <td>{formatDate(p.date, true)}</td>
                      <td>{p.priority === 'red' ? <LevelBadge level="red" label={i18n.t('sync.redPriority')} /> : <span className="muted">{i18n.t('sync.normal')}</span>}</td>
                      <td>
                        {status === 'queued' && <span className="chip">{i18n.t('sync.hubQueue')}</span>}
                        {status === 'inTransit' && (
                          <span className="chip" style={{ color: 'var(--accent)' }}>
                            {i18n.t('sync.inTransit', { duration: formatDuration(Date.parse(p.deliverAt!) - now) })}
                          </span>
                        )}
                        {status === 'delivered' && <span className="muted">{i18n.t('sync.arrivedAt', { date: formatDateTime(p.deliverAt!) })}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
