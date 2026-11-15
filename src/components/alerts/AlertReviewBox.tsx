import { useId, useState, type FormEvent } from 'react';
import { formatDateTime } from '../../lib/dates';
import type { AlertReview } from '../../types';
import i18n from '../../i18n';

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
          <strong style={{ color: 'var(--level-green)' }}>✓ {i18n.t('alerts:card.review.seen')}</strong>
          <span className="muted"> · {review.seenBy}, {formatDateTime(review.seenAt)}{review.syncedAt ? '' : ` · ${i18n.t('alerts:card.review.unsynced')}`}</span>
        </p>
      ) : (
        <p className="small muted">{i18n.t('alerts:card.review.notSeen')}</p>
      )}
      {review?.note && !onReview && (
        <p><span className="small muted">{i18n.t('alerts:card.review.note')} </span>{review.note}</p>
      )}
      {onReview && (
        <form className="stack" style={{ gap: 8 }} onSubmit={submit}>
          <label htmlFor={noteId} className="small" style={{ fontWeight: 600 }}>{i18n.t('alerts:card.review.optional')}</label>
          <textarea
            id={noteId}
            className="textarea"
            rows={2}
            value={note}
            onChange={(e) => { setNote(e.target.value); setSaved(false); }}
            placeholder={i18n.t('alerts:card.review.placeholder')}
          />
          <div className="row">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? i18n.t('alerts:card.review.saving') : review ? i18n.t('alerts:card.review.update') : i18n.t('alerts:card.review.markSeen')}
            </button>
            {saved && <span className="small muted" role="status">{i18n.t('alerts:card.review.saved')}</span>}
          </div>
          {error && <p className="field-error" role="alert">{i18n.t('alerts:card.review.saveError', { error })}</p>}
        </form>
      )}
    </div>
  );
}
