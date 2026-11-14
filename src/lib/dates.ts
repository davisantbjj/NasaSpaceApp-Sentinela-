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
