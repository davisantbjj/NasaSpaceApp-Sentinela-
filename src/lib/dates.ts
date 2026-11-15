import i18n from '../i18n';
import { formatNumber } from './format';

// Datas sempre como texto AAAA-MM-DD. Nada de fuso horário: as contas usam UTC só como calendário.
const DAY_MS = 86_400_000;

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return [y, m, d].join('-');
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

// O dia do lançamento é o dia de missão 1.
export function missionDay(missionStart: string, date: string): number {
  return diffDays(missionStart, date) + 1;
}

// Últimos `days` dias terminando em `end`, do mais antigo para o mais novo.
export function lastDays(end: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));
}

export function formatDate(date: string, short = false): string {
  const options: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
    ...(short ? {} : { year: 'numeric' }),
  };
  return new Intl.DateTimeFormat(i18n.language, options).format(new Date(`${date}T00:00:00Z`));
}

export function formatDateTime(iso: string, seconds = false): string {
  return new Intl.DateTimeFormat(i18n.language, {
    month: '2-digit',
    day: '2-digit',
    ...(seconds ? { year: 'numeric', second: '2-digit' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const unit = (value: number, unit: Intl.NumberFormatOptions['unit']) =>
    formatNumber(value, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: 0 });
  if (s < 60) return unit(s, 'second');
  const m = Math.floor(s / 60);
  if (m < 60) return unit(m, 'minute');
  return `${unit(Math.floor(m / 60), 'hour')} ${unit(m % 60, 'minute')}`;
}
