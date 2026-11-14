import { useEffect, useState } from 'react';
import { ROLE_LABELS } from '../lib/access';
import { formatDateTime } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';
import type { AccessLogEntry } from '../types';

// "Seus dados": por enquanto, só o registro de quem abriu os dados do tripulante.
export function PrivacyPage() {
  const { loadAccessLog, session } = useAppStore();
  const [entries, setEntries] = useState<AccessLogEntry[] | null>(null);

  useEffect(() => {
    void loadAccessLog().then(setEntries);
  }, [loadAccessLog]);

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Privacidade</span>
        <h1>Seus dados</h1>
        <p className="muted">
          Seus dados de saúde ficam cifrados neste aparelho e só abrem com um PIN. Pelo app, só o oficial médico de bordo
          vê os seus valores e alertas; a equipe médica na Terra vê os pacotes diários; o comandante vê só se você fez o
          check-in e se há alerta vermelho. Cada consulta dessas fica registrada aqui.
        </p>
        <p className="small muted">
          Limite do protótipo: todos os perfis deste aparelho usam a mesma chave de dados, então a separação entre papéis é
          feita pelo app, não pela criptografia. Num produto real cada tripulante teria a própria chave.
        </p>
      </header>

      <section className="card stack">
        <h2>Quem abriu os seus dados</h2>
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
        {session && <p className="small muted">Você entrou como {session.name}.</p>}
      </section>
    </div>
  );
}
