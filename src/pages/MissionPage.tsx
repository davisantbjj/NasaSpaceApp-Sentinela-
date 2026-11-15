import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crewHealthContext } from '../content/crewContext';
import { ENVIRONMENT_ORDER, ENVIRONMENTS, INDICATORS } from '../content/indicators';
import { MISSION_PROFILE_ORDER, MISSION_PROFILES, missionStartOf, phaseOnDay } from '../content/missions';
import { addDays, diffDays, formatDate, missionDay, todayISO } from '../lib/dates';
import { hasValue } from '../lib/series';
import { weeklyGoals, type WeeklyGoal } from '../lib/weeklyGoals';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { DailyRecord, IndicatorId, MissionProfileId } from '../types';
import { trackedInOrder } from './helpers';

const REMINDER_OPTIONS = [
  { value: 0, label: 'Sem lembrete' },
  { value: 1, label: 'Todo dia' },
  { value: 2, label: 'A cada 2 dias' },
  { value: 3, label: 'A cada 3 dias' },
  { value: 4, label: 'A cada 4 dias' }, // como o teste de reação na estação (M4)
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
    if (hasValue(records[i].values, indicator)) return records[i].date;
  }
  return undefined;
}

// "5 dos últimos 7 dias na faixa · meta de 5 dias ✓ atingida" ou "1 dos últimos 7 dias na faixa · meta de 5 dias, faltam 4".
function goalText(goal: WeeklyGoal): string {
  const missing = goal.targetDays - goal.daysInGreen;
  const status = goal.met ? ' ✓ atingida' : missing === 1 ? ', falta 1' : `, faltam ${missing}`;
  return `${goal.daysInGreen} dos últimos ${goal.windowDays} dias na faixa · meta de ${goal.targetDays} dias${status}`;
}

export function MissionPage() {
  const member = useActiveCrew();
  const { crew, settings, records, session, setEnvironment, setMissionProfile, applyPhaseEnvironment, setReminder, resetDemo } = useAppStore();
  // Só o oficial médico recria a demonstração: recriar apaga também o registro de acesso de todos.
  const canReset = session?.role === 'medicalOfficer';
  const [confirmReset, setConfirmReset] = useState(false);

  if (!member) return null;
  const today = todayISO();
  // O treino resistido é digitado no passo de exercício: o lembrete de exercício vale para os dois.
  const tracked = trackedInOrder(member).filter((id) => id !== 'resistanceMinutes');
  const healthContext = crewHealthContext(member.sex);
  const day = missionDay(member.missionStart, today);
  const profile = settings.missionProfile ? MISSION_PROFILES[settings.missionProfile] : undefined;
  const missionStart = missionStartOf(crew) ?? member.missionStart;
  const crewDay = missionDay(missionStart, today);
  const phase = profile ? phaseOnDay(profile, crewDay) : undefined;
  const offPhase = !!phase && settings.environment !== phase.environment;
  const goals = weeklyGoals(records, today, rules).filter((g) => member.trackedIndicators.includes(g.indicator));

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Missão e rotina</span>
        <h1>Missão de {member.name.split(' ')[0]}</h1>
      </header>

      <section className="card stat-row">
        <div className="metric">
          <span className="small muted">Dia da missão</span>
          <span className="metric-value">{day}{profile && <span className="unit">de {profile.durationDays}</span>}</span>
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

      {goals.length > 0 && (
        <section className="card stack">
          <div>
            <h2>Metas da semana</h2>
            <p className="small muted">Em quantos dos últimos {goals[0].windowDays} dias, contando hoje, cada indicador ficou na faixa verde. A meta é de {goals[0].targetDays} dias, para deixar folga para dias fora da rotina. Meta de demonstração, não é prescrição: o plano de cada tripulante vem da equipe médica.</p>
          </div>
          <ul className="summary-list">
            {goals.map((goal) => (
              <li key={goal.indicator}>
                <span>{goal.label} ({goal.greenText})</span>
                <span className="num">
                  {goalText(goal)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <h2>Perfil da missão</h2>
          <p className="small muted">O Sentinela serve para qualquer nave. O perfil diz o tipo de missão, a duração e as fases; a fase de hoje define o ambiente.</p>
        </div>
        <select
          className="select"
          aria-label="Perfil da missão"
          value={settings.missionProfile ?? ''}
          onChange={(event) => void setMissionProfile((event.target.value || undefined) as MissionProfileId | undefined)}
        >
          <option value="">Sem perfil (ambiente escolhido à mão)</option>
          {MISSION_PROFILE_ORDER.map((id) => (
            <option key={id} value={id}>{MISSION_PROFILES[id].label} ({MISSION_PROFILES[id].example})</option>
          ))}
        </select>
        {profile && phase && (
          <>
            <ul className="summary-list">
              <li><span>Veículo</span><span>{profile.vehicle}</span></li>
              <li><span>Tripulação</span><span>{profile.crewSize}</span></li>
              <li><span>Duração prevista</span><span className="num">{profile.durationDays} dias</span></li>
              {profile.phases.map((p) => (
                <li key={p.label}>
                  <span>{p === phase ? <strong>Fase atual: {p.label}</strong> : `Fase: ${p.label}`}</span>
                  <span className="num">dias {p.fromDay} a {p.toDay} · {ENVIRONMENTS[p.environment].label}</span>
                </li>
              ))}
            </ul>
            <p className="small muted">
              {profile.note}{' '}
              {crewDay > profile.durationDays && `Hoje é o dia ${crewDay}, depois do fim previsto (${profile.durationDays} dias): vale a última fase. `}
              <a href={profile.sourceUrl} target="_blank" rel="noreferrer">Fonte (abre outro site)</a>
            </p>
          </>
        )}
      </section>

      <section className="card stack" style={{ gap: 14 }}>
        <div>
          <h2>Ambiente da missão</h2>
          <p className="small muted">O ambiente muda a explicação dos alertas, nunca o nível. As faixas são as mesmas em todos.</p>
        </div>
        {offPhase && (
          <p className="notice">
            <span className="notice-icon" aria-hidden="true">!</span>
            <span>
              Ambiente trocado à mão. Pela fase da missão, hoje seria {ENVIRONMENTS[phase!.environment].label}.{' '}
              <button type="button" className="btn btn-ghost" onClick={() => void applyPhaseEnvironment()}>Usar o ambiente da fase</button>
            </span>
          </p>
        )}
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
            Os três tripulantes e os 60 dias de registros são simulados. Recriar a demonstração apaga os check-ins, mensagens, pedidos de exclusão e o registro de acesso de todos os perfis neste navegador, e cria chaves novas. O aviso de privacidade permanece registrado.
          </p>
          {!canReset && <p className="small muted">Só o oficial médico de bordo pode recriar a demonstração.</p>}
        </div>
        {canReset && <div className="row">
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
        </div>}
      </section>
    </div>
  );
}
