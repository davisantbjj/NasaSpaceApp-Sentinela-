import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as sound from './alarmSound';
import {
  acknowledgeAlarm, clearAlarms, DEFAULT_ALARM_VOLUME, raiseAlarm, REPEAT_MS, setAlarmVolume, silenceAlarms, useAlarmStore,
} from './alarm';

describe('alarmes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAlarmStore.setState({ alarms: [], acknowledged: [], volume: { ...DEFAULT_ALARM_VOLUME } });
  });
  afterEach(() => {
    clearAlarms();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('amarelo toca uma vez e fica no banner', () => {
    const play = vi.spyOn(sound, 'playAlarmPattern');
    raiseAlarm('yellow', 'Sono está em 5,2 h', { id: 'a' });
    vi.advanceTimersByTime(REPEAT_MS * 3);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('yellow', DEFAULT_ALARM_VOLUME.yellow);
    expect(useAlarmStore.getState().alarms.map((a) => a.id)).toEqual(['a']);
  });

  it('vermelho repete até silenciar, e o banner continua até confirmar', () => {
    const play = vi.spyOn(sound, 'playAlarmPattern');
    raiseAlarm('red', 'Dor no peito', { id: 'r' });
    vi.advanceTimersByTime(REPEAT_MS * 2);
    expect(play).toHaveBeenCalledTimes(3);

    silenceAlarms();
    vi.advanceTimersByTime(REPEAT_MS * 3);
    expect(play).toHaveBeenCalledTimes(3);
    expect(useAlarmStore.getState().alarms).toHaveLength(1);

    acknowledgeAlarm('r');
    expect(useAlarmStore.getState().alarms).toHaveLength(0);
  });

  it('confirmar também para o som do vermelho', () => {
    const play = vi.spyOn(sound, 'playAlarmPattern');
    raiseAlarm('red', 'Falta de ar', { id: 'r' });
    acknowledgeAlarm('r');
    vi.advanceTimersByTime(REPEAT_MS * 3);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('o mesmo id não toca de novo e não volta depois de confirmado', () => {
    const play = vi.spyOn(sound, 'playAlarmPattern');
    raiseAlarm('yellow', 'texto 1', { id: 'a' });
    raiseAlarm('yellow', 'texto 2', { id: 'a' });
    expect(play).toHaveBeenCalledTimes(1);
    expect(useAlarmStore.getState().alarms[0].text).toBe('texto 2');

    acknowledgeAlarm('a');
    raiseAlarm('yellow', 'texto 3', { id: 'a' });
    expect(useAlarmStore.getState().alarms).toHaveLength(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('vermelho aparece antes do amarelo', () => {
    raiseAlarm('yellow', 'amarelo', { id: 'y' });
    raiseAlarm('red', 'vermelho', { id: 'r' });
    expect(useAlarmStore.getState().alarms.map((a) => a.level)).toEqual(['red', 'yellow']);
  });

  it('volume zero não toca, mas o banner aparece', () => {
    const play = vi.spyOn(sound, 'playAlarmPattern');
    setAlarmVolume({ red: 0 });
    raiseAlarm('red', 'vermelho', { id: 'r' });
    expect(play).toHaveBeenCalledWith('red', 0);
    expect(useAlarmStore.getState().alarms).toHaveLength(1);
  });

  it('bloquear o app tira os banners sem contar como confirmado', () => {
    raiseAlarm('yellow', 'amarelo', { id: 'y' });
    clearAlarms();
    expect(useAlarmStore.getState().alarms).toHaveLength(0);
    raiseAlarm('yellow', 'amarelo', { id: 'y' });
    expect(useAlarmStore.getState().alarms).toHaveLength(1);
  });
});
