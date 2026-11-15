import type { ConditioningApparatus, ConditioningAssessment } from '../../types';
import i18n from '../../i18n';

interface Props {
  value?: ConditioningAssessment;
  onChange: (value: ConditioningAssessment) => void;
}

const apparatus: ConditioningApparatus[] = ['treadmill', 'cycle', 'rower', 'resistive', 'flywheel', 'other'];

export function ConditioningStep({ value, onChange }: Props) {
  const current: ConditioningAssessment = value ?? {
    aerobicPercent: 100,
    strengthPercent: 100,
    aerobicApparatus: 'treadmill',
    strengthApparatus: 'resistive',
  };
  const update = (patch: Partial<ConditioningAssessment>) => onChange({ ...current, ...patch });
  const apparatusOptions = apparatus.map((id) => (
    <option key={id} value={id}>{i18n.t(`checkin:conditioning.apparatus.${id}`)}</option>
  ));

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted">{i18n.t('checkin:conditioning.instructions')}</p>
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <div className="field">
          <label htmlFor="conditioning-aerobic">{i18n.t('checkin:conditioning.aerobic')}</label>
          <div className="field-input">
            <input id="conditioning-aerobic" className="input" type="number" min="0" max="200" step="1" value={current.aerobicPercent} onChange={(event) => update({ aerobicPercent: Number(event.target.value) })} />
            <span className="muted">%</span>
          </div>
          <select className="input" value={current.aerobicApparatus} onChange={(event) => update({ aerobicApparatus: event.target.value as ConditioningApparatus })}>
            {apparatusOptions}
          </select>
        </div>
        <div className="field">
          <label htmlFor="conditioning-strength">{i18n.t('checkin:conditioning.strength')}</label>
          <div className="field-input">
            <input id="conditioning-strength" className="input" type="number" min="0" max="200" step="1" value={current.strengthPercent} onChange={(event) => update({ strengthPercent: Number(event.target.value) })} />
            <span className="muted">%</span>
          </div>
          <select className="input" value={current.strengthApparatus} onChange={(event) => update({ strengthApparatus: event.target.value as ConditioningApparatus })}>
            {apparatusOptions}
          </select>
        </div>
      </div>
      <p className="small muted">{i18n.t('checkin:conditioning.disclaimer')}</p>
    </div>
  );
}
