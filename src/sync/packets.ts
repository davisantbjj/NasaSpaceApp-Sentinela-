import { ENVIRONMENTS } from '../content/indicators';
import type { Alert, AlertReview, CrewMember, DailyRecord, Environment, GroundPacket, PacketPayload } from '../types';

// Pacotes para a Terra. Funções puras, testadas em sync.test.ts.

export type PacketStatus = 'queued' | 'inTransit' | 'delivered';

export function buildPacketPayload(
  member: CrewMember,
  record: DailyRecord,
  alerts: Alert[],
  reviews: AlertReview[],
  environment: Environment,
): PacketPayload {
  return {
    crewName: member.name,
    crewRole: member.role,
    missionDay: record.missionDay,
    environment,
    recordedAt: record.createdAt,
    values: record.values,
    alerts: alerts.map(({ id, indicator, level, whatChanged }) => ({ id, indicator, level, whatChanged })),
    notes: reviews
      .filter((r) => r.date === record.date && r.note.trim() !== '')
      .map(({ indicator, note, seenBy, seenAt }) => ({ indicator, note, seenBy, seenAt })),
  };
}

export function packetPriority(payload: PacketPayload): GroundPacket['priority'] {
  return payload.alerts.some((a) => a.level === 'red') ? 'red' : 'normal';
}

export function packetStatus(packet: Pick<GroundPacket, 'sentAt' | 'deliverAt'>, now: number): PacketStatus {
  if (!packet.sentAt || !packet.deliverAt) return 'queued';
  return Date.parse(packet.deliverAt) <= now ? 'delivered' : 'inTransit';
}

// Pacotes que ainda não saíram, na ordem de envio: vermelho primeiro, depois o mais antigo.
export function transmitOrder<T extends Pick<GroundPacket, 'sentAt' | 'priority' | 'createdAt'>>(packets: T[]): T[] {
  return packets
    .filter((p) => !p.sentAt)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'red' ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function signalDelayMs(environment: Environment): number {
  return Math.round(ENVIRONMENTS[environment].signalDelaySeconds * 1000);
}
