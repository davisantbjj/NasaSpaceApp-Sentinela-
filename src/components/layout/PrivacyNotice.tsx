import { useState } from 'react';
import { LGPD_URL, PRIVACY_SECTIONS } from '../../content/privacy';
import { useAppStore } from '../../store/useAppStore';
import i18n from '../../i18n';
import { LanguageSelect } from './LanguageSelect';
import { TextSizeToggle } from './TextSizeToggle';
import { BackgroundMotionToggle } from './AmbientBackground';

export function PrivacyExplanation() {
  return <>
    {PRIVACY_SECTIONS.map((section) => (
      <div className="stack" key={section.titleKey}>
        <h2>{i18n.t(section.titleKey)}</h2>
        <p>{i18n.t(section.textKey)}</p>
      </div>
    ))}
    <a href={LGPD_URL} target="_blank" rel="noreferrer">{i18n.t('privacy.law')}</a>
  </>;
}

export function PrivacyNotice() {
  const acknowledge = useAppStore((s) => s.acknowledgePrivacy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function proceed() {
    setBusy(true);
    try { await acknowledge(); }
    catch { setError(i18n.t('privacy.readError')); setBusy(false); }
  }
  return (
    <section className="page privacy-page" aria-labelledby="privacy-title">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('privacy.before')}</span>
        <h1 id="privacy-title">{i18n.t('privacy.title')}</h1>
        <p>{i18n.t('privacy.intro')}</p>
      </header>
      <div className="card stack privacy-document">
        <div className="row privacy-preferences">
          <LanguageSelect />
          <TextSizeToggle />
          <BackgroundMotionToggle />
        </div>
        <PrivacyExplanation />
        {error && <p role="alert">{error}</p>}
        <button className="btn btn-primary" type="button" disabled={busy} onClick={proceed}>
          {busy ? i18n.t('privacy.opening') : i18n.t('privacy.acknowledge')}
        </button>
      </div>
    </section>
  );
}
