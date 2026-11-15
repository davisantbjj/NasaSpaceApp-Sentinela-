import { describe, expect, it } from 'vitest';
import { canViewCrew, canViewCrewStatus, crewStatus, visibleRecords, visibleReviews } from '../lib/access';
import { createDataKey, keyFromPin, randomBytes, seal, unseal, unwrapDataKey, wrapDataKey } from '../lib/crypto';
import type { Alert, AlertReview, CrewMember, DailyRecord, Session } from '../types';
import { openAll } from '../data/openAll';
import { currentReview } from '../lib/reviews';
import { buildPacketPayload, packetPriority, packetStatus, signalDelayMs, transmitOrder } from './packets';

const FAST = 1_000; // menos iterações só para o teste não demorar

describe('criptografia', () => {
  it('abre a chave de dados com o PIN certo e cifra e decifra', async () => {
    const dataKey = await createDataKey();
    const salt = randomBytes(16);
    const wrapped = await wrapDataKey(dataKey, await keyFromPin('1234', salt, FAST));
    const opened = await unwrapDataKey(wrapped, await keyFromPin('1234', salt, FAST));
    const sealed = await seal(dataKey, { sleepHours: 5.2 });
    expect(await unseal(opened, sealed)).toEqual({ sleepHours: 5.2 });
  });

  it('recusa o PIN errado', async () => {
    const dataKey = await createDataKey();
    const salt = randomBytes(16);
    const wrapped = await wrapDataKey(dataKey, await keyFromPin('1234', salt, FAST));
    await expect(unwrapDataKey(wrapped, await keyFromPin('9999', salt, FAST))).rejects.toThrow();
  });

  it('a chave aberta com o PIN não pode ser exportada', async () => {
    const dataKey = await createDataKey();
    const salt = randomBytes(16);
    const pinKey = await keyFromPin('1234', salt, FAST);
    const opened = await unwrapDataKey(await wrapDataKey(dataKey, pinKey), pinKey);
    await expect(crypto.subtle.exportKey('raw', opened)).rejects.toThrow();
  });
});

const crew: Session = { profileId: 'ana', name: 'Ana', role: 'crew', crewId: 'ana' };
const officer: Session = { profileId: 'kenji', name: 'Kenji', role: 'medicalOfficer', crewId: 'kenji' };
const ground: Session = { profileId: 'ground', name: 'Solo', role: 'groundSurgeon' };

function record(date: string, synced: boolean): DailyRecord {
  return {
    id: `lia_${date}`, crewId: 'lia', date, missionDay: 1, values: {}, createdAt: `${date}T08:00:00`,
    syncedAt: synced ? `${date}T08:05:00` : undefined,
  };
}

describe('acesso', () => {
  it('tripulante vê só os próprios dados; oficial médico vê todos; solo não abre painel', () => {
    expect(canViewCrew(crew, 'ana')).toBe(true);
    expect(canViewCrew(crew, 'lia')).toBe(false);
    expect(canViewCrew(officer, 'lia')).toBe(true);
    expect(canViewCrew(ground, 'lia')).toBe(false);
  });

  it('comandante é tripulante: vê só os próprios dados e só o que chegou à central dos outros', () => {
    const commander: Session = { profileId: 'ana', name: 'Ana', role: 'commander', crewId: 'ana' };
    expect(canViewCrew(commander, 'ana')).toBe(true);
    expect(canViewCrew(commander, 'lia')).toBe(false);
    expect(canViewCrewStatus(commander)).toBe(true);
    expect(canViewCrewStatus(officer)).toBe(false);
    expect(canViewCrewStatus(crew)).toBe(false);
    const records = [record('2026-11-12', true), record('2026-11-13', false)];
    expect(visibleRecords(commander, 'lia', records)).toHaveLength(1);
    expect(visibleRecords(commander, 'ana', records)).toHaveLength(2);
  });

  it('status do comandante: só check-in de hoje e vermelho', () => {
    const records = [record('2026-11-12', true)];
    expect(crewStatus(records, ['yellow'], '2026-11-13')).toEqual({ checkinToday: false, hasRed: false });
    expect(crewStatus(records, ['yellow', 'red'], '2026-11-12')).toEqual({ checkinToday: true, hasRed: true });
  });

  it('quem não é o dono só vê o que chegou à central', () => {
    const records = [record('2026-11-12', true), record('2026-11-13', false)];
    expect(visibleRecords(officer, 'lia', records).map((r) => r.date)).toEqual(['2026-11-12']);
    const lia: Session = { profileId: 'lia', name: 'Lia', role: 'crew', crewId: 'lia' };
    expect(visibleRecords(lia, 'lia', records)).toHaveLength(2);
  });

  it('a anotação aparece para quem escreveu e, depois de sincronizada, para os outros', () => {
    const review: AlertReview = {
      id: 'a1', crewId: 'ana', date: '2026-11-13', indicator: 'sleepHours',
      seenByProfileId: 'kenji', seenBy: 'Kenji', seenAt: '2026-11-13T10:00:00', note: 'ok',
    };
    expect(visibleReviews(officer, [review])).toHaveLength(1);
    expect(visibleReviews(crew, [review])).toHaveLength(0);
    expect(visibleReviews(crew, [{ ...review, syncedAt: '2026-11-13T10:01:00' }])).toHaveLength(1);
  });
});

describe('pacotes para a Terra', () => {
  const member: CrewMember = { id: 'lia', name: 'Lia Santos', role: 'Engenheira de voo', missionStart: '2026-09-15', trackedIndicators: [] };
  const alert = (level: Alert['level']): Alert => ({
    id: `lia_2026-11-13_${level}`, crewId: 'lia', date: '2026-11-13', indicator: 'vision', region: 'head', level,
    trigger: 'generalRange', whatChanged: { key: 'alerts:change.general' }, reference: { key: '' }, whyItMatters: '', whatToDo: '',
    confidence: 'normal', notifyGround: level === 'red', sourceUrl: '',
  });

  it('vermelho no pacote vira prioridade vermelha', () => {
    const r = record('2026-11-13', true);
    expect(packetPriority(buildPacketPayload(member, r, [alert('yellow')], [], 'station'))).toBe('normal');
    expect(packetPriority(buildPacketPayload(member, r, [alert('red')], [], 'station'))).toBe('red');
  });

  it('só leva anotações do mesmo dia e com texto', () => {
    const base = { crewId: 'lia', indicator: 'vision' as const, seenByProfileId: 'kenji', seenBy: 'Kenji', seenAt: 'x' };
    const reviews: AlertReview[] = [
      { ...base, id: '1', date: '2026-11-13', note: 'Repetir amanhã' },
      { ...base, id: '2', date: '2026-11-13', note: '  ' },
      { ...base, id: '3', date: '2026-11-12', note: 'Outro dia' },
    ];
    const payload = buildPacketPayload(member, record('2026-11-13', true), [], reviews, 'station');
    expect(payload.notes.map((n) => n.note)).toEqual(['Repetir amanhã']);
  });

  it('leva o perfil da missão, o dia de N e a fase quando há perfil', () => {
    const r = record('2026-11-13', true);
    const payload = buildPacketPayload(member, r, [], [], 'transit', 'lunarFlyby');
    expect(payload.mission).toEqual({
      profile: 'lunarFlyby',
      day: r.missionDay,
      durationDays: 10,
      phaseLabelKey: 'common:missionProfiles.lunarFlyby.phases.transit',
    });
    expect(buildPacketPayload(member, r, [], [], 'station').mission).toBeUndefined();
  });

  it('a fila manda o vermelho primeiro e depois o mais antigo', () => {
    const packets = [
      { id: 'a', priority: 'normal' as const, createdAt: '2026-11-13T08:00:00' },
      { id: 'b', priority: 'red' as const, createdAt: '2026-11-13T09:00:00' },
      { id: 'c', priority: 'normal' as const, createdAt: '2026-11-13T07:00:00' },
      { id: 'd', priority: 'red' as const, createdAt: '2026-11-13T06:00:00', sentAt: '2026-11-13T06:01:00' },
    ];
    expect(transmitOrder(packets).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('situação do pacote segue o envio e o atraso', () => {
    const sent = Date.parse('2026-11-13T10:00:00Z');
    const p = { sentAt: new Date(sent).toISOString(), deliverAt: new Date(sent + signalDelayMs('mars')).toISOString() };
    expect(packetStatus({}, sent)).toBe('queued');
    expect(packetStatus(p, sent + 1000)).toBe('inTransit');
    expect(packetStatus(p, sent + signalDelayMs('mars'))).toBe('delivered');
    expect(signalDelayMs('station')).toBe(240);
  });
});

describe('alerta visto pelo oficial médico', () => {
  const record: DailyRecord = {
    id: 'lia_2026-11-14', crewId: 'lia', date: '2026-11-14', missionDay: 61, values: {}, createdAt: '2026-11-14T08:00:00',
  };
  const alert = (level: Alert['level']): Alert => ({
    id: 'lia_2026-11-14_heartRate', crewId: 'lia', date: '2026-11-14', indicator: 'heartRate', region: 'heart', level,
    trigger: 'generalRange', whatChanged: { key: '' }, reference: { key: '' }, whyItMatters: '', whatToDo: '',
    confidence: 'normal', notifyGround: false, sourceUrl: '',
  });
  const review: AlertReview = {
    id: 'lia_2026-11-14_heartRate', crewId: 'lia', date: '2026-11-14', indicator: 'heartRate',
    seenByProfileId: 'kenji', seenBy: 'Kenji', seenAt: '2026-11-14T09:00:00', note: '',
    level: 'yellow', recordCreatedAt: '2026-11-14T08:00:00',
  };

  it('vale para o mesmo registro e o mesmo nível', () => {
    expect(currentReview(alert('yellow'), [review], [record])).toBe(review);
  });

  it('o amarelo visto que vira vermelho volta a ser não visto', () => {
    expect(currentReview(alert('red'), [review], [record])).toBeUndefined();
  });

  it('check-in refeito no mesmo dia volta a ser não visto', () => {
    expect(currentReview(alert('yellow'), [review], [{ ...record, createdAt: '2026-11-14T10:30:00' }])).toBeUndefined();
  });
});

describe('linhas que não abrem', () => {
  it('são puladas sem derrubar as outras', async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const opened = await openAll(rows, async (r) => {
        if (r.id === 'b') throw new Error('chave errada');
        return r.id;
      });
      expect(opened).toEqual(['a', 'c']);
    } finally {
      console.warn = warn;
    }
  });
});
