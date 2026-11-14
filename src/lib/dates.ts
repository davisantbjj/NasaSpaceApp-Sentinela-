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

// "2026-11-12" vira "12/11/2026" (ou "12/11" na forma curta).
export function formatDate(date: string, short = false): string {
  const [y, m, d] = date.split('-');
  return short ? `${d}/${m}` : `${d}/${m}/${y}`;
}

// Data e hora local de um instante ISO: "14/11 13:05" (ou "14/11/2026 13:05:09" com segundos).
export function formatDateTime(iso: string, seconds = false): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = seconds ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? `:${pad(d.getSeconds())}` : ''}`;
  return `${date} ${time}`;
}

// "3 min", "12 s", "1 h 05 min": duração curta para atrasos e contagens.
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}
