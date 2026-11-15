import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMedicalMessages, MEDICAL_MESSAGE_MAX_LENGTH, saveMedicalMessage } from '../data/messagesRepo';
import { formatDateTime } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';
import type { MedicalMessage } from '../types';
import i18n from '../i18n';

export function MedicalContactPage() {
  // Sempre os dados de quem entrou, nunca os do tripulante que o oficial médico está vendo.
  const member = useAppStore((s) => s.crew.find((c) => c.id === s.session?.crewId));
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState<MedicalMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (member) void listMedicalMessages(member.id).then((items) => {
      if (active) setMessages(items);
    }).catch(() => { if (active) setError(i18n.t('medicalContact.saveError')); });
    return () => { active = false; };
  }, [member?.id]);

  if (!member) return null;
  const crewId = member.id;
  async function save() {
    setBusy(true); setError(''); setStatus('');
    try {
      await saveMedicalMessage(crewId, body);
      setMessages(await listMedicalMessages(crewId)); setBody('');
      setStatus(i18n.t('medicalContact.saved'));
    } catch { setError(i18n.t('medicalContact.saveError')); }
    finally { setBusy(false); }
  }

  return (
    <div className="page privacy-page">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('medicalContact.eyebrow', { name: member.name })}</span>
        <h1>{i18n.t('medicalContact.title')}</h1>
        <p>{i18n.t('medicalContact.intro')}</p>
      </header>
      <p className="notice contact-notice">{i18n.t('medicalContact.urgent')}</p>
      <form className="card stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <label htmlFor="medical-message">{i18n.t('medicalContact.prompt')}</label>
        <textarea id="medical-message" className="message-input" rows={6} maxLength={MEDICAL_MESSAGE_MAX_LENGTH}
          value={body} disabled={busy} onChange={(event) => setBody(event.target.value)} aria-describedby="message-help" />
        <p id="message-help" className="small muted">{i18n.t('medicalContact.help', { count: body.length, max: MEDICAL_MESSAGE_MAX_LENGTH })}</p>
        <button className="btn btn-primary" type="submit" disabled={busy || !body.trim()}>{busy ? i18n.t('medicalContact.saving') : i18n.t('medicalContact.save')}</button>
        <p role="status">{status}</p>
        {error && <p role="alert">{error}</p>}
      </form>
      <section className="card stack" aria-labelledby="saved-messages-title">
        <h2 id="saved-messages-title">{i18n.t('medicalContact.messages')}</h2>
        {messages.length === 0 ? <p>{i18n.t('medicalContact.none')}</p> : [...messages].reverse().map((message) => (
          <article className="stack saved-message" key={message.id}>
            <p className="small muted">{formatDateTime(message.createdAt, true)} · {i18n.t('medicalContact.local')}</p>
            <p className="message-body">{message.body}</p>
          </article>
        ))}
        <Link to="/your-data">{i18n.t('medicalContact.export')}</Link>
      </section>
    </div>
  );
}
