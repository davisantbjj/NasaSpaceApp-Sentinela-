import type { CrewMember } from '../types';
import { db } from './db';

export async function listCrew(): Promise<CrewMember[]> {
  return db.crew.toArray();
}

// Dados iniciais da missão que o oficial médico informa (N2 e N11). `undefined` apaga o valor.
export type CrewMissionData = Pick<CrewMember, 'startBodyMassKg' | 'priorCareerDoseMsv'>;

export async function updateCrewMissionData(crewId: string, data: CrewMissionData): Promise<void> {
  const updated = await db.crew.update(crewId, data);
  if (updated === 0) throw new Error('Tripulante não encontrado.');
}
