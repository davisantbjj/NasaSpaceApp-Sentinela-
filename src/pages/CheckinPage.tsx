import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { ChecklistStep } from '../components/checkin/ChecklistStep';
import { ReactionTestStep } from '../components/checkin/ReactionTestStep';
import { SourcePicker } from '../components/checkin/SourcePicker';
import { fieldError, NumberStep, parseNumber, type NumberField } from '../components/checkin/NumberStep';
import { ScaleStep } from '../components/checkin/ScaleStep';
import { StepShell } from '../components/checkin/StepShell';
import { displayText, sourceLabel } from '../content/format';
import { INDICATORS } from '../content/indicators';
import { todayISO } from '../lib/dates';
import { rules } from '../rules/rules';
import { useActiveCrew, useAppStore, useViewingOther } from '../store/useAppStore';
import type { Alert, CrewMember, DailyValues, DataSource, IndicatorId, ReactionTestDetails } from '../types';
import { latestRecord, SYMPTOM_LABELS, trackedInOrder } from './helpers';

// Indicadores respondidos numa escala (passo ScaleStep).
const SCALE_IDS = ['mood', 'stress', 'workload', 'vision'] as const;
type ScaleId = (typeof SCALE_IDS)[number];
const isScale = (id: IndicatorId): id is ScaleId => (SCALE_IDS as readonly IndicatorId[]).includes(id);

// Rascunho do formulário: números como texto (aceita vírgula), escalas e sintomas já prontos.
interface Draft {
  text: Record<string, string>;
  scale: Partial<Record<ScaleId, number>>;
  symptoms?: string[];
  medicationTaken?: string[]; // ids das doses marcadas como tomadas; ausente = passo pulado
  reactionTime?: number; // resultado do teste de reação, em ms (M4)
  reactionTest?: ReactionTestDetails;
  sources: Partial<Record<IndicatorId, DataSource>>; // origem escolhida em cada passo (M10)
}

function draftFrom(values: DailyValues | undefined, member: CrewMember | undefined): Draft {
  const text: Record<string, string> = {};
  const str = (v?: number) => (v === undefined ? '' : String(v).replace('.', ','));
  if (values) {
    text.systolic = str(values.bloodPressure?.systolic);
    text.diastolic = str(values.bloodPressure?.diastolic);
    for (const id of ['heartRate', 'temperature', 'glucose', 'sleepHours', 'exerciseMinutes', 'radiationDose'] as const) {
      text[id] = str(values[id]);
    }
    // Exercício em dois campos: o aeróbico é o total menos o resistido.
    if (values.resistanceMinutes !== undefined) {
      text.resistanceMinutes = str(values.resistanceMinutes);
      if (values.exerciseMinutes !== undefined) text.exerciseAerobic = str(values.exerciseMinutes - values.resistanceMinutes);
    } else if (values.exerciseMinutes !== undefined) {
      text.exerciseAerobic = str(values.exerciseMinutes);
    }
  }
  // Medicação começa sem nada marcado: avançar sem marcar registra as doses como não tomadas.
  const medicationTaken = values?.medication
    ? values.medication.filter((dose) => dose.taken).map((dose) => dose.id)
    : member?.medications?.length ? [] : undefined;
  const scale: Draft['scale'] = {};
  for (const id of SCALE_IDS) scale[id] = values?.[id];
  return { text, scale, symptoms: values?.symptoms, medicationTaken, reactionTime: values?.reactionTime, reactionTest: values?.reactionTest, sources: { ...values?.sources } };
}

// Quem acompanha treino resistido digita o exercício em dois campos (M3).
const splitsExercise = (member: CrewMember) => member.trackedIndicators.includes('resistanceMinutes');

function fieldsFor(indicator: IndicatorId, draft: Draft, member: CrewMember): NumberField[] {
  const content = INDICATORS[indicator];
  const input = content.input!;
  if (indicator === 'exerciseMinutes' && splitsExercise(member)) {
    return [
      { id: 'exerciseAerobic', label: 'Aeróbico (correr, pedalar, remar)', unit: content.unit, value: draft.text.exerciseAerobic ?? '', ...input },
      { id: 'resistanceMinutes', label: 'Resistido (com carga)', unit: content.unit, value: draft.text.resistanceMinutes ?? '', ...input },
    ];
  }
  if (indicator === 'bloodPressure') {
    return [
      { id: 'systolic', label: 'Sistólica (máxima)', unit: content.unit, value: draft.text.systolic ?? '', ...input },
      { id: 'diastolic', label: 'Diastólica (mínima)', unit: content.unit, value: draft.text.diastolic ?? '', ...input },
    ];
  }
  return [{ id: indicator, label: content.label, unit: content.unit, value: draft.text[indicator] ?? '', ...input }];
}

// Converte o rascunho em valores do dia. Campos vazios ou inválidos ficam de fora (pulados).
function toValues(steps: IndicatorId[], draft: Draft, member: CrewMember): DailyValues {
  const values: DailyValues = {};
  for (const indicator of steps) {
    if (isScale(indicator)) {
      const chosen = draft.scale[indicator];
      if (chosen !== undefined) Object.assign(values, { [indicator]: chosen });
    } else if (indicator === 'symptoms') {
      if (draft.symptoms !== undefined) values.symptoms = draft.symptoms;
    } else if (indicator === 'reactionTime') {
      if (draft.reactionTime !== undefined) {
        values.reactionTime = draft.reactionTime;
        if (draft.reactionTest) values.reactionTest = draft.reactionTest;
      }
    } else if (indicator === 'medication') {
      const taken = draft.medicationTaken;
      if (taken !== undefined && member.medications?.length) {
        values.medication = member.medications.map((m) => ({ id: m.id, label: m.label, taken: taken.includes(m.id) }));
      }
    } else {
      const fields = fieldsFor(indicator, draft, member);
      if (fields.some((f) => fieldError(f))) continue;
      const numbers = fields.map((f) => parseNumber(f.value));
      if (numbers.some((n) => n === undefined)) continue;
      if (indicator === 'bloodPressure') values.bloodPressure = { systolic: numbers[0]!, diastolic: numbers[1]! };
      else if (indicator === 'exerciseMinutes' && fields.length === 2) {
        values.exerciseMinutes = numbers[0]! + numbers[1]!;
        values.resistanceMinutes = numbers[1]!;
      } else Object.assign(values, { [indicator]: numbers[0] });
    }
  }
  // Origem só dos valores registrados e vindos de um aparelho.
  const sources: Partial<Record<IndicatorId, DataSource>> = {};
  for (const [indicator, source] of Object.entries(draft.sources) as [IndicatorId, DataSource][]) {
    if (source !== 'manual' && values[indicator] !== undefined) sources[indicator] = source;
  }
  if (Object.keys(sources).length > 0) values.sources = sources;
  return values;
}

// O check-in é de cada tripulante: o oficial médico vendo outra pessoa não preenche por ela.
export function CheckinPage() {
  const viewingOther = useViewingOther();
  const { crew, settings, session, switchCrew } = useAppStore();
  if (viewingOther) {
    const member = crew.find((c) => c.id === settings.activeCrewId);
    return (
      <div className="page checkin">
        <section className="card step">
          <span className="eyebrow">Check-in diário</span>
          <h1>O check-in é de cada tripulante</h1>
          <p className="muted">Você está vendo os dados de {member?.name ?? 'outro tripulante'}. Para fazer o seu check-in, volte aos seus dados.</p>
          {session?.crewId && (
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={() => void switchCrew(session.crewId!)}>Voltar aos meus dados</button>
            </div>
          )}
        </section>
      </div>
    );
  }
  return <OwnCheckin />;
}

function OwnCheckin() {
  const member = useActiveCrew();
  const { records, saveCheckin } = useAppStore();
  const latest = latestRecord(records);
  const existing = latest?.date === todayISO() ? latest : undefined;

  // Medicação só entra no check-in de quem tem medicação prevista.
  const steps = useMemo(
    () =>
      trackedInOrder(member)
        .filter((id) => id !== 'resistanceMinutes') // é o segundo campo do passo de exercício
        .filter((id) => id !== 'medication' || (member?.medications?.length ?? 0) > 0),
    [member],
  );
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(existing?.values, member));
  const [stage, setStage] = useState<'steps' | 'review' | 'done'>('steps');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Alert[]>([]);

  if (!member || steps.length === 0) return null;

  const values = toValues(steps, draft, member);
  const filled = Object.keys(values).filter((key) => key !== 'sources' && key !== 'reactionTest').length;

  const next = () => (index < steps.length - 1 ? setIndex(index + 1) : setStage('review'));
  const back = index > 0 ? () => setIndex(index - 1) : undefined;

  const skip = () => {
    const indicator = steps[index];
    setDraft((d) => {
      const text = { ...d.text };
      if (indicator === 'bloodPressure') {
        text.systolic = '';
        text.diastolic = '';
      } else if (indicator === 'exerciseMinutes') {
        text.exerciseMinutes = '';
        text.exerciseAerobic = '';
        text.resistanceMinutes = '';
      } else text[indicator] = '';
      return {
        text,
        scale: isScale(indicator) ? { ...d.scale, [indicator]: undefined } : d.scale,
        symptoms: indicator === 'symptoms' ? undefined : d.symptoms,
        medicationTaken: indicator === 'medication' ? undefined : d.medicationTaken,
        reactionTime: indicator === 'reactionTime' ? undefined : d.reactionTime,
        reactionTest: indicator === 'reactionTime' ? undefined : d.reactionTest,
        sources: { ...d.sources, [indicator]: undefined },
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
                  {indicator === 'exerciseMinutes' && values.resistanceMinutes !== undefined && ` (${displayText(values, 'resistanceMinutes')} de resistido)`}
                  {sourceLabel(values, indicator) && ` · ${sourceLabel(values, indicator)}`}
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
  const fields = content.input ? fieldsFor(indicator, draft, member) : [];
  // Passo com dois campos (pressão ou exercício dividido) com só um preenchido.
  const partial = fields.length === 2 && fields.filter((f) => f.value.trim() !== '').length === 1;
  const partialBp = indicator === 'bloodPressure' && partial;
  const partialExercise = indicator === 'exerciseMinutes' && partial;

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
        nextDisabled={fields.some((f) => fieldError(f)) || partial}
      >
        {content.input && (
          <>
            <NumberStep fields={fields} onChange={(id, value) => setDraft((d) => ({ ...d, text: { ...d.text, [id]: value } }))} />
            {partialBp && <p className="small muted">Digite os dois números da pressão, ou pule o passo.</p>}
            {partialExercise && <p className="small muted">Digite os dois tempos (use 0 se não fez um deles), ou pule o passo.</p>}
            {content.sources && (
              <SourcePicker
                name={indicator}
                options={content.sources}
                value={draft.sources[indicator] ?? 'manual'}
                onChange={(source) => setDraft((d) => ({ ...d, sources: { ...d.sources, [indicator]: source } }))}
              />
            )}
          </>
        )}
        {content.scale && (
          <ScaleStep
            name={indicator}
            legend={content.label}
            options={content.scale}
            value={isScale(indicator) ? draft.scale[indicator] : undefined}
            onChange={(value) => setDraft((d) => ({ ...d, scale: { ...d.scale, [indicator]: value } }))}
          />
        )}
        {indicator === 'reactionTime' && (
          <ReactionTestStep
            value={draft.reactionTime}
            details={draft.reactionTest}
            onResult={(reactionTime, reactionTest) => setDraft((d) => ({ ...d, reactionTime, reactionTest }))}
          />
        )}
        {indicator === 'medication' && (
          <ChecklistStep
            legend="Doses de hoje"
            options={(member.medications ?? []).map((m) => ({ id: m.id, label: `${m.label} · ${m.schedule}` }))}
            value={draft.medicationTaken ?? []}
            onChange={(medicationTaken) => setDraft((d) => ({ ...d, medicationTaken }))}
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
