import { create } from 'zustand';
import { playAlarmPattern, speak, vibrate } from './alarmSound';

// Alarmes do app: uma função só, `raiseAlarm`, para alertas de saúde e para lembretes
// (horário de check-in, dose, meta semanal). Assim existe um banner só, com o mesmo som e as
// mesmas regras de silenciar e confirmar.
//
// - Amarelo: toque curto, uma vez.
// - Vermelho: três bipes repetidos a cada REPEAT_MS até alguém silenciar ou confirmar.
// - Silenciar para o som, mas o banner fica. O banner só sai quando alguém confirma.
// - Todo som tem equivalente visual (banner, contador no título da aba) e vibração no celular.

export type AlarmLevel = 'yellow' | 'red';

export interface Alarm {
  id: string;
  level: AlarmLevel;
  text: string; // o que aparece no banner
  link?: string; // rota com o detalhe, ex.: /alerts
  raisedAt: string;
  silenced: boolean;
}

export interface RaiseOptions {
  id?: string; // mesmo id = mesmo alarme: não toca de novo nem volta depois de confirmado
  link?: string;
  speech?: { text: string; lang: string }; // voz curta e genérica, sem dado de saúde
}

// Volume de 0 a 1 por nível, escolhido em Missão (WCAG 1.4.2).
export type AlarmVolume = Record<AlarmLevel, number>;

export const DEFAULT_ALARM_VOLUME: AlarmVolume = { yellow: 0.6, red: 0.8 };
export const REPEAT_MS = 2500;

interface AlarmState {
  alarms: Alarm[];
  volume: AlarmVolume;
  // Ids confirmados nesta aba. Ficam só na memória: guardar no aparelho revelaria, sem cifra,
  // que houve um alerta de certo tipo num certo dia.
  acknowledged: string[];
}

export const useAlarmStore = create<AlarmState>(() => ({
  alarms: [],
  volume: { ...DEFAULT_ALARM_VOLUME },
  acknowledged: [],
}));

let counter = 0;
let repeatTimer: ReturnType<typeof setInterval> | undefined;

// Vermelho ativo e não silenciado: repete o som e a vibração.
function sounding(): Alarm | undefined {
  return useAlarmStore.getState().alarms.find((a) => a.level === 'red' && !a.silenced);
}

function updateRepeat() {
  const shouldRepeat = !!sounding();
  if (shouldRepeat && repeatTimer === undefined) {
    repeatTimer = setInterval(() => {
      if (!sounding()) return updateRepeat();
      playAlarmPattern('red', useAlarmStore.getState().volume.red);
      vibrate('red');
    }, REPEAT_MS);
  } else if (!shouldRepeat && repeatTimer !== undefined) {
    clearInterval(repeatTimer);
    repeatTimer = undefined;
  }
}

export function raiseAlarm(level: AlarmLevel, text: string, options: RaiseOptions = {}): string {
  const id = options.id ?? `alarm-${Date.now()}-${(counter += 1)}`;
  const state = useAlarmStore.getState();
  if (state.acknowledged.includes(id)) return id;

  const existing = state.alarms.find((a) => a.id === id);
  if (existing) {
    // Mesmo alarme ainda na tela: só atualiza o texto, sem tocar de novo.
    useAlarmStore.setState({ alarms: state.alarms.map((a) => (a.id === id ? { ...a, text, link: options.link } : a)) });
    return id;
  }

  const alarm: Alarm = { id, level, text, link: options.link, raisedAt: new Date().toISOString(), silenced: false };
  // Vermelho primeiro, depois o mais recente.
  const alarms = [alarm, ...state.alarms].sort((a, b) => (a.level === b.level ? 0 : a.level === 'red' ? -1 : 1));
  useAlarmStore.setState({ alarms });

  const volume = state.volume[level];
  playAlarmPattern(level, volume);
  vibrate(level);
  if (options.speech) speak(options.speech.text, options.speech.lang, volume);
  updateRepeat();
  return id;
}

// Para o som de todos os alarmes na tela. Os banners continuam.
export function silenceAlarms(): void {
  const { alarms } = useAlarmStore.getState();
  useAlarmStore.setState({ alarms: alarms.map((a) => ({ ...a, silenced: true })) });
  updateRepeat();
}

// Alguém confirmou: o banner sai e o mesmo id não volta nesta aba.
export function acknowledgeAlarm(id: string): void {
  const { alarms, acknowledged } = useAlarmStore.getState();
  useAlarmStore.setState({
    alarms: alarms.filter((a) => a.id !== id),
    acknowledged: acknowledged.includes(id) ? acknowledged : [...acknowledged, id],
  });
  updateRepeat();
}

// Ao bloquear o app: tira tudo da tela e para o som, sem contar como confirmado.
export function clearAlarms(): void {
  useAlarmStore.setState({ alarms: [] });
  updateRepeat();
}

export function setAlarmVolume(volume: Partial<AlarmVolume>): void {
  const current = useAlarmStore.getState().volume;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  useAlarmStore.setState({
    volume: {
      yellow: clamp(volume.yellow ?? current.yellow),
      red: clamp(volume.red ?? current.red),
    },
  });
}

// Botão "Testar som" em Missão.
export function testAlarmSound(level: AlarmLevel): void {
  playAlarmPattern(level, useAlarmStore.getState().volume[level]);
}
