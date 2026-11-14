import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { ChecklistStep } from '../components/checkin/ChecklistStep';
import { fieldError, NumberStep, parseNumber, type NumberField } from '../components/checkin/NumberStep';
import { ScaleStep } from '../components/checkin/ScaleStep';
import { StepShell } from '../components/checkin/StepShell';
import { displayText } from '../content/format';
import { INDICATORS } from '../content/indicators';
import { todayISO } from '../lib/dates';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore } from '../store/useAppStore';
import type { Alert, DailyValues, IndicatorId } from '../types';
import { latestRecord, SYMPTOM_LABELS, trackedInOrder } from './helpers';

// Rascunho do formulário: números como texto (aceita vírgula), escalas e sintomas já prontos.
interface Draft {
  text: Record<string, string>;
  mood?: number;
  vision?: number;
  symptoms?: string[];
}

function draftFrom(values: DailyValues | undefined): Draft {
  const text: Record<string, string> = {};
  const str = (v?: number) => (v === undefined ? '' : String(v).replace('.', ','));
  if (values) {
    text.systolic = str(values.bloodPressure?.systolic);
    text.diastolic = str(values.bloodPressure?.diastolic);
    for (const id of ['heartRate', 'temperature', 'glucose', 'sleepHours', 'exerciseMinutes', 'radiationDose'] as const) {
      text[id] = str(values[id]);
    }
  }
  return { text, mood: values?.mood, vision: values?.vision, symptoms: values?.symptoms };
}

function fieldsFor(indicator: IndicatorId, draft: Draft): NumberField[] {
  const content = INDICATORS[indicator];
  const input = content.input!;
  if (indicator === 'bloodPressure') {
    return [
      { id: 'systolic', label: 'Sistólica (máxima)', unit: content.unit, value: draft.text.systolic ?? '', ...input },
      { id: 'diastolic', label: 'Diastólica (mínima)', unit: content.unit, value: draft.text.diastolic ?? '', ...input },
    ];
  }
  return [{ id: indicator, label: content.label, unit: content.unit, value: draft.text[indicator] ?? '', ...input }];
}

// Converte o rascunho em valores do dia. Campos vazios ou inválidos ficam de fora (pulados).
function toValues(steps: IndicatorId[], draft: Draft): DailyValues {
  const values: DailyValues = {};
  for (const indicator of steps) {
    if (indicator === 'mood') {
      if (draft.mood !== undefined) values.mood = draft.mood as DailyValues['mood'];
    } else if (indicator === 'vision') {
      if (draft.vision !== undefined) values.vision = draft.vision as DailyValues['vision'];
    } else if (indicator === 'symptoms') {
      if (draft.symptoms !== undefined) values.symptoms = draft.symptoms;
    } else {
      const fields = fieldsFor(indicator, draft);
      if (fields.some((f) => fieldError(f))) continue;
      const numbers = fields.map((f) => parseNumber(f.value));
      if (numbers.some((n) => n === undefined)) continue;
      if (indicator === 'bloodPressure') values.bloodPressure = { systolic: numbers[0]!, diastolic: numbers[1]! };
      else Object.assign(values, { [indicator]: numbers[0] });
    }
  }
  return values;
}

export function CheckinPage() {
  const member = useActiveCrew();
  const { records, saveCheckin } = useAppStore();
  const latest = latestRecord(records);
  const existing = latest?.date === todayISO() ? latest : undefined;

  const steps = useMemo(() => trackedInOrder(member), [member]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(existing?.values));
  const [stage, setStage] = useState<'steps' | 'review' | 'done'>('steps');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Alert[]>([]);

  if (!member || steps.length === 0) return null;

  const values = toValues(steps, draft);
  const filled = Object.keys(values).length;

  const next = () => (index < steps.length - 1 ? setIndex(index + 1) : setStage('review'));
  const back = index > 0 ? () => setIndex(index - 1) : undefined;

  const skip = () => {
    const indicator = steps[index];
    setDraft((d) => {
      const text = { ...d.text };
      if (indicator === 'bloodPressure') {
        text.systolic = '';
        text.diastolic = '';
      } else text[indicator] = '';
      return {
        text,
        mood: indicator === 'mood' ? undefined : d.mood,
        vision: indicator === 'vision' ? undefined : d.vision,
        symptoms: indicator === 'symptoms' ? undefined : d.symptoms,
      };
    });
    next();
  };

  const save = async () => {
    setSaving(true);
    try {
      setResult(await saveCheckin(values));
      setStage('done');
    } finally {
      setSaving(false);
    }
  };

  if (stage === 'done') {
    return (
      <div className="page checkin">
        <section className="card step">
          <span className="eyebrow">Check-in salvo</span>
          <h1>
            {result.length === 0
              ? 'Tudo dentro do esperado hoje'
              : `${result.length} ${result.length === 1 ? 'alerta' : 'alertas'} no registro de hoje`}
          </h1>
          {result.length === 0 ? (
            <LevelBadge level="green" />
          ) : (
            <ul className="summary-list">
              {result.map((alert) => (
                <li key={alert.id}>
                  <span>{alert.whatChanged}</span>
                  <LevelBadge level={alert.level} />
                </li>
              ))}
            </ul>
          )}
          <div className="step-actions">
            <Link className="btn" to="/">Ver o painel</Link>
            {result.length > 0 && <Link className="btn btn-primary" to="/alerts">Ver alertas e ações →</Link>}
          </div>
        </section>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div className="page checkin">
        <section className="card step">
          <div>
            <span className="eyebrow">Revisão</span>
            <h1>Confira antes de salvar</h1>
          </div>
          <ul className="summary-list">
            {steps.map((indicator, i) => (
              <li key={indicator}>
                <button
                  type="button"
                  className="link-arrow"
                  style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', minHeight: 32 }}
                  onClick={() => {
                    setIndex(i);
                    setStage('steps');
                  }}
                >
                  {INDICATORS[indicator].label}
                </button>
                <span className={values[indicator] === undefined ? 'muted' : 'num'}>
                  {displayText(values, indicator, SYMPTOM_LABELS) ?? 'Pulado'}
                </span>
              </li>
            ))}
          </ul>
          {existing && <p className="small muted">Você já fez o check-in hoje. Salvar de novo substitui o registro anterior.</p>}
          {filled === 0 && <p className="field-error">Preencha pelo menos um indicador para salvar.</p>}
          <div className="step-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStage('steps')}>← Voltar</button>
            <button type="button" className="btn btn-primary" disabled={filled === 0 || saving} onClick={save}>
              {saving ? 'Salvando…' : 'Salvar check-in'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const indicator = steps[index];
  const content = INDICATORS[indicator];
  const fields = content.input ? fieldsFor(indicator, draft) : [];
  const partialBp = indicator === 'bloodPressure' && fields.filter((f) => f.value.trim() !== '').length === 1;

  return (
    <div className="page checkin">
      <header className="page-header">
        <span className="eyebrow">Check-in diário · {member.name}</span>
        <p className="small muted">Só aparecem os indicadores que você acompanha. Qualquer passo pode ser pulado.</p>
      </header>

      <StepShell
        key={indicator}
        index={index}
        total={steps.length}
        title={content.label}
        howToMeasure={content.howToMeasure}
        whyMeasure={content.whyMeasure}
        onBack={back}
        onSkip={skip}
        onNext={next}
        nextLabel={index === steps.length - 1 ? 'Revisar' : 'Avançar'}
        nextDisabled={fields.some((f) => fieldError(f)) || partialBp}
      >
        {content.input && (
          <>
            <NumberStep fields={fields} onChange={(id, value) => setDraft((d) => ({ ...d, text: { ...d.text, [id]: value } }))} />
            {partialBp && <p className="small muted">Digite os dois números da pressão, ou pule o passo.</p>}
          </>
        )}
        {content.scale && (
          <ScaleStep
            name={indicator}
            legend={content.label}
            options={content.scale}
            value={indicator === 'mood' ? draft.mood : draft.vision}
            onChange={(value) => setDraft((d) => ({ ...d, [indicator]: value }))}
          />
        )}
        {indicator === 'symptoms' && (
          <ChecklistStep
            legend="Sintomas de hoje"
            options={rules.symptoms}
            value={draft.symptoms ?? []}
            onChange={(symptoms) => setDraft((d) => ({ ...d, symptoms }))}
          />
        )}
      </StepShell>
    </div>
  );
}
