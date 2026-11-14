import type { AlertReview, DailyRecord, Role, Session } from '../types';

// Regras de quem vê o quê. Funções puras, testadas em lib.test.ts.
//
// Tripulante: só os próprios dados.
// Comandante: é tripulante; dos outros vê só o status de check-in e se há alerta vermelho.
// Oficial médico de bordo: todos os tripulantes (ele também é tripulante).
// Médico do solo: não abre o painel de ninguém; vê só os pacotes que chegaram à Terra.

export const ROLE_LABELS: Record<Role, string> = {
  crew: 'Tripulante',
  commander: 'Comandante',
  medicalOfficer: 'Oficial médico de bordo',
  groundSurgeon: 'Médico do solo',
};

export function isOnBoard(session: Session): boolean {
  return session.role !== 'groundSurgeon';
}

export function isOwnData(session: Session, crewId: string): boolean {
  return session.crewId === crewId;
}

export function canViewCrew(session: Session, crewId: string): boolean {
  if (session.role === 'medicalOfficer') return true;
  if (session.role === 'crew' || session.role === 'commander') return isOwnData(session, crewId);
  return false;
}

// O comandante vê dos outros só o status (check-in e vermelho), nunca dados de saúde.
export function canViewCrewStatus(session: Session): boolean {
  return session.role === 'commander';
}

export interface CrewStatus {
  checkinToday: boolean;
  hasRed: boolean;
}

// Reduz um tripulante ao mínimo que o comandante pode ver. `records` já deve vir filtrado
// por visibleRecords (só o que chegou à central).
export function crewStatus(records: DailyRecord[], alertLevels: string[], today: string): CrewStatus {
  return {
    checkinToday: records.some((r) => r.date === today),
    hasRed: alertLevels.includes('red'),
  };
}

// O próprio tripulante vê tudo o que está no aparelho dele. Os outros só veem
// o que já chegou à central de bordo.
export function visibleRecords(session: Session, crewId: string, records: DailyRecord[]): DailyRecord[] {
  return isOwnData(session, crewId) ? records : records.filter((r) => r.syncedAt);
}

// A anotação do oficial médico aparece para quem escreveu na hora, e para os outros
// depois que chegou à central.
export function visibleReviews(session: Session, reviews: AlertReview[]): AlertReview[] {
  return reviews.filter((r) => r.seenByProfileId === session.profileId || r.syncedAt);
}
