import { useState } from 'react';
import type { AmslerEyeResult, AmslerVisionResult } from '../../types';
import i18n from '../../i18n';
import { eyeConcerns } from '../../lib/checkinSummary';

interface Props {
  value?: AmslerVisionResult;
  onChange: (value: AmslerVisionResult) => void;
}

type Eye = 'left' | 'right';

const EMPTY: AmslerEyeResult = {
  distortedLines: false,
  missingAreas: false,
  nearReadingWorse: false,
};

const SIZE = 10; // grade 10×10; cada célula pode ser tocada
const cells = Array.from({ length: SIZE * SIZE }, (_, i) => i);

// Visão (N15): grade de Amsler por olho. A pessoa cobre um olho, olha o ponto central e toca
// as áreas onde as linhas pareceram tortas ou sumiram; depois responde às três perguntas.
export function AmslerStep({ value, onChange }: Props) {
  const [eye, setEye] = useState<Eye>('left');
  const current = value?.[eye] ?? EMPTY;
  const areas = current.areas ?? [];
  const other: Eye = eye === 'left' ? 'right' : 'left';

  const setEyeResult = (result: AmslerEyeResult) => onChange({ ...value, [eye]: result });
  const update = (key: 'distortedLines' | 'missingAreas' | 'nearReadingWorse', checked: boolean) =>
    setEyeResult({ ...current, [key]: checked });
  const toggleCell = (cell: number) => {
    const next = areas.includes(cell) ? areas.filter((c) => c !== cell) : [...areas, cell].sort((a, b) => a - b);
    setEyeResult({ ...current, areas: next.length ? next : undefined });
  };

  const status = (id: Eye) => {
    const result = value?.[id];
    if (!result) return i18n.t('checkin:amsler.notTested');
    return eyeConcerns(result) > 0 ? i18n.t('checkin:amsler.changed') : i18n.t('checkin:amsler.noChange');
  };
  const marksWithoutAnswer = areas.length > 0 && !current.distortedLines && !current.missingAreas;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="small muted">{i18n.t('checkin:amsler.instructions')}</p>

      <div className="amsler-eyes" role="group" aria-label={i18n.t('checkin:amsler.eye')}>
        {(['left', 'right'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`btn amsler-eye${eye === id ? ' btn-primary' : ''}`}
            aria-pressed={eye === id}
            onClick={() => setEye(id)}
          >
            <span>{i18n.t(`checkin:amsler.${id}`)}</span>
            <span className="small">{status(id)}</span>
          </button>
        ))}
      </div>

      <p className="amsler-cover" aria-live="polite">
        {i18n.t(`checkin:amsler.cover.${eye}`)}
      </p>

      <div className="amsler-grid" role="group" aria-label={i18n.t('checkin:amsler.gridLabel', { eye: i18n.t(`checkin:amsler.${eye}`) })}>
        {cells.map((cell) => {
          const marked = areas.includes(cell);
          return (
            <button
              key={cell}
              type="button"
              className={`amsler-cell${marked ? ' is-marked' : ''}`}
              aria-pressed={marked}
              aria-label={i18n.t('checkin:amsler.cell', { row: Math.floor(cell / SIZE) + 1, col: (cell % SIZE) + 1 })}
              onClick={() => toggleCell(cell)}
            />
          );
        })}
        <span className="amsler-dot" aria-hidden="true" />
      </div>
      <p className="small muted" style={{ textAlign: 'center' }}>
        {areas.length > 0
          ? i18n.t('checkin:amsler.marked', { count: areas.length })
          : i18n.t('checkin:amsler.tapHint')}
        {areas.length > 0 && (
          <>
            {' '}
            <button type="button" className="link-button" onClick={() => setEyeResult({ ...current, areas: undefined })}>
              {i18n.t('checkin:amsler.clear')}
            </button>
          </>
        )}
      </p>

      <fieldset className="options list">
        <legend className="field-legend">{i18n.t('checkin:amsler.questionsFor', { eye: i18n.t(`checkin:amsler.${eye}`) })}</legend>
        {([
          ['distortedLines', 'distorted'],
          ['missingAreas', 'missing'],
          ['nearReadingWorse', 'near'],
        ] as const).map(([key, label]) => (
          <label key={key} className="option">
            <input type="checkbox" checked={current[key]} onChange={(event) => update(key, event.target.checked)} />
            <span className="option-face">
              <span className="option-check" aria-hidden="true">✓</span>
              {i18n.t(`checkin:amsler.${label}`)}
            </span>
          </label>
        ))}
      </fieldset>
      {marksWithoutAnswer && <p className="small">{i18n.t('checkin:amsler.marksWithoutAnswer')}</p>}

      {!value?.[other] && (
        <button
          type="button"
          className="btn"
          onClick={() => {
            // Olhou a grade com este olho e não marcou nada: fica registrado como sem alteração.
            if (!value?.[eye]) onChange({ ...value, [eye]: EMPTY });
            setEye(other);
          }}
        >
          {i18n.t(`checkin:amsler.next.${other}`)}
        </button>
      )}
      <p className="small muted">{i18n.t('checkin:amsler.noneMarked')}</p>
      <p className="small muted">{i18n.t('checkin:amsler.disclaimer')}</p>
    </div>
  );
}
