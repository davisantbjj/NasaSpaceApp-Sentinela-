import { useState, type FormEvent } from 'react';
import { WrongPinError } from '../data/profilesRepo';
import { DEMO_PROFILES } from '../data/seed';
import { useNow } from '../hooks/useNow';
import { ROLE_LABELS } from '../lib/access';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';

const MAX_ATTEMPTS = 5;
const WAIT_MS = 30_000;

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
    if (!/^\d{4,6}$/.test(pin)) {
      setError(i18n.t('login.pinLength'));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await login(profileId, pin);
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

  return (
    <div className="page login">
      <header className="page-header">
        <span className="eyebrow">Sentinela</span>
        <h1>{i18n.t('login.title')}</h1>
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
                <span className="avatar" aria-hidden="true">{p.name.slice(0, 1)}</span>
                <span className="stack" style={{ gap: 0 }}>
                  {p.name}
                  <span className="small muted" style={{ fontWeight: 400 }}>{i18n.t(ROLE_LABELS[p.role])}</span>
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* Nome de usuário para o gerenciador de senhas associar o PIN ao perfil. */}
        <input type="text" name="username" autoComplete="username" value={selected?.name ?? ''} readOnly hidden />

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

        <details>
          <summary>{i18n.t('login.demoPins')}</summary>
          <ul className="summary-list">
            {DEMO_PROFILES.map((p) => (
              <li key={p.id}><span>{p.name} · {i18n.t(ROLE_LABELS[p.role])}</span><span className="num">{p.pin}</span></li>
            ))}
          </ul>
        </details>
      </form>

      <p className="small muted">
        {i18n.t('login.security')}
      </p>
    </div>
  );
}
