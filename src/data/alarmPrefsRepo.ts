import { DEFAULT_ALARM_VOLUME, type AlarmVolume } from '../lib/alarm';
import { db } from './db';

// Volume dos alarmes: preferência do aparelho, sem dado de saúde.
const KEY = 'alarmVolume';

export async function loadAlarmVolume(): Promise<AlarmVolume> {
  try {
    const row = await db.preferences.get(KEY);
    if (!row) return { ...DEFAULT_ALARM_VOLUME };
    const parsed = JSON.parse(row.value) as Partial<AlarmVolume>;
    return {
      yellow: typeof parsed.yellow === 'number' ? parsed.yellow : DEFAULT_ALARM_VOLUME.yellow,
      red: typeof parsed.red === 'number' ? parsed.red : DEFAULT_ALARM_VOLUME.red,
    };
  } catch {
    return { ...DEFAULT_ALARM_VOLUME };
  }
}

export async function saveAlarmVolume(volume: AlarmVolume): Promise<void> {
  await db.preferences.put({ key: KEY, value: JSON.stringify(volume) });
}
