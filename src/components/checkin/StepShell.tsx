import type { ReactNode } from 'react';

interface Props {
  index: number; // começa em 0
  total: number;
  title: string;
  howToMeasure?: string;
  whyMeasure?: string;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

// Moldura de cada passo do check-in: progresso, campo, "como medir", "por que medir" e ações.
export function StepShell({
  index, total, title, howToMeasure, whyMeasure, children, onBack, onSkip, onNext,
  nextLabel = 'Avançar', nextDisabled,
}: Props) {
  return (
    <form
      className="card step"
      onSubmit={(event) => {
        event.preventDefault();
        if (!nextDisabled) onNext();
      }}
    >
      <div className="stack" style={{ gap: 10 }}>
        <div className="row-between">
          <span className="eyebrow num">Passo {index + 1} de {total}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} aria-label="Progresso do check-in">
          <div className="progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <h2 style={{ fontSize: '1.375rem' }}>{title}</h2>
      </div>

      {children}

      {(howToMeasure || whyMeasure) && (
        <div className="step-help card-inner">
          {howToMeasure && (
            <div>
              <span className="eyebrow">Como medir</span>
              <p className="small">{howToMeasure}</p>
            </div>
          )}
          {whyMeasure && (
            <div>
              <span className="eyebrow">Por que medir</span>
              <p className="small muted">{whyMeasure}</p>
            </div>
          )}
        </div>
      )}

      <div className="step-actions">
        {onBack ? <button type="button" className="btn btn-ghost" onClick={onBack}>← Voltar</button> : <span />}
        <div className="right">
          {onSkip && <button type="button" className="btn btn-ghost" onClick={onSkip}>Pular</button>}
          <button type="submit" className="btn btn-primary" disabled={nextDisabled}>{nextLabel}</button>
        </div>
      </div>
    </form>
  );
}
