import { useEffect, useState } from 'react';
import { ROLE_LABELS } from '../lib/access';
import { formatDateTime } from '../lib/dates';
import { PrivacyExplanation } from '../components/layout/PrivacyNotice';
import { exportCrewData, getCrewDeletionRequest, requestCrewDataDeletion } from '../data/privacyRepo';
import { useAppStore } from '../store/useAppStore';
import type { AccessLogEntry, DeletionRequest } from '../types';
import i18n from '../i18n';

export function YourDataPage() {
  // Sempre os dados de quem entrou, nunca os do tripulante que o oficial médico está vendo.
  const member = useAppStore((s) => s.crew.find((c) => c.id === s.session?.crewId));
  const [request, setRequest] = useState<DeletionRequest>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (member) void getCrewDeletionRequest(member.id).then((value) => {
      if (active) setRequest(value);
    }).catch(() => {     if (active) setError(i18n.t('yourData.readError')); });
    return () => { active = false; };
  }, [member?.id]);

  if (!member) return null;
  const crewId = member.id;

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setStatus('');
    try { await action(); }
    catch { setError(i18n.t('yourData.operationError')); }
    finally { setBusy(false); }
  }

  async function download() {
    const data = await exportCrewData(crewId);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `sentinela-${crewId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(i18n.t('yourData.exportDone'));
  }

  return (
    <div className="page privacy-page data-page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('yourData.eyebrow', { name: member.name })}</span>
        <h1>{i18n.t('yourData.title')}</h1>
        <p>{i18n.t('yourData.intro')}</p>
        <p className="small muted">{i18n.t('yourData.encryption')}</p>
      </header>
      <section className="card stack privacy-document"><PrivacyExplanation /></section>
      <section className="card stack" aria-labelledby="data-actions-title">
        <h2 id="data-actions-title">{i18n.t('yourData.actions')}</h2>
        <p>{i18n.t('yourData.copyIncludes')}</p>
        <div className="row">
          <button type="button" className="btn" disabled={busy} onClick={() => void run(download)}>{i18n.t('yourData.export')}</button>
          <button type="button" className="btn" disabled={busy || !!request} onClick={() => void run(async () => {
            await requestCrewDataDeletion(crewId);
            setRequest(await getCrewDeletionRequest(crewId));
            setStatus(i18n.t('yourData.requestDone'));
          })}>{request ? i18n.t('yourData.requestRecorded') : i18n.t('yourData.request')}</button>
        </div>
        {request && <p>{i18n.t('yourData.requestPending', { date: formatDateTime(request.createdAt, true), id: request.id })}</p>}
        <p className="small muted">{i18n.t('yourData.noDelete')}</p>
        <p role="status">{busy ? i18n.t('yourData.processing') : status}</p>
        {error && <p role="alert">{error}</p>}
      </section>
      <AccessLogSection />
    </div>
  );
}

// Quem abriu os dados do tripulante: oficial médico, comandante (só o status) e médico do solo.
function AccessLogSection() {
  const loadAccessLog = useAppStore((s) => s.loadAccessLog);
  const [entries, setEntries] = useState<AccessLogEntry[] | null>(null);

  useEffect(() => {
    void loadAccessLog().then(setEntries).catch(() => setEntries([]));
  }, [loadAccessLog]);

  return (
    <section className="card stack" aria-labelledby="access-log-title">
      <h2 id="access-log-title">{i18n.t('yourData.accessTitle')}</h2>
      <p className="small muted">{i18n.t('yourData.accessIntro')}</p>
      {!entries ? (
        <p className="muted">{i18n.t('yourData.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="muted">{i18n.t('yourData.nobody')}</p>
      ) : (
        <div className="table-wrap">
          <table className="access-table">
            <thead>
              <tr><th>{i18n.t('yourData.when')}</th><th>{i18n.t('yourData.who')}</th><th>{i18n.t('yourData.what')}</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDateTime(e.at)}</td>
                  <td>
                    {e.actorName}
                    <span className="small muted"> · {i18n.t(ROLE_LABELS[e.actorRole])}</span>
                  </td>
                  <td>{e.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
