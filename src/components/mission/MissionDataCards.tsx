import { useState } from 'react';
import i18n from '../../i18n';
import { formatNumber } from '../../lib/format';
import { isCabinCo2High } from '../../rules/engine';
import { rules } from '../../rules/rules';
import { canEditMission } from '../../lib/access';
import { useAppStore } from '../../store/useAppStore';
import type { CrewMember } from '../../types';

// Número digitado: vazio vira `null` (apagar o valor); fora da faixa ou inválido vira `undefined`.
export function parseBounded(text: string, min: number, max: number): number | null | undefined {
  if (text.trim() === '') return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= min && value <= max ? value : undefined;
}

interface DraftFieldProps {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number | undefined;
  disabled?: boolean;
  onCommit: (value: number | undefined) => Promise<void>;
}

// Campo que só grava ao sair dele ou com Enter, e só quando o valor é válido.
// Enquanto a pessoa digita, o texto fica local: nada é gravado a cada tecla.
function DraftNumberField({ id, label, unit, min, max, step, value, disabled, onCommit }: DraftFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const parsed = parseBounded(text, min, max);
  const invalid = parsed === undefined;

  const commit = () => {
    if (invalid) return;
    const next = parsed ?? undefined;
    if (next !== value) void onCommit(next);
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input">
        <input
          id={id}
          className="input"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
        />
        <span className="muted">{unit}</span>
      </div>
      {invalid && (
        <p className="field-error">{i18n.t('mission.numberRange', { min: formatNumber(min), max: formatNumber(max) })}</p>
      )}
    </div>
  );
}

// CO2 da cabine (N13): dado da missão, não de uma pessoa.
export function CabinCo2Card() {
  const { settings, session, setCabinCo2Mmhg } = useAppStore();
  const canEdit = canEditMission(session);
  const config = rules.context?.cabinCo2;
  const value = settings.cabinCo2Mmhg;
  const high = isCabinCo2High(value, rules);
  const limit = formatNumber(config?.attentionMmhg ?? 0);

  return (
    <section className="card stack" style={{ gap: 14 }}>
      <div>
        <h2>{i18n.t('mission.cabinCo2.title')}</h2>
        <p className="small muted">{i18n.t('mission.cabinCo2.intro')}</p>
      </div>
      <DraftNumberField
        // Recria o campo quando o valor muda por fora (por exemplo, ao recriar a demonstração).
        key={String(value)}
        id="cabin-co2"
        label={i18n.t('mission.cabinCo2.value')}
        unit="mmHg"
        min={0}
        max={10}
        step={0.1}
        value={value}
        disabled={!canEdit}
        onCommit={setCabinCo2Mmhg}
      />
      {high && value !== undefined && (
        <p className="notice">
          <span className="notice-icon" aria-hidden="true">!</span>
          <span>{i18n.t('mission.cabinCo2.warning', { value: formatNumber(value), limit })}</span>
        </p>
      )}
      <p className="small muted">{i18n.t('mission.cabinCo2.note', { limit })}</p>
      {!canEdit && <p className="small muted">{i18n.t('mission.editorsOnly')}</p>}
      {config?.sourceUrl && (
        <a href={config.sourceUrl} target="_blank" rel="noreferrer">
          {i18n.t('mission.cabinCo2.source')}
        </a>
      )}
    </section>
  );
}

// Dados iniciais do tripulante (N2 e N11). Só o oficial médico altera.
export function CrewMissionDataCard({ member }: { member: CrewMember }) {
  const { session, setCrewMissionData } = useAppStore();
  const canEdit = session?.role === 'medicalOfficer';
  const save = (patch: Partial<CrewMember>) => setCrewMissionData(member.id, {
    startBodyMassKg: member.startBodyMassKg,
    priorCareerDoseMsv: member.priorCareerDoseMsv,
    ...patch,
  });

  return (
    <section className="card stack" style={{ gap: 14 }}>
      <div>
        <h2>{i18n.t('mission.crewData.title', { name: member.name })}</h2>
        <p className="small muted">{i18n.t('mission.crewData.intro')}</p>
      </div>
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <DraftNumberField
          key={`${member.id}-mass-${member.startBodyMassKg}`}
          id="crew-start-mass"
          label={i18n.t('mission.crewData.startBodyMass')}
          unit="kg"
          min={20}
          max={300}
          step={0.1}
          value={member.startBodyMassKg}
          disabled={!canEdit}
          onCommit={(startBodyMassKg) => save({ startBodyMassKg })}
        />
        <DraftNumberField
          key={`${member.id}-dose-${member.priorCareerDoseMsv}`}
          id="crew-prior-dose"
          label={i18n.t('mission.crewData.priorCareerDose')}
          unit="mSv"
          min={0}
          max={2000}
          step={0.1}
          value={member.priorCareerDoseMsv}
          disabled={!canEdit}
          onCommit={(priorCareerDoseMsv) => save({ priorCareerDoseMsv })}
        />
      </div>
      <p className="small muted">
        {canEdit ? i18n.t('mission.crewData.note') : i18n.t('mission.crewData.medicalOnly')}
      </p>
    </section>
  );
}
