import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMedicalMessages, MEDICAL_MESSAGE_MAX_LENGTH, saveMedicalMessage } from '../data/messagesRepo';
import { useAppStore } from '../store/useAppStore';
import type { MedicalMessage } from '../types';

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
    }).catch(() => { if (active) setError('Não foi possível ler as mensagens locais.'); });
    return () => { active = false; };
  }, [member?.id]);

  if (!member) return null;
  const crewId = member.id;
  async function save() {
    setBusy(true); setError(''); setStatus('');
    try {
      await saveMedicalMessage(crewId, body);
      setMessages(await listMedicalMessages(crewId)); setBody('');
      setStatus('Mensagem salva somente neste dispositivo. Não foi enviada ao oficial médico. Mostre a tela a ele.');
    } catch { setError('Não foi possível salvar. Verifique o texto e tente novamente.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="page privacy-page">
      <header className="page-header">
        <span className="eyebrow">Comunicação por texto · {member.name}</span>
        <h1>Mensagem para o oficial médico</h1>
        <p>Se você não puder falar, escreva para mostrar a tela ao oficial médico de bordo.</p>
      </header>
      <p className="notice contact-notice"><strong>Sem envio ou atendimento por este app.</strong> Em uma situação urgente, acione a equipe de bordo pelo meio disponível. Não aguarde resposta nesta tela.</p>
      <form className="card stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <label htmlFor="medical-message">O que você gostaria de comunicar? Use apenas um exemplo fictício.</label>
        <textarea id="medical-message" className="message-input" rows={6} maxLength={MEDICAL_MESSAGE_MAX_LENGTH}
          value={body} disabled={busy} onChange={(event) => setBody(event.target.value)} aria-describedby="message-help" />
        <p id="message-help" className="small muted">Pode contar o que sentiu e quando começou. {body.length}/{MEDICAL_MESSAGE_MAX_LENGTH} caracteres. Não há envio, confirmação de leitura ou previsão de resposta.</p>
        <button className="btn btn-primary" type="submit" disabled={busy || !body.trim()}>{busy ? 'Salvando…' : 'Salvar mensagem local'}</button>
        <p role="status">{status}</p>
        {error && <p role="alert">{error}</p>}
      </form>
      <section className="card stack" aria-labelledby="saved-messages-title">
        <h2 id="saved-messages-title">Mensagens para mostrar à equipe</h2>
        {messages.length === 0 ? <p>Nenhuma mensagem salva neste perfil.</p> : [...messages].reverse().map((message) => (
          <article className="stack saved-message" key={message.id}>
            <p className="small muted">{new Date(message.createdAt).toLocaleString('pt-BR')} · Salva localmente — não enviada</p>
            <p className="message-body">{message.body}</p>
          </article>
        ))}
        <Link to="/your-data">Exportar ou excluir estas mensagens em Seus dados →</Link>
      </section>
    </div>
  );
}
