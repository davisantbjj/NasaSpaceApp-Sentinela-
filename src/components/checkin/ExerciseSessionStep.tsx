import { useState } from 'react';
import type { ExerciseApparatus, ExercisePart, ExerciseSession, ExerciseSessionType, ResistanceStatus } from '../../types';
import i18n from '../../i18n';
import { APPARATUS_BY_PART, withApparatusTotals } from '../../lib/checkinSummary';

interface Props {
  value?: ExerciseSession;
  onChange: (value: ExerciseSession | undefined) => void;
}

const TYPES: ExerciseSessionType[] = ['aerobic', 'resistance', 'both'];
const partsOf = (type: ExerciseSessionType): ExercisePart[] =>
  type === 'both' ? ['aerobic', 'resistance'] : [type];
const keyOf = (part: ExercisePart, apparatus: ExerciseApparatus) => `${part}:${apparatus}`;

interface Form {
  type: ExerciseSessionType;
  minutes: Record<string, string>; // minutos digitados por aparelho marcado; a chave existe enquanto está marcado
  averageHeartRate?: number;
  resistanceStatus?: ResistanceStatus;
}

// Sessão já gravada sem aparelhos (antes desta versão): a duração entra como "outro aparelho".
function formFrom(value: ExerciseSession | undefined): Form {
  if (!value) return { type: 'aerobic', minutes: {} };
  const minutes: Record<string, string> = {};
  if (value.apparatus?.length) {
    for (const use of value.apparatus) minutes[keyOf(use.part, use.apparatus)] = String(use.minutes);
  } else if (value.durationMinutes > 0) {
    const resistance = value.type === 'resistance' ? value.durationMinutes : value.type === 'both' ? value.resistanceMinutes ?? 0 : 0;
    const aerobic = value.durationMinutes - resistance;
    if (aerobic > 0) minutes[keyOf('aerobic', 'other')] = String(aerobic);
    if (resistance > 0) minutes[keyOf('resistance', 'other')] = String(resistance);
  }
  return { type: value.type, minutes, averageHeartRate: value.averageHeartRate, resistanceStatus: value.resistanceStatus };
}

const parseMinutes = (text: string) => {
  const n = Number(text.replace(',', '.'));
  return text.trim() !== '' && Number.isInteger(n) && n > 0 && n <= 1440 ? n : undefined;
};

function toSession(form: Form): ExerciseSession | undefined {
  const parts = partsOf(form.type);
  const apparatus = Object.entries(form.minutes).flatMap(([key, text]) => {
    const [part, id] = key.split(':') as [ExercisePart, ExerciseApparatus];
    const minutes = parseMinutes(text);
    return parts.includes(part) && minutes ? [{ part, apparatus: id, minutes }] : [];
  });
  const hasAerobic = parts.includes('aerobic');
  const session = withApparatusTotals({
    type: form.type,
    durationMinutes: 0,
    apparatus,
    averageHeartRate: hasAerobic ? form.averageHeartRate : undefined,
    resistanceStatus: parts.includes('resistance') ? form.resistanceStatus ?? 'completed' : undefined,
  });
  return session.durationMinutes > 0 ? session : undefined;
}

// Exercício (N16): tipo da sessão, aparelhos usados em cada parte e minutos em cada aparelho.
export function ExerciseSessionStep({ value, onChange }: Props) {
  const [form, setForm] = useState<Form>(() => formFrom(value));
  const update = (patch: Partial<Form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange(toSession(next));
  };
  const parts = partsOf(form.type);
  const total = toSession(form)?.durationMinutes ?? 0;

  const toggle = (key: string, checked: boolean) => {
    const minutes = { ...form.minutes };
    if (checked) minutes[key] = minutes[key] ?? '';
    else delete minutes[key];
    update({ minutes });
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <fieldset className="options">
        <legend className="field-legend">{i18n.t('checkin:exerciseSession.type')}</legend>
        {TYPES.map((type) => (
          <label key={type} className="option">
            <input type="radio" name="exercise-session-type" checked={form.type === type} onChange={() => update({ type })} />
            <span className="option-face">{i18n.t(`checkin:exerciseSession.${type}`)}</span>
          </label>
        ))}
      </fieldset>

      {parts.map((part) => (
        <fieldset key={part} className="apparatus-list">
          <legend className="field-legend">{i18n.t(`checkin:exerciseSession.part.${part}`)}</legend>
          {APPARATUS_BY_PART[part].map((apparatus) => {
            const key = keyOf(part, apparatus);
            const checked = key in form.minutes;
            const text = form.minutes[key] ?? '';
            const invalid = checked && text.trim() !== '' && parseMinutes(text) === undefined;
            const name = i18n.t(`checkin:exerciseSession.apparatus.${apparatus}`);
            const inputId = `exercise-${part}-${apparatus}`;
            return (
              <div key={key} className={`apparatus-row${checked ? ' is-on' : ''}`}>
                <label className="option">
                  <input type="checkbox" checked={checked} onChange={(event) => toggle(key, event.target.checked)} />
                  <span className="option-face">
                    <span className="option-check" aria-hidden="true">✓</span>
                    {name}
                  </span>
                </label>
                {checked && (
                  <div className="field-input">
                    <label htmlFor={inputId} className="visually-hidden">
                      {i18n.t('checkin:exerciseSession.apparatusMinutes', { name })}
                    </label>
                    <input
                      id={inputId}
                      className="input input-compact"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={text}
                      aria-invalid={invalid}
                      onChange={(event) => update({ minutes: { ...form.minutes, [key]: event.target.value } })}
                    />
                    <span className="muted">min</span>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
      ))}

      <p className="small" aria-live="polite">
        {total > 0
          ? i18n.t('checkin:exerciseSession.total', { minutes: total })
          : i18n.t('checkin:exerciseSession.pickApparatus')}
      </p>

      {parts.includes('aerobic') && (
        <div className="field">
          <label htmlFor="exercise-session-heart-rate">{i18n.t('checkin:exerciseSession.heartRate')}</label>
          <div className="field-input">
            <input
              id="exercise-session-heart-rate"
              className="input input-compact"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.averageHeartRate ?? ''}
              onChange={(event) => {
                const n = Number(event.target.value);
                update({ averageHeartRate: Number.isFinite(n) && n > 0 ? Math.round(n) : undefined });
              }}
            />
            <span className="muted">bpm</span>
          </div>
        </div>
      )}

      {parts.includes('resistance') && (
        <fieldset className="options">
          <legend className="field-legend">{i18n.t('checkin:exerciseSession.resistanceStatus')}</legend>
          {(['completed', 'partial', 'notDone'] as const).map((id) => (
            <label key={id} className="option">
              <input
                type="radio"
                name="exercise-resistance-status"
                checked={(form.resistanceStatus ?? 'completed') === id}
                onChange={() => update({ resistanceStatus: id })}
              />
              <span className="option-face">{i18n.t(`checkin:exerciseSession.${id}`)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="small muted">{i18n.t('checkin:exerciseSession.disclaimer')}</p>
    </div>
  );
}
