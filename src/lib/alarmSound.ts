// Sons dos alarmes gerados com Web Audio, sem arquivos de som.
// Amarelo: toque curto (dois bipes). Vermelho: três bipes, repetidos pelo módulo de alarmes até
// alguém silenciar ou confirmar. Sem Web Audio (testes, navegador antigo), nada toca e o banner
// continua sendo o aviso.

import type { AlarmLevel } from './alarm';

let context: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  try {
    context ??= new Ctor();
    // O navegador só libera o som depois de um gesto da pessoa (o clique em "Entrar" ou "Salvar").
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return undefined;
  }
}

function beep(ctx: AudioContext, start: number, frequency: number, seconds: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  // Subida e descida curtas para o som não estalar.
  const peak = 0.4 * volume;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.015);
  gain.gain.setValueAtTime(peak, start + seconds - 0.03);
  gain.gain.linearRampToValueAtTime(0, start + seconds);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.02);
}

// Padrões diferentes por nível, para não depender só da altura do som.
const PATTERNS: Record<AlarmLevel, { frequency: number; seconds: number; gap: number }[]> = {
  yellow: [
    { frequency: 660, seconds: 0.14, gap: 0.1 },
    { frequency: 660, seconds: 0.14, gap: 0 },
  ],
  red: [
    { frequency: 880, seconds: 0.18, gap: 0.08 },
    { frequency: 660, seconds: 0.18, gap: 0.08 },
    { frequency: 880, seconds: 0.18, gap: 0 },
  ],
};

// Toca o padrão do nível uma vez. `volume` vai de 0 a 1; 0 não toca.
export function playAlarmPattern(level: AlarmLevel, volume: number): void {
  if (volume <= 0) return;
  const ctx = audio();
  if (!ctx) return;
  let at = ctx.currentTime + 0.02;
  for (const note of PATTERNS[level]) {
    beep(ctx, at, note.frequency, note.seconds, Math.min(1, volume));
    at += note.seconds + note.gap;
  }
}

// Vibração no celular, quando o aparelho permite. Não existe no iPhone.
export function vibrate(level: AlarmLevel): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(level === 'red' ? [300, 150, 300, 150, 300] : [200]);
  } catch {
    // Sem permissão ou sem motor de vibração: o banner continua sendo o aviso.
  }
}

// Voz curta e sem dado de saúde ("Alerta vermelho no Sentinela"), porque numa cabine compartilhada
// todos ouvem. Os detalhes ficam só na tela.
export function speak(text: string, lang: string, volume: number): void {
  if (volume <= 0 || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.volume = Math.min(1, volume);
    window.speechSynthesis.speak(utterance);
  } catch {
    // Sem voz disponível: o banner e o som continuam.
  }
}
