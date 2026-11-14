import { Link } from 'react-router-dom';
import { INDICATORS } from '../../content/indicators';
import type { Alert } from '../../types';
import { LevelBadge } from './LevelBadge';

const TRIGGER_TEXT: Record<Alert['trigger'], string> = {
  generalRange: 'Fora da faixa geral',
  baselineDeviation: 'Desvio do padrão pessoal',
  symptom: 'Sintoma relatado',
};

// As seis partes de todo alerta: o que mudou, a referência, por que importa,
// o que fazer, a confiança do dado e a fonte.
export function AlertCard({ alert }: { alert: Alert }) {
  return (
    <article className="card alert-card level-color" data-level={alert.level}>
      <div className="row-between">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">{INDICATORS[alert.indicator].label} · {TRIGGER_TEXT[alert.trigger]}</span>
          <h2 style={{ color: 'var(--text)' }}>{alert.whatChanged}</h2>
        </div>
        <LevelBadge level={alert.level} />
      </div>

      <p className="alert-action card-inner">
        <strong>O que fazer</strong>
        {alert.whatToDo}
      </p>

      <dl className="alert-parts">
        <div>
          <dt>Em relação a</dt>
          <dd>{alert.reference}</dd>
        </div>
        <div>
          <dt>Por que importa</dt>
          <dd className="muted">{alert.whyItMatters}</dd>
        </div>
        <div>
          <dt>Confiança do dado</dt>
          <dd className="muted">
            {alert.confidence === 'low' ? 'Baixa' : 'Normal'}
            {alert.confidenceNote ? `: ${alert.confidenceNote.toLowerCase()}` : ''}
          </dd>
        </div>
        {alert.environmentNote && (
          <div>
            <dt>No ambiente atual</dt>
            <dd className="muted">{alert.environmentNote}</dd>
          </div>
        )}
      </dl>

      {alert.notifyGround && (
        <p className="notice" style={{ color: 'var(--text)' }}>
          <span className="notice-icon" aria-hidden="true">↗</span>
          <span>Marcado para aviso à equipe médica em solo no próximo contato.</span>
        </p>
      )}

      <div className="row-between">
        {alert.indicator !== 'symptoms' ? (
          <Link className="link-arrow" to={`/trends/${alert.indicator}`}>Ver histórico →</Link>
        ) : <span />}
        <a className="link-arrow muted small" href={alert.sourceUrl} target="_blank" rel="noreferrer">
          Fonte: NASA Human Research Program ↗
        </a>
      </div>
    </article>
  );
}
