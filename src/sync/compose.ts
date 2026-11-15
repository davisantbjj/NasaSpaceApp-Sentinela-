import { listPacketMeta, savePacket, saveStatus } from '../data/packetsRepo';
import { listRecords } from '../data/recordsRepo';
import { listReviews } from '../data/reviewsRepo';
import { buildCrewStatusSummary } from '../lib/access';
import { computeBaselines } from '../rules/baseline';
import { evaluateRecord } from '../rules/engine';
import { rules } from '../rules/rules';
import type { CrewMember, Environment, GroundPacket, MissionProfileId } from '../types';
import { buildPacketPayload, packetPriority } from './packets';

// Monta e sela, para um tripulante e um dia, o pacote da Terra e o resumo do comandante.
//
// Roda no aparelho de quem tem a chave do tripulante (o próprio, no check-in, ou o oficial
// médico, ao anotar uma conduta), enquanto a chave está aberta. O pacote é selado para o solo e o
// resumo para o comandante: quem montou não consegue abrir nenhum dos dois depois. A central só
// move essas caixas, sem precisar de chave nenhuma, então um vermelho nunca espera alguém entrar.
//
// O pacote e o resumo só saem depois que o registro (e as anotações) chegam à central (`waitsFor`).
export async function composeForDay(
  member: CrewMember,
  date: string,
  environment: Environment,
  cabinCo2Mmhg?: number,
  missionProfile?: MissionProfileId,
): Promise<void> {
  // `strict`: um registro ilegível faz falhar, em vez de mudar a linha de base em silêncio.
  const records = await listRecords(member.id, true);
  const index = records.findIndex((r) => r.date === date);
  if (index < 0) return;
  const history = records.slice(0, index + 1);
  const record = records[index];
  const baselines = computeBaselines(member.id, history, rules);
  const alerts = evaluateRecord(record, history.slice(0, -1), baselines, rules, environment, {
    startBodyMassKg: member.startBodyMassKg,
    cabinCo2Mmhg,
  });
  const reviews = (await listReviews(member.id)).filter((r) => r.date === date && r.note.trim() !== '');
  const payload = buildPacketPayload(member, record, alerts, reviews, environment, missionProfile);
  const waitsFor = [record.id, ...reviews.map((r) => r.id)];

  // Só reaproveita pacote que nunca tentou sair. Depois da primeira tentativa o conteúdo fica
  // congelado: se o servidor gravou e a resposta se perdeu, um reenvio com conteúdo diferente
  // e o mesmo id seria ignorado lá. Conteúdo novo ganha id novo.
  const pending = (await listPacketMeta(member.id)).find((p) => p.date === date && !p.sentAt && !p.attemptedAt);
  const createdAt = new Date().toISOString();
  const packet: GroundPacket = {
    id: pending?.id ?? `${member.id}_${date}_${createdAt}`,
    crewId: member.id,
    date,
    createdAt: pending?.createdAt ?? createdAt,
    priority: packetPriority(payload),
    waitsFor,
    payload,
  };
  await savePacket(packet);

  // O resumo do comandante vale para o registro mais recente.
  // Não considera alertas de saúde mental nem medicação (N9).
  if (index === records.length - 1) {
    await saveStatus(buildCrewStatusSummary(member.id, date, alerts), date, [record.id]);
  }
}
