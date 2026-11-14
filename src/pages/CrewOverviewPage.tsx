import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { formatDate, todayISO } from '../lib/dates';
import { useAppStore, type CrewOverview } from '../store/useAppStore';

// Grade do oficial médico: todos os tripulantes num lugar só.
// Os dados dos outros só aparecem depois que chegam à central de bordo.
export function CrewOverviewPage() {
  const { loadCrewOverview, switchCrew, session } = useAppStore();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CrewOverview[] | null>(null);
  const [error, setError] = useState<string>();
  const loaded = useRef(false);

  const load = useCallback(async () => {
    try {
      setRows(await loadCrewOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [loadCrewOverview]);

  // Uma carga por visita (o modo estrito do React roda o efeito duas vezes em desenvolvimento).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void load();
  }, [load]);

  const open = async (crewId: string) => {
    await switchCrew(crewId);
    navigate('/');
  };

  const today = todayISO();

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Oficial médico de bordo</span>
        <h1>Tripulação</h1>
        <p className="muted">
          Nível geral, check-in de hoje e alertas ainda não vistos de cada tripulante. Abrir os dados de alguém fica no registro de acesso da pessoa.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={() => void load()}>Atualizar</button>
        </div>
      </header>

      {error && <p className="notice" role="alert">{error}</p>}
      {!rows && !error && <div className="loading" style={{ minHeight: 200 }}>Carregando a tripulação…</div>}

      {rows && (
        <ul className="crew-grid">
          {rows.map(({ member, level, alerts, lastDate, checkinToday, openAlerts }) => {
            const red = alerts.filter((a) => a.level === 'red').length;
            const own = member.id === session?.crewId;
            return (
              <li key={member.id} className="card stack crew-card level-color" data-level={level}>
                <div className="row-between">
                  <div>
                    <h2 style={{ color: 'var(--text)' }}>{member.name}{own && <span className="small muted"> (você)</span>}</h2>
                    <p className="small muted">{member.role}</p>
                  </div>
                  <LevelBadge
                    level={level}
                    label={alerts.length === 0 ? 'Tudo dentro do esperado' : `${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'}`}
                  />
                </div>
                <div className="hero-meta" style={{ marginTop: 0 }}>
                  <span className="chip" style={checkinToday ? undefined : { color: 'var(--level-yellow)' }}>
                    {checkinToday ? '✓ Check-in de hoje feito' : '! Check-in de hoje pendente'}
                  </span>
                  {lastDate && lastDate !== today && <span className="chip num">Último registro: {formatDate(lastDate)}</span>}
                  {red > 0 && <span className="chip" style={{ color: 'var(--level-red)' }}>▲ {red} de atenção imediata</span>}
                  {openAlerts > 0 && <span className="chip num">{openAlerts} não {openAlerts === 1 ? 'visto' : 'vistos'}</span>}
                </div>
                <div className="row">
                  <button type="button" className="btn" onClick={() => void open(member.id)}>Abrir painel</button>
                  {alerts.length > 0 && (
                    <button type="button" className="btn btn-ghost" onClick={() => void switchCrew(member.id).then(() => navigate('/alerts'))}>
                      Ver alertas
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
