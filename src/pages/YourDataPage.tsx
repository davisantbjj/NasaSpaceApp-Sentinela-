import { useEffect, useState } from 'react';
import { ROLE_LABELS } from '../lib/access';
import { formatDateTime } from '../lib/dates';
import { PrivacyExplanation } from '../components/layout/PrivacyNotice';
import { exportCrewData, getCrewDeletionRequest, requestCrewDataDeletion } from '../data/privacyRepo';
import { useAppStore } from '../store/useAppStore';
import type { AccessLogEntry, DeletionRequest } from '../types';

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
    }).catch(() => { if (active) setError('Não foi possível ler o pedido de exclusão.'); });
    return () => { active = false; };
  }, [member?.id]);

  if (!member) return null;
  const crewId = member.id;

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setStatus('');
    try { await action(); }
    catch { setError('Não foi possível concluir a operação no armazenamento local. Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function download() {
    const data = await exportCrewData(crewId);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `sentinela-${crewId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Arquivo JSON preparado para download. Ele contém somente os dados deste perfil.');
  }

  return (
    <div className="page privacy-page">
      <header className="page-header">
        <span className="eyebrow">Privacidade · {member.name}</span>
        <h1>Seus dados</h1>
        <p>As ações abaixo valem só para os seus dados, do perfil com que você entrou.</p>
        <p className="small muted">
          Seus dados ficam cifrados com uma chave só sua, que abre com o seu PIN e com o do oficial médico. O PIN de um
          colega não abre os seus dados. Limite do protótipo: o PIN curto pode ser descoberto por quem copiar o banco.
        </p>
      </header>
      <section className="card stack"><PrivacyExplanation /></section>
      <section className="card stack" aria-labelledby="data-actions-title">
        <h2 id="data-actions-title">Cópia e pedido de exclusão</h2>
        <p>A cópia inclui o perfil, os check-ins, as anotações do oficial médico, as mensagens, o registro de acesso e o pedido de exclusão. Não inclui dados de outros tripulantes. É uma cópia para consulta, sem importação nem portabilidade regulamentada.</p>
        <div className="row">
          <button type="button" className="btn" disabled={busy} onClick={() => void run(download)}>Exportar meus dados em JSON</button>
          <button type="button" className="btn" disabled={busy || !!request} onClick={() => void run(async () => {
            await requestCrewDataDeletion(crewId);
            setRequest(await getCrewDeletionRequest(crewId));
            setStatus('Pedido registrado. Nada foi apagado: o histórico de saúde é da missão, e o pedido fica para a equipe avaliar.');
          })}>{request ? 'Pedido registrado localmente' : 'Registrar pedido de exclusão'}</button>
        </div>
        {request && <p>Pedido de {new Date(request.createdAt).toLocaleString('pt-BR')} — pendente. Protocolo local: {request.id}.</p>}
        <p className="small muted">
          O tripulante não apaga o próprio histórico de saúde: ele é registro da missão. O pedido de exclusão fica
          registrado para a equipe avaliar, como prevê a LGPD (art. 18), sem apagar nada na hora.
        </p>
        <p role="status">{busy ? 'Processando…' : status}</p>
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
      <h2 id="access-log-title">Quem abriu os seus dados</h2>
      <p className="small muted">
        Pelo app, o oficial médico de bordo vê os seus valores e alertas, a equipe médica na Terra vê os pacotes diários e o
        comandante vê só se você fez o check-in e se há alerta vermelho. Cada consulta fica registrada aqui.
      </p>
      {!entries ? (
        <p className="muted">Carregando…</p>
      ) : entries.length === 0 ? (
        <p className="muted">Ninguém além de você abriu os seus dados.</p>
      ) : (
        <div className="table-wrap">
          <table className="access-table">
            <thead>
              <tr><th>Quando</th><th>Quem</th><th>O quê</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDateTime(e.at)}</td>
                  <td>
                    {e.actorName}
                    <span className="small muted"> · {ROLE_LABELS[e.actorRole]}</span>
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
