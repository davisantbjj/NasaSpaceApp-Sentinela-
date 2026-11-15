import { useState } from 'react';
import type { ExerciseSession, ExerciseSessionType, ResistanceStatus } from '../../types';
import i18n from '../../i18n';

interface Props {
  value?: ExerciseSession;
  onChange: (value: ExerciseSession | undefined) => void;
}

const initial: ExerciseSession = { type: 'aerobic', durationMinutes: 0 };

export function ExerciseSessionStep({ value, onChange }: Props) {
  const [session, setSession] = useState<ExerciseSession>(value ?? initial);
  const update = (patch: Partial<ExerciseSession>) => {
    const next = { ...session, ...patch };
    setSession(next);
    onChange(next.durationMinutes > 0 ? next : undefined);
  };
  const hasAerobic = session.type === 'aerobic' || session.type === 'both';
  const hasResistance = session.type === 'resistance' || session.type === 'both';

  return (
    <div className="stack" style={{ gap: 14 }}>
      <label htmlFor="exercise-session-type">{i18n.t('checkin:exerciseSession.type')}</label>
      <select
        id="exercise-session-type"
        className="input"
        value={session.type}
        onChange={(event) => update({ type: event.target.value as ExerciseSessionType })}
      >
        <option value="aerobic">{i18n.t('checkin:exerciseSession.aerobic')}</option>
        <option value="resistance">{i18n.t('checkin:exerciseSession.resistance')}</option>
        <option value="both">{i18n.t('checkin:exerciseSession.both')}</option>
      </select>

      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <div className="field">
          <label htmlFor="exercise-session-minutes">{i18n.t('checkin:exerciseSession.minutes')}</label>
          <div className="field-input">
            <input
              id="exercise-session-minutes"
              className="input"
              type="number"
              min="1"
              max="1440"
              step="1"
              value={session.durationMinutes || ''}
              onChange={(event) => update({ durationMinutes: Number(event.target.value) || 0 })}
            />
            <span className="muted">min</span>
          </div>
        </div>
        {hasAerobic && (
          <div className="field">
            <label htmlFor="exercise-session-heart-rate">{i18n.t('checkin:exerciseSession.heartRate')}</label>
            <div className="field-input">
              <input
                id="exercise-session-heart-rate"
                className="input"
                type="number"
                min="30"
                max="240"
                step="1"
                value={session.averageHeartRate ?? ''}
                onChange={(event) => update({ averageHeartRate: Number(event.target.value) || undefined })}
              />
              <span className="muted">bpm</span>
            </div>
          </div>
        )}
      </div>

      {hasResistance && (
        <fieldset className="options list">
          <legend>{i18n.t('checkin:exerciseSession.resistanceStatus')}</legend>
          {([
            ['completed', 'completed'],
            ['partial', 'partial'],
            ['notDone', 'notDone'],
          ] as const).map(([id, label]) => (
            <label key={id} className="option">
              <input
                type="radio"
                name="exercise-resistance-status"
                checked={(session.resistanceStatus ?? 'completed') === id}
                onChange={() => update({ resistanceStatus: id as ResistanceStatus })}
              />
              <span className="option-face">{i18n.t(`checkin:exerciseSession.${label}`)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="small muted">{i18n.t('checkin:exerciseSession.disclaimer')}</p>
    </div>
  );
}
