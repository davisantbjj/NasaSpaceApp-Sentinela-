import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { BodyMap } from '../components/body/BodyMap';
import { RegionPanel, type RegionItem } from '../components/body/RegionPanel';
import { displayValue } from '../content/format';
import { ENVIRONMENTS, REGION_ORDER, REGIONS } from '../content/indicators';
import { formatDate, missionDay, todayISO } from '../lib/dates';
import { compareLevels, worstLevel } from '../lib/levels';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore, useViewingOther } from '../store/useAppStore';
import type { BodyRegion } from '../types';
import { baselineNote, latestRecord, SYMPTOM_LABELS, trackedInOrder } from './helpers';

export function DashboardPage() {
  const member = useActiveCrew();
  const viewingOther = useViewingOther();
  const { records, alerts, baselines, correlations, regionLevels, settings } = useAppStore();
  const [selected, setSelected] = useState<BodyRegion | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelected(null), [member?.id]);

  // Em telas de até 1100 px o detalhe fica abaixo da figura: ao escolher uma região, leva a tela até ele.
  const choose = (r: BodyRegion) => {
    setSelected(r);
    if (window.matchMedia('(max-width: 1100px)').matches) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panelRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    }
  };

  if (!member) return null;

  const latest = latestRecord(records);
  const today = todayISO();
  const checkinDone = latest?.date === today;
  const overall = worstLevel(...Object.values(regionLevels));
  // Sem seleção, abre a região mais grave.
  const worstRegion = [...REGION_ORDER].sort((a, b) => compareLevels(regionLevels[b], regionLevels[a]))[0];
  const region = selected ?? worstRegion;

  const items: RegionItem[] = trackedInOrder(member)
    .filter((id) => rules.indicators[id]?.region === region)
    .map((indicator) => {
      const value = latest ? displayValue(latest.values, indicator, SYMPTOM_LABELS) : undefined;
      const alert = alerts.find((a) => a.indicator === indicator);
      return {
        indicator,
        value,
        level: alert?.level ?? (value ? 'green' : undefined),
        baselineNote: baselineNote(indicator, baselines),
      };
    });

  const togetherNotes = correlations
    .filter((c) => c.indicators.some((id) => rules.indicators[id]?.region === region))
    .map((c) => c.description);

  return (
    <div className="page">
      <section className="card hero">
        <div>
          <span className="eyebrow">Painel do tripulante</span>
          <h1>{member.name}</h1>
          <div className="hero-meta">
            <span className="chip">{member.role}</span>
            <span className="chip num">Dia {missionDay(member.missionStart, today)} da missão</span>
            <span className="chip">{ENVIRONMENTS[settings.environment].label}</span>
            {latest && <span className="chip num">Último registro: {formatDate(latest.date)}</span>}
          </div>
        </div>
        <div className="stack" style={{ justifyItems: 'start' }}>
          {latest ? <LevelBadge level={overall} label={alerts.length === 0 ? 'Tudo dentro do esperado' : `${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'}`} /> : <span className="chip">Sem registros para avaliar</span>}
          {viewingOther ? null : checkinDone ? (
            <Link className="btn" to="/checkin">Refazer check-in de hoje</Link>
          ) : (
            <Link className="btn btn-primary" to="/checkin">Fazer o check-in de hoje →</Link>
          )}
        </div>
      </section>

      {!checkinDone && (
        <p className="notice">
          <span className="notice-icon" aria-hidden="true">!</span>
          <span>
            {viewingOther
              ? `O check-in de hoje ainda não chegou à central. O painel mostra o registro de ${latest ? formatDate(latest.date) : 'nenhum dia'}.`
              : `O check-in de hoje está pendente. O painel mostra o registro de ${latest ? formatDate(latest.date) : 'nenhum dia'}.`}
          </span>
        </p>
      )}

      <div className="dashboard">
        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <h2>Sistemas do corpo</h2>
            <p className="small muted">Toque numa região para ver os indicadores.</p>
          </div>
          <div className="body-layout">
            <BodyMap
              levels={latest ? regionLevels : {}}
              selected={region}
              onSelect={choose}
              figure={member.sex === 'female' ? 'female' : 'male'}
            />
            <ul className="region-list">
              {REGION_ORDER.map((r) => (
                <li key={r}>
                  <button type="button" className="region-button" aria-pressed={region === r} onClick={() => choose(r)}>
                    <span className="region-name">{REGIONS[r].label}</span>
                    {latest ? <LevelBadge level={regionLevels[r]} label={regionLevels[r] === 'green' ? 'OK' : undefined} /> : <span className="chip">Sem dados</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div ref={panelRef} className="region-panel-anchor">
        <RegionPanel
          region={region}
          level={latest ? regionLevels[region] : undefined}
          items={items}
          alerts={alerts}
          togetherNotes={togetherNotes}
        />
        </div>
      </div>
    </div>
  );
}
