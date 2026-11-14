import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore, type CrewStatusRow } from '../store/useAppStore';

// Tela do comandante: só mostra se cada colega fez o check-in de hoje e se há alerta vermelho.
// Nada de valores, alertas amarelos, textos de alerta ou tendências.
export function CrewStatusPage() {
  const { loadCrewStatus } = useAppStore();
  const [rows, setRows] = useState<CrewStatusRow[] | null>(null);
  const [error, setError] = useState<string>();
  const loaded = useRef(false);

  const load = useCallback(async () => {
    try {
      setRows(await loadCrewStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [loadCrewStatus]);

  // Uma carga por visita (o modo estrito do React roda o efeito duas vezes em desenvolvimento).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void load();
  }, [load]);

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Comandante</span>
        <h1>Tripulação</h1>
        <p className="muted">
          Aqui você vê só se cada colega já fez o check-in de hoje e se há alerta vermelho. O comandante não vê dados de saúde.
          Havendo alerta vermelho, chame o oficial médico de bordo.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={() => void load()}>Atualizar</button>
        </div>
      </header>

      {error && <p className="notice" role="alert">{error}</p>}
      {!rows && !error && <div className="loading" style={{ minHeight: 200 }}>Carregando a tripulação…</div>}
      {rows && rows.length === 0 && (
        <div className="card empty"><p className="muted">Nenhum outro tripulante para mostrar.</p></div>
      )}

      {rows && rows.length > 0 && (
        <ul className="crew-grid">
          {rows.map((row) => (
            <li key={row.id} className="card stack crew-card">
              <div>
                <h2 style={{ color: 'var(--text)' }}>{row.name}</h2>
                <p className="small muted">{row.role}</p>
              </div>
              <div className="hero-meta" style={{ marginTop: 0 }}>
                <span className="chip" style={row.checkinToday ? undefined : { color: 'var(--level-yellow)' }}>
                  {row.checkinToday ? '✓ Check-in feito' : '! Pendente'}
                </span>
                <span className="chip" style={row.hasRed ? { color: 'var(--level-red)' } : undefined}>
                  {row.hasRed ? '▲ Há alerta vermelho' : 'Sem alerta vermelho'}
                </span>
              </div>
              {row.hasRed && <p className="small">Chame o oficial médico de bordo.</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">Só conta o que já chegou à central de bordo. Esta consulta fica no registro de acesso de cada colega.</p>
    </div>
  );
}
