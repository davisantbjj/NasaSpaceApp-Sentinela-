import type { Settings } from '../types';
import { db } from './db';

export async function loadSettings(): Promise<Settings | undefined> {
  return (await db.settings.get('app'))?.value;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ key: 'app', value: settings });
}
