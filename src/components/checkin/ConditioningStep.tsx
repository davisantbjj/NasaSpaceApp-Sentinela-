import { useState } from 'react';
import type { ConditioningApparatus, ConditioningAssessment } from '../../types';
import i18n from '../../i18n';
import { formatNumber } from '../../lib/format';
import { rules } from '../../rules/rules';

interface Props {
  value?: ConditioningAssessment;
  onChange: (value: ConditioningAssessment | undefined) => void;
}

const apparatus: ConditioningApparatus[] = ['treadmill', 'cycle', 'rower', 'resistive', 'flywheel', 'other'];

interface Form {
  aerobicPercent: string;
  strengthPercent: string;
  aerobicApparatus: ConditioningApparatus;
  strengthApparatus: ConditioningApparatus;
}

// Percentual digitado: vazio ou fora de 0 a 200 não vale.
function parsePercent(text: string): number | undefined {
  if (text.trim() === '') return undefined;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= 200 ? value : undefined;
}

// Só vira avaliação quando os dois percentuais são válidos. Campos vazios não são 0%.
function toAssessment(form: Form): ConditioningAssessment | undefined {
  const aerobicPercent = parsePercent(form.aerobicPercent);
  const strengthPercent = parsePercent(form.strengthPercent);
  if (aerobicPercent === undefined || strengthPercent === undefined) return undefined;
  return { aerobicPercent, strengthPercent, aerobicApparatus: form.aerobicApparatus, strengthApparatus: form.strengthApparatus };
}

export function ConditioningStep({ value, onChange }: Props) {
  const [form, setForm] = useState<Form>(() => ({
    aerobicPercent: value ? String(value.aerobicPercent) : '',
    strengthPercent: value ? String(value.strengthPercent) : '',
    aerobicApparatus: value?.aerobicApparatus ?? 'treadmill',
    strengthApparatus: value?.strengthApparatus ?? 'resistive',
  }));
  const update = (patch: Partial<Form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange(toAssessment(next));
  };
  const invalid = (text: string) => text.trim() !== '' && parsePercent(text) === undefined;
  const apparatusOptions = apparatus.map((id) => (
    <option key={id} value={id}>{i18n.t(`checkin:conditioning.apparatus.${id}`)}</option>
  ));
  const parts = [
    { kind: 'aerobic', percent: 'aerobicPercent', device: 'aerobicApparatus' },
    { kind: 'strength', percent: 'strengthPercent', device: 'strengthApparatus' },
  ] as const;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted">{i18n.t('checkin:conditioning.instructions')}</p>
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        {parts.map(({ kind, percent, device }) => (
          <div key={kind} className="field">
            <label htmlFor={`conditioning-${kind}`}>{i18n.t(`checkin:conditioning.${kind}`)}</label>
            <div className="field-input">
              <input
                id={`conditioning-${kind}`}
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                max="200"
                step="1"
                value={form[percent]}
                aria-invalid={invalid(form[percent])}
                onChange={(event) => update({ [percent]: event.target.value })}
              />
              <span className="muted">%</span>
            </div>
            <select
              className="input"
              aria-label={i18n.t('checkin:conditioning.apparatusFor', { part: i18n.t(`checkin:conditioning.${kind}`) })}
              value={form[device]}
              onChange={(event) => update({ [device]: event.target.value as ConditioningApparatus })}
            >
              {apparatusOptions}
            </select>
            {invalid(form[percent]) && <p className="field-error">{i18n.t('checkin:conditioning.invalid')}</p>}
          </div>
        ))}
      </div>
      <p className="small muted">{i18n.t('checkin:conditioning.disclaimer', { min: formatNumber(rules.indicators.conditioning?.green?.min ?? 80) })}</p>
    </div>
  );
}
