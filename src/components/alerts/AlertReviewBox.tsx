import { useId, useState, type FormEvent } from 'react';
import { formatDateTime } from '../../lib/dates';
import type { AlertReview } from '../../types';

interface Props {
  review?: AlertReview;
  onReview?: (note: string) => Promise<void>;
}

// "Visto pelo oficial médico" e a conduta anotada. Quem não é oficial médico só lê.
export function AlertReviewBox({ review, onReview }: Props) {
  const [note, setNote] = useState(review?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const noteId = useId();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!onReview) return;
    setSaving(true);
    setSaved(false);
    setError(undefined);
    try {
      await onReview(note);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-inner stack review-box" style={{ gap: 10, color: 'var(--text)' }}>
      {review ? (
        <p className="small">
          <strong style={{ color: 'var(--level-green)' }}>✓ Visto pelo oficial médico</strong>
          <span className="muted"> · {review.seenBy}, {formatDateTime(review.seenAt)}{review.syncedAt ? '' : ' · ainda neste aparelho'}</span>
        </p>
      ) : (
        <p className="small muted">Ainda não visto pelo oficial médico.</p>
      )}
      {review?.note && !onReview && (
        <p><span className="small muted">Conduta: </span>{review.note}</p>
      )}
      {onReview && (
        <form className="stack" style={{ gap: 8 }} onSubmit={submit}>
          <label htmlFor={noteId} className="small" style={{ fontWeight: 600 }}>Conduta (opcional)</label>
          <textarea
            id={noteId}
            className="textarea"
            rows={2}
            value={note}
            onChange={(e) => { setNote(e.target.value); setSaved(false); }}
            placeholder="Ex.: conversei com a tripulante, repetir a medida amanhã."
          />
          <div className="row">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Salvando…' : review ? 'Atualizar anotação' : 'Marcar como visto'}
            </button>
            {saved && <span className="small muted" role="status">Salvo. Vai para a central e para a Terra no próximo pacote.</span>}
          </div>
          {error && <p className="field-error" role="alert">Não foi possível salvar: {error}</p>}
        </form>
      )}
    </div>
  );
}
