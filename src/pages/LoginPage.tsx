import { useState, type FormEvent } from 'react';
import { WrongPinError } from '../data/profilesRepo';
import { DEMO_PROFILES } from '../data/seed';
import { useNow } from '../hooks/useNow';
import { ROLE_LABELS } from '../lib/access';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';
import { BrandMark } from '../components/layout/BrandMark';
import { LanguageSelect } from '../components/layout/LanguageSelect';
import { TextSizeToggle } from '../components/layout/TextSizeToggle';

const MAX_ATTEMPTS = 5;
const WAIT_MS = 30_000;

// PIN dos perfis de exemplo: na demonstração ele é usado por baixo dos panos, então basta
// escolher o perfil e confirmar. Perfis fora da demonstração continuam pedindo o PIN.
const demoPinOf = (profileId: string) => DEMO_PROFILES.find((p) => p.id === profileId)?.pin;

// Tentativas erradas por perfil, guardadas na sessão do navegador: recarregar a página ou
// trocar de perfil não zera a pausa. (Quem copia o banco testa PINs fora do app; esse limite
// está documentado em src/lib/crypto.ts.)
interface PinGuard {
  attempts: number;
  waitUntil: number;
}

const guardKey = (profileId: string) => `sentinela-pin-${profileId}`;

function readGuard(profileId: string): PinGuard {
  try {
    const raw = sessionStorage.getItem(guardKey(profileId));
    if (raw) return JSON.parse(raw) as PinGuard;
  } catch {
    // sem sessionStorage (janela privada, bloqueio do navegador): vale só a memória da tela
  }
  return { attempts: 0, waitUntil: 0 };
}

function writeGuard(profileId: string, guard: PinGuard) {
  try {
    sessionStorage.setItem(guardKey(profileId), JSON.stringify(guard));
  } catch {
    // idem
  }
}

// Entrada por perfil + PIN. Sem teste de memória nem quebra-cabeça, e o campo aceita colar
// e gerenciador de senhas (WCAG 3.3.8, autenticação acessível).
export function LoginPage() {
  const { profiles, login, lockNotice, lastProfileId } = useAppStore();
  const [profileId, setProfileId] = useState(lastProfileId ?? profiles[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [guard, setGuardState] = useState<PinGuard>(() => readGuard(profileId));
  const setGuard = (next: PinGuard) => {
    writeGuard(profileId, next);
    setGuardState(next);
  };
  const now = useNow(1000);
  const waiting = guard.waitUntil > now;
  const waitUntil = guard.waitUntil;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (waiting || busy) return;
    const value = demoPinOf(profileId) ?? pin;
    if (!/^\d{4,6}$/.test(value)) {
      setError(i18n.t('login.pinLength'));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await login(profileId, value);
      setGuard({ attempts: 0, waitUntil: 0 });
    } catch (e) {
      setPin('');
      if (!(e instanceof WrongPinError)) {
        setError(e instanceof Error ? e.message : String(e));
      } else if (guard.attempts + 1 >= MAX_ATTEMPTS) {
        setGuard({ attempts: 0, waitUntil: Date.now() + WAIT_MS });
        setError(i18n.t('login.wrongPinPaused', { count: MAX_ATTEMPTS }));
      } else {
        const left = MAX_ATTEMPTS - guard.attempts - 1;
        setGuard({ attempts: guard.attempts + 1, waitUntil: 0 });
        setError(i18n.t('login.wrongPinRemaining', { count: left }));
      }
    } finally {
      setBusy(false);
    }
  };

  const selected = profiles.find((p) => p.id === profileId);
  const isDemo = demoPinOf(profileId) !== undefined;

  return (
    <div className="page login">
      <aside className="login-introduction">
        <div className="login-brand"><BrandMark /><span>Sentinela</span></div>
        <div className="login-presentation">
          <span className="eyebrow">{i18n.t('login.onboard')}</span>
          <h2>{i18n.t('login.headline')}</h2>
          <p>{i18n.t('login.overview')}</p>
        </div>
        <ul className="login-features">
          <li><span className="num" aria-hidden="true">01</span><span>{i18n.t('login.featureRecords')}</span></li>
          <li><span className="num" aria-hidden="true">02</span><span>{i18n.t('login.featureAlerts')}</span></li>
          <li><span className="num" aria-hidden="true">03</span><span>{i18n.t('login.featureProfiles')}</span></li>
        </ul>
        <div className="login-preferences"><LanguageSelect /><TextSizeToggle /></div>
      </aside>
      <section className="login-access" aria-labelledby="login-title">
      <header className="page-header">
        <span className="eyebrow">{i18n.t('login.profile')}</span>
        <h1 id="login-title">{i18n.t('login.title')}</h1>
        <p className="muted">{i18n.t('login.intro')}</p>
      </header>

      {lockNotice && (
        <p className="notice" role="status">
          <span className="notice-icon" aria-hidden="true">🔒</span>
          <span>{lockNotice}</span>
        </p>
      )}

      <form className="card stack" style={{ gap: 18 }} onSubmit={submit}>
        <fieldset className="options list login-profiles">
          <legend className="visually-hidden">{i18n.t('login.profile')}</legend>
          {profiles.map((p) => (
            <label key={p.id} className="option">
              <input
                type="radio"
                name="profile"
                value={p.id}
                checked={profileId === p.id}
                onChange={() => { setProfileId(p.id); setGuardState(readGuard(p.id)); setError(undefined); setPin(''); }}
              />
              <span className="option-face login-face">
                <span className="avatar" aria-hidden="true">{p.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className="stack" style={{ gap: 0 }}>
                  {p.name}
                  <span className="small muted" style={{ fontWeight: 400 }}>{i18n.t(ROLE_LABELS[p.role])}</span>
                </span>
                <span className="login-profile-check" aria-hidden="true">✓</span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* Nome de usuário para o gerenciador de senhas associar o PIN ao perfil. */}
        <input type="text" name="username" autoComplete="username" value={selected?.name ?? ''} readOnly hidden />

        {isDemo ? (
          <div className="field">
            <button type="submit" className="btn btn-primary" disabled={busy || waiting}>
              {busy ? i18n.t('login.opening') : i18n.t('login.enter')}
            </button>
            {error && <p className="field-error" role="alert">{error}</p>}
            {waiting && <p className="small muted num">{i18n.t('login.retryIn', { seconds: Math.ceil((waitUntil - now) / 1000) })}</p>}
          </div>
        ) : (
        <div className="field">
          <label htmlFor="pin">{i18n.t('login.pin', { name: selected?.name ?? i18n.t('login.access') })}</label>
          <div className="field-input">
            <input
              id="pin"
              className="input"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'pin-error' : undefined}
              disabled={waiting}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || waiting || pin.length < 4}>
              {busy ? i18n.t('login.opening') : i18n.t('login.enter')}
            </button>
          </div>
          {error && <p id="pin-error" className="field-error" role="alert">{error}</p>}
          {waiting && <p className="small muted num">{i18n.t('login.retryIn', { seconds: Math.ceil((waitUntil - now) / 1000) })}</p>}
        </div>
        )}
      </form>

      <p className="small muted">
        {i18n.t('login.security')}
      </p>
      </section>
    </div>
  );
}
