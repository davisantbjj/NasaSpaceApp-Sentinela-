import { useEffect, useRef, useState } from 'react';
import type { ReactionTestDetails } from '../../types';

// Teste de reação (M4), na linha do Reaction Self Test da NASA: esperar o sinal e responder o mais
// rápido possível, repetidas vezes. O resultado é a média, em milissegundos, das respostas válidas.
// Acessibilidade: responde com toque, clique, espaço ou Enter; o sinal aparece uma vez por tentativa e
// fica parado até a resposta (nada pisca); o passo pode ser pulado por quem não pode fazer teste visual.

const FULL_SECONDS = 180; // 3 minutos, como o teste da NASA
const SHORT_SECONDS = 30; // versão curta, para a demonstração
const MIN_WAIT_MS = 1000; // espera aleatória antes de cada sinal
const MAX_WAIT_MS = 4000;
const TOO_FAST_MS = 100; // resposta antes disso conta como antecipação
const MIN_VALID = 3; // abaixo disso não dá resultado

type Phase = 'idle' | 'waiting' | 'signal' | 'done';

interface Props {
  value?: number; // resultado já salvo hoje, em ms
  details?: ReactionTestDetails;
  onResult: (ms: number | undefined, details?: ReactionTestDetails) => void;
}

export function ReactionTestStep({ value, details, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>(value !== undefined ? 'done' : 'idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [summary, setSummary] = useState<string | undefined>(
    value !== undefined ? `Resultado salvo hoje: ${value} ms. ${details ? `${details.mode === 'short' ? 'Modo curto' : 'Modo completo'}${details.completed ? '' : ', interrompido'}.` : 'Modo não registrado; fora da comparação pessoal.'}` : undefined,
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
      setSummary(`Poucas respostas válidas (${valid.length}). Refaça o teste ou pule o passo.`);
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
    setSummary(`Resultado: ${mean} ms (${resultDetails.mode === 'short' ? 'modo curto' : 'modo completo'}${completed ? '' : ', interrompido'}; ${valid.length} respostas válidas).`);
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

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="small muted">Teste demonstrativo, sem validação equivalente ao Reaction Self Test da NASA. Só testes completos de 3 minutos concluídos entram na comparação pessoal; o modo curto e testes interrompidos ficam para consulta.</p>
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
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                if (!event.repeat) respond();
              }
            }}
          >
            <span aria-live="assertive">{phase === 'signal' ? '● Toque agora!' : 'Aguarde o sinal…'}</span>
          </button>
          <div className="row-between">
            <span className="small muted num">Faltam {secondsLeft} s</span>
            <button type="button" className="btn btn-ghost" onClick={finish}>Encerrar agora</button>
          </div>
        </>
      ) : (
        <>
          {summary && <p className="notice"><span className="notice-icon" aria-hidden="true">i</span><span>{summary}</span></p>}
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => start(FULL_SECONDS)}>
              {phase === 'done' ? 'Refazer o teste (3 min)' : 'Começar o teste (3 min)'}
            </button>
            <button type="button" className="btn" onClick={() => start(SHORT_SECONDS)}>
              Versão curta (30 s, para demonstração)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
