import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore, type CrewStatusRow } from '../store/useAppStore';
import i18n from '../i18n';

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
        <span className="eyebrow">{i18n.t('crewStatus.commander')}</span>
        <h1>{i18n.t('crewStatus.title')}</h1>
        <p className="muted">{i18n.t('crewStatus.intro')}</p>
        <div className="row">
          <button type="button" className="btn" onClick={() => void load()}>{i18n.t('buttons.update')}</button>
        </div>
      </header>

      {error && <p className="notice" role="alert">{error}</p>}
      {!rows && !error && <div className="loading" style={{ minHeight: 200 }}>{i18n.t('crewOverview.loading')}</div>}
      {rows && rows.length === 0 && (
        <div className="card empty"><p className="muted">{i18n.t('crewStatus.empty')}</p></div>
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
                  {row.checkinToday ? i18n.t('crewStatus.checkinDone') : i18n.t('crewStatus.pending')}
                </span>
                <span className="chip" style={row.hasRed ? { color: 'var(--level-red)' } : undefined}>
                  {row.hasRed ? i18n.t('crewStatus.hasRed') : i18n.t('crewStatus.noRed')}
                </span>
              </div>
              {row.hasRed && <p className="small">{i18n.t('crewStatus.callMedical')}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">{i18n.t('crewStatus.accessLog')}</p>
    </div>
  );
}
