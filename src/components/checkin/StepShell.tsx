import { useEffect, useRef, type ReactNode } from 'react';
import i18n from '../../i18n';

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
  nextLabel, nextDisabled,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [index]);
  return (
    <form
      className="card step checkin-step"
      onSubmit={(event) => {
        event.preventDefault();
        if (!nextDisabled) onNext();
      }}
    >
      <div className="stack step-heading" style={{ gap: 10 }}>
        <div className="row-between">
          <span className="eyebrow num">{i18n.t('checkin:step', { current: index + 1, total })}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} aria-label={i18n.t('checkin:progress')}>
          <div className="progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <h2 ref={headingRef} tabIndex={-1} style={{ fontSize: '1.375rem' }}>{title}</h2>
      </div>

      <div className="step-fields">{children}</div>

      {(howToMeasure || whyMeasure) && (
        <aside className="step-help card-inner">
          {howToMeasure && (
            <div>
              <span className="eyebrow">{i18n.t('checkin:howTo')}</span>
              <p className="small">{howToMeasure}</p>
            </div>
          )}
          {whyMeasure && (
            <div>
              <span className="eyebrow">{i18n.t('checkin:why')}</span>
              <p className="small muted">{whyMeasure}</p>
            </div>
          )}
        </aside>
      )}

      <div className="step-actions">
        {onBack ? <button type="button" className="btn btn-ghost" onClick={onBack}>{i18n.t('checkin:back')}</button> : <span />}
        <div className="right">
          {onSkip && <button type="button" className="btn btn-ghost" onClick={onSkip}>{i18n.t('checkin:skip')}</button>}
          <button type="submit" className="btn btn-primary" disabled={nextDisabled}>{nextLabel ?? i18n.t('checkin:next')}</button>
        </div>
      </div>
    </form>
  );
}
