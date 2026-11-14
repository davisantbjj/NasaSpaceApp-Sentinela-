import type { CrewMember } from '../types';
import { db } from './db';

export async function listCrew(): Promise<CrewMember[]> {
  return db.crew.toArray();
}
