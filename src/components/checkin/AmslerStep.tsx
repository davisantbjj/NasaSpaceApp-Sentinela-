import { useState } from 'react';
import type { AmslerEyeResult, AmslerVisionResult } from '../../types';
import i18n from '../../i18n';

interface Props {
  value?: AmslerVisionResult;
  onChange: (value: AmslerVisionResult) => void;
}

const EMPTY: AmslerEyeResult = {
  distortedLines: false,
  missingAreas: false,
  nearReadingWorse: false,
};

export function AmslerStep({ value, onChange }: Props) {
  const [eye, setEye] = useState<'left' | 'right'>('left');
  const current = value?.[eye] ?? EMPTY;
  const update = (key: keyof AmslerEyeResult, checked: boolean) => {
    onChange({ ...value, [eye]: { ...current, [key]: checked } });
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted">{i18n.t('checkin:amsler.instructions')}</p>
      <div className="row" role="group" aria-label={i18n.t('checkin:amsler.eye')}>
        {(['left', 'right'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`btn${eye === id ? ' btn-primary' : ''}`}
            onClick={() => setEye(id)}
          >
            {i18n.t(`checkin:amsler.${id}`)}
          </button>
        ))}
      </div>
      <div
        role="img"
        aria-label={i18n.t('checkin:amsler.grid')}
        style={{
          width: 'min(280px, 70vw)',
          aspectRatio: '1',
          border: '1px solid currentColor',
          backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '10% 10%',
          alignSelf: 'center',
          opacity: 0.75,
        }}
      />
      <fieldset className="options list">
        <legend className="visually-hidden">{i18n.t('checkin:amsler.questions')}</legend>
        {([
          ['distortedLines', 'distorted'],
          ['missingAreas', 'missing'],
          ['nearReadingWorse', 'near'],
        ] as const).map(([key, label]) => (
          <label key={key} className="option">
            <input type="checkbox" checked={current[key]} onChange={(event) => update(key, event.target.checked)} />
            <span className="option-face">{i18n.t(`checkin:amsler.${label}`)}</span>
          </label>
        ))}
      </fieldset>
      <p className="small muted">{i18n.t('checkin:amsler.disclaimer')}</p>
    </div>
  );
}
