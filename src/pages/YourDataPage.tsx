import { useEffect, useState } from 'react';
import { PrivacyExplanation } from '../components/layout/PrivacyNotice';
import { exportCrewData, getCrewDeletionRequest, requestCrewDataDeletion } from '../data/privacyRepo';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { DeletionRequest } from '../types';

export function YourDataPage() {
  const member = useActiveCrew();
  const deleteData = useAppStore((s) => s.deleteActiveHealthData);
  const [request, setRequest] = useState<DeletionRequest>();
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        <p>As ações abaixo se aplicam ao perfil fictício selecionado. A troca de perfil não comprova identidade.</p>
      </header>
      <section className="card stack"><PrivacyExplanation /></section>
      <section className="card stack" aria-labelledby="data-actions-title">
        <h2 id="data-actions-title">Acesso e exclusão local</h2>
        <p>A cópia inclui o perfil, os check-ins, as mensagens locais e o pedido de exclusão. Não inclui dados de outros tripulantes. É uma cópia para consulta, sem importação nem portabilidade regulamentada.</p>
        <div className="row">
          <button type="button" className="btn" disabled={busy} onClick={() => void run(download)}>Exportar meus dados em JSON</button>
          <button type="button" className="btn" disabled={busy || !!request} onClick={() => void run(async () => {
            await requestCrewDataDeletion(crewId);
            setRequest(await getCrewDeletionRequest(crewId));
            setStatus('Pedido registrado somente neste navegador. Não foi enviado nem executado. Você pode excluir o histórico abaixo.');
          })}>{request ? 'Pedido registrado localmente' : 'Registrar pedido de exclusão'}</button>
        </div>
        {request && <p>Pedido de {new Date(request.createdAt).toLocaleString('pt-BR')} — pendente, sem envio. Protocolo local: {request.id}.</p>}
        <p>Excluir agora apaga os check-ins, mensagens e pedido de exclusão deste perfil neste navegador. O perfil fictício, as preferências gerais e os outros tripulantes permanecem. O histórico não reaparece ao recarregar; “Recriar demonstração” gera novamente dados simulados.</p>
        {!confirmDelete ? (
          <button className="btn btn-danger" type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir meu histórico local…</button>
        ) : (
          <div className="stack">
            <p>Confirma a exclusão do histórico de <strong>{member.name}</strong>? Esta ação não pode ser desfeita. Exporte antes se quiser guardar uma cópia.</p>
            <div className="row">
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void run(async () => {
                await deleteData(); setRequest(undefined); setConfirmDelete(false);
                setStatus('Histórico local excluído. Cópias JSON já baixadas precisam ser apagadas separadamente.');
              })}>Sim, excluir o histórico deste perfil</button>
              <button type="button" className="btn" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancelar</button>
            </div>
          </div>
        )}
        <p role="status">{busy ? 'Processando…' : status}</p>
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
