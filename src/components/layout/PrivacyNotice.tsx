import { useState } from 'react';
import { LGPD_URL, PRIVACY_SECTIONS } from '../../content/privacy';
import { useAppStore } from '../../store/useAppStore';

export function PrivacyExplanation() {
  return <>
    {PRIVACY_SECTIONS.map((section) => (
      <div className="stack" key={section.title}>
        <h2>{section.title}</h2>
        <p>{section.text}</p>
      </div>
    ))}
    <a href={LGPD_URL} target="_blank" rel="noreferrer">Consultar a LGPD — arts. 11 e 18 (abre outro site)</a>
  </>;
}

export function PrivacyNotice() {
  const acknowledge = useAppStore((s) => s.acknowledgePrivacy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function proceed() {
    setBusy(true);
    try { await acknowledge(); }
    catch { setError('Não foi possível registrar a leitura. Tente novamente.'); setBusy(false); }
  }
  return (
    <section className="page privacy-page" aria-labelledby="privacy-title">
      <header className="page-header">
        <span className="eyebrow">Antes de começar</span>
        <h1 id="privacy-title">Sua privacidade no Sentinela</h1>
        <p>Uma demonstração local com perfis simulados. Não digite informações pessoais ou de saúde reais.</p>
      </header>
      <div className="card stack">
        <PrivacyExplanation />
        {error && <p role="alert">{error}</p>}
        <button className="btn btn-primary" type="button" disabled={busy} onClick={proceed}>
          {busy ? 'Abrindo…' : 'Li o aviso — abrir demonstração'}
        </button>
      </div>
    </section>
  );
}
