import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crewHealthContext } from '../content/crewContext';
import { ENVIRONMENT_ORDER, ENVIRONMENTS, INDICATORS } from '../content/indicators';
import { addDays, diffDays, formatDate, missionDay, todayISO } from '../lib/dates';
import { seriesPoints } from '../lib/series';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { DailyRecord, IndicatorId } from '../types';
import { trackedInOrder } from './helpers';

const REMINDER_OPTIONS = [
  { value: 0, label: 'Sem lembrete' },
  { value: 1, label: 'Todo dia' },
  { value: 2, label: 'A cada 2 dias' },
  { value: 3, label: 'A cada 3 dias' },
  { value: 7, label: 'Uma vez por semana' },
];

// Dias seguidos com check-in, terminando hoje ou ontem.
function streak(records: DailyRecord[], today: string): number {
  const dates = new Set(records.map((r) => r.date));
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

function lastMeasured(records: DailyRecord[], indicator: IndicatorId): string | undefined {
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const values = records[i].values;
    const has = indicator === 'symptoms' ? values.symptoms !== undefined : seriesPoints(values, indicator).length > 0;
    if (has) return records[i].date;
  }
  return undefined;
}

export function MissionPage() {
  const member = useActiveCrew();
  const { settings, records, setEnvironment, setReminder, resetDemo } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!member) return null;
  const today = todayISO();
  const tracked = trackedInOrder(member);
  const healthContext = crewHealthContext(member.sex);

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Missão e rotina</span>
        <h1>Missão de {member.name.split(' ')[0]}</h1>
      </header>

      <section className="card stat-row">
        <div className="metric">
          <span className="small muted">Dia da missão</span>
          <span className="metric-value">{missionDay(member.missionStart, today)}</span>
        </div>
        <div className="metric">
          <span className="small muted">Início</span>
          <span className="metric-value">{formatDate(member.missionStart)}</span>
        </div>
        <div className="metric">
          <span className="small muted">Check-ins seguidos</span>
          <span className="metric-value">{streak(records, today)}<span className="unit">dias</span></span>
        </div>
        <div className="metric">
          <span className="small muted">Registros</span>
          <span className="metric-value">{records.length}</span>
        </div>
      </section>

      <section className="card stack">
        <h2>Contexto de readaptação à gravidade</h2>
        <p>{healthContext.text}</p>
        <a href={healthContext.sourceUrl} target="_blank" rel="noreferrer">Fonte: NASA — intolerância ortostática (abre outro site)</a>
      </section>

      <section className="card stack">
        <h2>Privacidade e comunicação</h2>
        <p>Consulte os dados deste perfil ou escreva uma mensagem para mostrar à equipe de bordo.</p>
        <div className="row"><Link className="btn" to="/your-data">Seus dados</Link><Link className="btn" to="/medical-contact">Escrever ao oficial médico</Link></div>
      </section>

      <section className="card stack" style={{ gap: 14 }}>
        <div>
          <h2>Ambiente da missão</h2>
          <p className="small muted">O ambiente muda a explicação dos alertas, nunca o nível. As faixas são as mesmas em todos.</p>
        </div>
        <fieldset className="env-grid options">
          <legend className="visually-hidden">Ambiente da missão</legend>
          {ENVIRONMENT_ORDER.map((env) => (
            <label key={env} className="option">
              <input type="radio" name="environment" checked={settings.environment === env} onChange={() => setEnvironment(env)} />
              <span className="option-face">
                {ENVIRONMENTS[env].label}
                <span>{ENVIRONMENTS[env].description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="card stack" style={{ gap: 14 }}>
        <div>
          <h2>Lembretes de medida</h2>
          <p className="small muted">Para indicadores que não precisam ser medidos todo dia.</p>
        </div>
        <div className="table-wrap">
          <table className="reminders-table">
            <thead>
              <tr><th>Indicador</th><th>Última medida</th><th>Lembrete</th></tr>
            </thead>
            <tbody>
              {tracked.map((indicator) => {
                const reminder = settings.reminders.find((r) => r.indicator === indicator);
                const last = lastMeasured(records, indicator);
                const due = reminder && (!last || diffDays(last, today) >= reminder.everyDays);
                return (
                  <tr key={indicator}>
                    <td style={{ fontVariantNumeric: 'normal' }}>{INDICATORS[indicator].label}</td>
                    <td>
                      {last ? formatDate(last) : 'Nunca'}
                      {due && <span className="chip" style={{ marginLeft: 8, color: 'var(--level-yellow)' }}>! Medir hoje</span>}
                    </td>
                    <td>
                      <select
                        className="select"
                        aria-label={`Lembrete de ${INDICATORS[indicator].label}`}
                        value={reminder?.everyDays ?? 0}
                        onChange={(event) => setReminder(indicator, Number(event.target.value))}
                      >
                        {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack">
        <div>
          <h2>Dados da demonstração</h2>
          <p className="small muted">
            Os três tripulantes e os 60 dias de registros são simulados. Recriar a demonstração apaga os check-ins, mensagens e pedidos de exclusão de todos os perfis neste navegador. O aviso de privacidade permanece registrado.
          </p>
        </div>
        <div className="row">
          {confirmReset ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => { setConfirmReset(false); void resetDemo(); }}>
                Sim, apagar e recriar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancelar</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setConfirmReset(true)}>Recriar dados de demonstração</button>
          )}
        </div>
      </section>
    </div>
  );
}
