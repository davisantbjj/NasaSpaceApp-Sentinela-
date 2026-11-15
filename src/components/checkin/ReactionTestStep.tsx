import { useEffect, useRef, useState } from 'react';
import i18n from '../../i18n';
import type { ReactionTestDetails } from '../../types';

// Teste de reação (M4), na linha do Reaction Self Test da NASA: esperar o sinal e responder o mais
// rápido possível, repetidas vezes. O resultado é a média, em milissegundos, das respostas válidas.
// Acessibilidade: responde com toque, clique, espaço ou Enter, mesmo com o foco fora da área de resposta;
// o sinal aparece uma vez por tentativa, com pelo menos 1 s de espera entre sinais, e fica parado até a
// resposta (nada pisca mais de 3 vezes por segundo, WCAG 2.3.1); o passo pode ser pulado por quem não
// pode fazer um teste visual, e pular não conta como resultado ruim.

const FULL_SECONDS = 180; // 3 minutos, como o teste da NASA
const SHORT_SECONDS = 30; // versão curta, para a demonstração
const MIN_WAIT_MS = 1000; // espera aleatória antes de cada sinal
const MAX_WAIT_MS = 4000;
const TOO_FAST_MS = 100; // resposta antes disso conta como antecipação
const MIN_VALID = 3; // abaixo disso não dá resultado

type Phase = 'idle' | 'waiting' | 'signal' | 'done';

// "Modo curto, interrompido." ou, em registros antigos sem detalhes, "Modo não registrado…".
function savedDetails(details?: ReactionTestDetails): string {
  if (!details) return i18n.t('checkin:reaction.unknownMode');
  return i18n.t('checkin:reaction.savedMode', {
    mode: i18n.t(details.mode === 'short' ? 'checkin:reaction.modeShort' : 'checkin:reaction.modeFull'),
    interrupted: details.completed ? '' : i18n.t('checkin:reaction.interrupted'),
  });
}

interface Props {
  value?: number; // resultado já salvo hoje, em ms
  details?: ReactionTestDetails;
  onResult: (ms: number | undefined, details?: ReactionTestDetails) => void;
}

export function ReactionTestStep({ value, details, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>(value !== undefined ? 'done' : 'idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [summary, setSummary] = useState<{ key: string; params?: Record<string, unknown> } | undefined>(
    value !== undefined ? { key: 'checkin:reaction.saved', params: { value, details: savedDetails(details) } } : undefined,
  );

  const target = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const ticker = useRef<number | undefined>(undefined);
  const endAt = useRef(0);
  const startedAt = useRef(0);
  const duration = useRef(FULL_SECONDS);
  const signalAt = useRef(0);
  const times = useRef<number[]>([]);
  const early = useRef(0);
  const phaseRef = useRef<Phase>(phase);

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const stopTimers = () => {
    window.clearTimeout(timer.current);
    window.clearInterval(ticker.current);
  };

  useEffect(() => stopTimers, []);

  const finish = () => {
    stopTimers();
    const valid = times.current;
    go('done');
    if (valid.length < MIN_VALID) {
      setSummary({ key: 'checkin:reaction.tooFew', params: { valid: valid.length } });
      onResult(undefined);
      return;
    }
    const mean = Math.round(valid.reduce((sum, t) => sum + t, 0) / valid.length);
    const completed = performance.now() >= endAt.current;
    const resultDetails: ReactionTestDetails = {
      mode: duration.current === FULL_SECONDS ? 'full' : 'short',
      completed,
      elapsedSeconds: Math.round((performance.now() - startedAt.current) / 1000),
      validResponses: valid.length,
      anticipations: early.current,
    };
    setSummary({
      key: 'checkin:reaction.result',
      params: {
        mean,
        mode: i18n.t(resultDetails.mode === 'short' ? 'checkin:reaction.modeShortLower' : 'checkin:reaction.modeFullLower'),
        interrupted: completed ? '' : i18n.t('checkin:reaction.interrupted'),
        valid: valid.length,
      },
    });
    onResult(mean, resultDetails);
  };

  const scheduleSignal = () => {
    if (performance.now() >= endAt.current) {
      finish();
      return;
    }
    go('waiting');
    const wait = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    timer.current = window.setTimeout(() => {
      signalAt.current = performance.now();
      go('signal');
    }, wait);
  };

  const start = (seconds: number) => {
    stopTimers();
    times.current = [];
    early.current = 0;
    setSummary(undefined);
    onResult(undefined);
    startedAt.current = performance.now();
    duration.current = seconds;
    endAt.current = startedAt.current + seconds * 1000;
    setSecondsLeft(seconds);
    ticker.current = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000)));
      if (performance.now() >= endAt.current) finish();
    }, 250);
    scheduleSignal();
    // Leva o foco para a área de resposta, para quem usa teclado.
    window.setTimeout(() => target.current?.focus(), 0);
  };

  const respond = () => {
    if (phaseRef.current === 'waiting') {
      // Respondeu antes do sinal: antecipação. Recomeça a espera.
      early.current += 1;
      window.clearTimeout(timer.current);
      scheduleSignal();
    } else if (phaseRef.current === 'signal') {
      const reaction = performance.now() - signalAt.current;
      if (reaction < TOO_FAST_MS) early.current += 1;
      else times.current.push(reaction);
      scheduleSignal();
    }
  };

  const running = phase === 'waiting' || phase === 'signal';

  // Espaço ou Enter respondem em qualquer lugar da página enquanto o teste roda. Se o foco estiver
  // em outro controle (ex.: "Encerrar agora"), a tecla continua acionando aquele controle.
  useEffect(() => {
    if (!running) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const focused = event.target instanceof HTMLElement ? event.target : null;
      const otherControl = focused && focused !== target.current
        && focused.closest('button, a, input, select, textarea, [role=button]');
      if (otherControl) return;
      event.preventDefault();
      if (!event.repeat) respond();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="small muted">{i18n.t('checkin:reaction.disclaimer')}</p>
      {running ? (
        <>
          <button
            ref={target}
            type="button"
            className={phase === 'signal' ? 'btn btn-primary' : 'btn'}
            style={{ minHeight: 160, width: '100%', fontSize: '1.25rem' }}
            onPointerDown={(event) => {
              event.preventDefault();
              respond();
            }}
            aria-describedby="reaction-how"
          >
            <span aria-live="assertive">{phase === 'signal' ? i18n.t('checkin:reaction.tapNow') : i18n.t('checkin:reaction.wait')}</span>
          </button>
          <p id="reaction-how" className="small muted">{i18n.t('checkin:reaction.howToRespond')}</p>
          <div className="row-between">
            <span className="small muted num">{i18n.t('checkin:reaction.secondsLeft', { seconds: secondsLeft })}</span>
            <button type="button" className="btn btn-ghost" onClick={finish}>{i18n.t('checkin:reaction.stop')}</button>
          </div>
        </>
      ) : (
        <>
          {summary && <p className="notice"><span className="notice-icon" aria-hidden="true">i</span><span>{i18n.t(summary.key, summary.params ?? {})}</span></p>}
          <p className="small muted">{i18n.t('checkin:reaction.skipHint')}</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => start(FULL_SECONDS)}>
              {phase === 'done' ? i18n.t('checkin:reaction.retake') : i18n.t('checkin:reaction.start')}
            </button>
            <button type="button" className="btn" onClick={() => start(SHORT_SECONDS)}>
              {i18n.t('checkin:reaction.short')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
