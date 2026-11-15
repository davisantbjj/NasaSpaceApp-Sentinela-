import { create } from 'zustand';
import { listAccess, logAccess } from '../data/accessLogRepo';
import { listCrew, updateCrewMissionData, type CrewMissionData } from '../data/crewRepo';
import { clearSessionKeys, setSessionKeys } from '../data/keyring';
import { listPacketMeta, listPacketsForGround, listStatusesForCommander, type PacketMeta } from '../data/packetsRepo';
import { listProfiles, loadPublicKeys, unlockProfile } from '../data/profilesRepo';
import { listRecords, saveRecord } from '../data/recordsRepo';
import { acknowledgePrivacyNotice, hasAcknowledgedPrivacyNotice } from '../data/privacyRepo';
import { listReviews, saveReview } from '../data/reviewsRepo';
import { resetDemo, seedIfEmpty } from '../data/seed';
import { loadSettings, saveSettings } from '../data/settingsRepo';
import { MISSION_PROFILES, missionStartOf, phaseOnDay } from '../content/missions';
import { currentReview } from '../lib/reviews';
import { canEditMission, canViewCrew, canViewCrewStatus, crewStatus, isOwnData, visibleRecords, visibleReviews } from '../lib/access';
import { missionDay, todayISO } from '../lib/dates';
import { worstLevel } from '../lib/levels';
import { computeBaselines } from '../rules/baseline';
import { findCorrelations } from '../rules/correlation';
import { evaluateRecord, levelByRegion } from '../rules/engine';
import { rules } from '../rules/rules';
import type { OutboxItem } from '../sync/adapters';
import { atCentralChecker, deliverInTransitNow, listOutbox, runSyncCycle } from '../sync/central';
import { composeForDay } from '../sync/compose';
import { packetStatus } from '../sync/packets';
import type {
  AccessLogEntry, Alert, AlertReview, Baseline, BodyRegion, Correlation, CrewMember, DailyRecord, DailyValues,
  Environment, GroundPacket, IndicatorId, Level, MissionProfileId, Profile, Session, Settings,
} from '../types';

interface Derived {
  baselines: Baseline[];
  alerts: Alert[]; // alertas do registro mais recente do tripulante na tela
  correlations: Correlation[];
  regionLevels: Record<BodyRegion, Level>;
}

export interface CrewOverview {
  member: CrewMember;
  level: Level;
  alerts: Alert[];
  lastDate?: string;
  checkinToday: boolean;
  openAlerts: number; // alertas ainda não marcados como vistos
}

// O que o comandante vê de cada colega: nada além disto.
export interface CrewStatusRow {
  id: string;
  name: string;
  role: string; // cargo na missão
  checkinToday: boolean;
  hasRed: boolean;
}

export interface SyncState {
  outbox: OutboxItem[];
  packets: PacketMeta[]; // a bordo: só metadados (os pacotes vão selados para o solo)
  delivered: GroundPacket[]; // médico do solo: pacotes que chegaram à Terra, abertos
  lastRunAt?: string;
  lastError?: string;
}

interface AppState extends Derived {
  ready: boolean;
  privacyAcknowledged: boolean;
  error?: string;
  crew: CrewMember[];
  profiles: Profile[];
  session: Session | null;
  lockNotice?: string;
  lastProfileId?: string;
  settings: Settings;
  records: DailyRecord[]; // histórico visível do tripulante na tela, do mais antigo para o mais novo
  reviews: AlertReview[];
  sync: SyncState;
  loadCrew: () => Promise<void>;
  login: (profileId: string, pin: string) => Promise<void>;
  lock: (notice?: string) => void;
  switchCrew: (crewId: string) => Promise<void>;
  setEnvironment: (environment: Environment) => Promise<void>;
  setCabinCo2Mmhg: (value: number | undefined) => Promise<void>;
  setCrewMissionData: (crewId: string, data: CrewMissionData) => Promise<void>;
  setMissionProfile: (profile: MissionProfileId | undefined) => Promise<void>;
  applyPhaseEnvironment: () => Promise<void>;
  saveCheckin: (values: DailyValues) => Promise<Alert[]>;
  setReminder: (indicator: IndicatorId, everyDays: number) => Promise<void>;
  reviewAlert: (alert: Alert, note: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  syncNow: (sendAll?: boolean) => Promise<void>;
  deliverNow: () => Promise<void>;
  loadCrewOverview: () => Promise<CrewOverview[]>;
  loadCrewStatus: () => Promise<CrewStatusRow[]>;
  recordGroundAccess: (crewId: string, what: string) => Promise<void>;
  loadAccessLog: () => Promise<AccessLogEntry[]>;
  acknowledgePrivacy: () => Promise<void>;
}

// Único ponto que junta dados, linha de base e motor de regras.
function derive(crewId: string, records: DailyRecord[], environment: Environment, member?: CrewMember, cabinCo2Mmhg?: number): Derived {
  const baselines = computeBaselines(crewId, records, rules);
  const latest = records[records.length - 1];
  const alerts = latest
    ? evaluateRecord(latest, records.slice(0, -1), baselines, rules, environment, {
        startBodyMassKg: member?.startBodyMassKg,
        cabinCo2Mmhg,
      })
    : [];
  return {
    baselines,
    alerts,
    correlations: findCorrelations(records, baselines, rules),
    regionLevels: levelByRegion(alerts),
  };
}

// Ambiente da fase de hoje no perfil de missão, contando do início da missão.
function phaseEnvironment(profileId: MissionProfileId, crew: CrewMember[]): Environment {
  const start = missionStartOf(crew);
  const day = start ? missionDay(start, todayISO()) : 1;
  return phaseOnDay(MISSION_PROFILES[profileId], day).environment;
}

const EMPTY_SETTINGS: Settings = { environment: 'station', activeCrewId: '', reminders: [], cabinCo2Mmhg: 2.3 };

const EMPTY_DATA = { records: [], reviews: [], sync: { outbox: [], packets: [], delivered: [] }, ...derive('', [], 'station') };

export const useAppStore = create<AppState>((set, get) => {
  function requireSession(): Session {
    const { session } = get();
    if (!session) throw new Error('Sessão bloqueada.');
    return session;
  }

  function requireMissionEditor(): void {
    if (!canEditMission(requireSession())) throw new Error('Só o comandante e o oficial médico alteram os dados da missão.');
  }

  // Cada entrada e cada bloqueio abrem uma "época" nova. Uma carga que começou numa época
  // e termina em outra é descartada: assim dados de uma sessão nunca caem na tela de outra.
  let epoch = 0;
  const stillCurrent = (started: number) => started === epoch && !!get().session;
  function assertCurrent(started: number) {
    if (!stillCurrent(started)) throw new Error('Sessão bloqueada.');
  }

  // Carrega o tripulante na tela, só com o que a sessão pode ver.
  async function loadActive(settings: Settings) {
    const started = epoch;
    const session = get().session;
    const crewId = settings.activeCrewId;
    if (!session || !canViewCrew(session, crewId)) {
      set({ settings, records: [], reviews: [], ...derive(crewId, [], settings.environment, get().crew.find((c) => c.id === crewId), settings.cabinCo2Mmhg) });
      return;
    }
    const [records, reviews] = await Promise.all([listRecords(crewId), listReviews(crewId)]);
    if (!stillCurrent(started)) return;
    const visible = visibleRecords(session, crewId, records);
    set({
      settings,
      records: visible,
      reviews: visibleReviews(session, reviews),
      ...derive(crewId, visible, settings.environment, get().crew.find((c) => c.id === crewId), settings.cabinCo2Mmhg),
    });
  }

  async function updateSettings(patch: Partial<Settings>) {
    const settings = { ...get().settings, ...patch };
    await saveSettings(settings);
    return settings;
  }

  // A fila do aparelho e os pacotes, só o que o papel pode ver. A bordo ninguém abre pacote:
  // eles vão selados para o solo, então a tela de sincronização usa só os metadados.
  // Tripulante e comandante veem só a própria fila; o oficial médico vê a de todos; o médico do
  // solo abre só os pacotes que já chegaram à Terra e não vê a fila de bordo.
  async function loadSyncState(patch: Partial<SyncState> = {}) {
    const started = epoch;
    const session = get().session;
    if (!session) return;
    let outbox: OutboxItem[] = [];
    let packets: PacketMeta[] = [];
    let delivered: GroundPacket[] = [];
    if (session.role === 'groundSurgeon') {
      const now = Date.now();
      delivered = (await listPacketsForGround()).filter((p) => packetStatus(p, now) === 'delivered');
    } else if (session.role === 'medicalOfficer') {
      [outbox, packets] = await Promise.all([listOutbox(), listPacketMeta()]);
    } else if (session.crewId) {
      const own = session.crewId;
      [outbox, packets] = await Promise.all([
        listOutbox().then((items) => items.filter((i) => i.crewId === own)),
        listPacketMeta(own),
      ]);
    }
    if (!stillCurrent(started)) return;
    set({ sync: { ...get().sync, outbox, packets, delivered, ...patch } });
  }

  // Monta e sela o pacote do solo e o resumo do comandante enquanto a chave está aberta.
  // Uma falha aqui não desfaz o check-in nem a anotação: aparece na tela de sincronização.
  async function compose(crewId: string, date: string) {
    const member = get().crew.find((c) => c.id === crewId);
    if (!member) return;
    try {
      const { environment, cabinCo2Mmhg, missionProfile } = get().settings;
      await composeForDay(member, date, environment, cabinCo2Mmhg, missionProfile);
    } catch (error) {
      console.error('Sentinela: não foi possível montar o pacote para a Terra', error);
      set({ sync: { ...get().sync, lastError: 'Não foi possível montar o pacote para a Terra deste registro.' } });
    }
  }

  // Um ciclo por vez. Pedido que chega com um ciclo rodando não se perde: roda logo depois,
  // e "enviar tudo" vale se qualquer pedido pediu.
  let running: Promise<void> | null = null;
  let pending: { sendAll: boolean } | null = null;

  async function cycle(sendAll: boolean) {
    const started = epoch;
    try {
      const result = await runSyncCycle(get().settings, sendAll);
      if (!stillCurrent(started)) return;
      // Chegou coisa nova na central: quem está vendo outro tripulante pode ter dado novo.
      if (result.pushed > 0) await loadActive(get().settings);
      await loadSyncState({ lastRunAt: new Date().toISOString(), lastError: undefined });
    } catch (error) {
      if (!stillCurrent(started)) return; // bloqueou no meio: o próximo login retoma
      console.error('Sentinela: falha na sincronização', error);
      set({ sync: { ...get().sync, lastError: error instanceof Error ? error.message : String(error) } });
    }
  }

  return {
    ready: false,
    privacyAcknowledged: false,
    crew: [],
    profiles: [],
    session: null,
    settings: EMPTY_SETTINGS,
    ...EMPTY_DATA,

    loadCrew: async () => {
      try {
        if (!await hasAcknowledgedPrivacyNotice()) {
          set({ ready: true, privacyAcknowledged: false, error: undefined });
          return;
        }
        await seedIfEmpty();
        const [crew, profiles, saved] = await Promise.all([listCrew(), listProfiles(), loadSettings()]);
        let settings: Settings = { ...EMPTY_SETTINGS, ...saved };
        // A fase da missão define o ambiente, a não ser que alguém tenha trocado à mão.
        if (settings.missionProfile && !settings.environmentManual) {
          const environment = phaseEnvironment(settings.missionProfile, crew);
          if (environment !== settings.environment) {
            settings = { ...settings, environment };
            await saveSettings(settings);
          }
        }
        set({ crew, profiles, settings, ready: true, privacyAcknowledged: true, error: undefined });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : String(error) });
      }
    },

    login: async (profileId, pin) => {
      const { profile, keys } = await unlockProfile(profileId, pin);
      const publicKeys = await loadPublicKeys();
      epoch += 1;
      setSessionKeys({ ...keys, ...publicKeys });
      const session: Session = { profileId: profile.id, name: profile.name, role: profile.role, crewId: profile.crewId };
      set({ session, lockNotice: undefined, lastProfileId: profile.id });
      // Ao entrar, cada um começa pelos próprios dados.
      const crewId = profile.crewId ?? get().crew[0]?.id ?? '';
      await loadActive(await updateSettings({ activeCrewId: crewId }));
      void get().syncNow();
    },

    lock: (notice) => {
      epoch += 1;
      clearSessionKeys();
      set({ session: null, lockNotice: notice, ...EMPTY_DATA });
    },

    acknowledgePrivacy: async () => {
      await acknowledgePrivacyNotice();
      set({ ready: false });
      await get().loadCrew();
    },


    switchCrew: async (crewId) => {
      const session = requireSession();
      if (!canViewCrew(session, crewId)) return;
      if (!isOwnData(session, crewId)) {
        await logAccess({
          subjectCrewId: crewId,
          actorProfileId: session.profileId,
          actorName: session.name,
          actorRole: session.role,
          what: 'Abriu o painel',
        });
      }
      await loadActive(await updateSettings({ activeCrewId: crewId }));
    },

    setEnvironment: async (environment) => {
      requireMissionEditor();
      // Com perfil de missão, trocar à mão vale até alguém voltar ao ambiente da fase.
      const manual = !!get().settings.missionProfile;
      const settings = await updateSettings({ environment, environmentManual: manual });
      const { records } = get();
      set({ settings, ...derive(settings.activeCrewId, records, environment, get().crew.find((c) => c.id === settings.activeCrewId), settings.cabinCo2Mmhg) });
    },

    setCabinCo2Mmhg: async (value) => {
      requireMissionEditor();
      const settings = await updateSettings({ cabinCo2Mmhg: value });
      set({ settings, ...derive(settings.activeCrewId, get().records, settings.environment, get().crew.find((c) => c.id === settings.activeCrewId), settings.cabinCo2Mmhg) });
    },

    // Só o oficial médico altera os dados iniciais (massa no início e dose de missões anteriores).
    setCrewMissionData: async (crewId, data) => {
      const session = requireSession();
      if (session.role !== 'medicalOfficer') throw new Error('Só o oficial médico altera os dados iniciais da missão.');
      await updateCrewMissionData(crewId, data);
      if (!isOwnData(session, crewId)) {
        await logAccess({
          subjectCrewId: crewId,
          actorProfileId: session.profileId,
          actorName: session.name,
          actorRole: session.role,
          what: 'Alterou os dados iniciais da missão',
        });
      }
      const crew = await listCrew();
      const { settings, records } = get();
      set({ crew, ...derive(settings.activeCrewId, records, settings.environment, crew.find((c) => c.id === settings.activeCrewId), settings.cabinCo2Mmhg) });
    },

    setMissionProfile: async (missionProfile) => {
      requireMissionEditor();
      const environment = missionProfile ? phaseEnvironment(missionProfile, get().crew) : get().settings.environment;
      const settings = await updateSettings({ missionProfile, environment, environmentManual: false });
      set({ settings, ...derive(settings.activeCrewId, get().records, settings.environment, get().crew.find((c) => c.id === settings.activeCrewId), settings.cabinCo2Mmhg) });
    },

    applyPhaseEnvironment: async () => {
      await get().setMissionProfile(get().settings.missionProfile);
    },

    // O check-in é sempre do tripulante que entrou, mesmo que ele esteja vendo outro.
    saveCheckin: async (values) => {
      const session = requireSession();
      const member = get().crew.find((c) => c.id === session.crewId);
      if (!member) throw new Error('Só tripulantes fazem check-in.');
      const date = todayISO();
      await saveRecord({
        id: `${member.id}_${date}`,
        crewId: member.id,
        date,
        missionDay: missionDay(member.missionStart, date),
        values,
        createdAt: new Date().toISOString(),
      });
      await compose(member.id, date);
      await loadActive(await updateSettings({ activeCrewId: member.id }));
      const alerts = get().alerts;
      void get().syncNow();
      return alerts;
    },

    setReminder: async (indicator, everyDays) => {
      const others = get().settings.reminders.filter((r) => r.indicator !== indicator);
      const reminders = everyDays > 0 ? [...others, { indicator, everyDays }] : others;
      set({ settings: await updateSettings({ reminders }) });
    },

    reviewAlert: async (alert, note) => {
      const session = requireSession();
      if (session.role !== 'medicalOfficer') throw new Error('Só o oficial médico marca alertas como vistos.');
      const record = get().records.find((r) => r.crewId === alert.crewId && r.date === alert.date);
      if (!record) throw new Error('O registro deste alerta não está carregado.');
      await saveReview({
        level: alert.level,
        recordCreatedAt: record.createdAt,
        id: alert.id,
        crewId: alert.crewId,
        date: alert.date,
        indicator: alert.indicator,
        seenByProfileId: session.profileId,
        seenBy: session.name,
        seenAt: new Date().toISOString(),
        note: note.trim(),
      });
      await compose(alert.crewId, alert.date);
      await loadActive(get().settings);
      void get().syncNow();
    },

    // Bloqueia antes e espera o ciclo em andamento: nada pode gravar com a chave antiga
    // depois que a demonstração nova (com chave nova) foi escrita.
    // Só o oficial médico recria: recriar apaga também o registro de acesso de todos.
    resetDemo: async () => {
      if (requireSession().role !== 'medicalOfficer') throw new Error('Só o oficial médico recria a demonstração.');
      get().lock('Demonstração recriada. Entre de novo.');
      pending = null;
      await running;
      await resetDemo();
      set({ ready: false });
      await get().loadCrew();
    },

    syncNow: async (sendAll = false) => {
      if (!get().session) return;
      if (running) {
        pending = { sendAll: sendAll || !!pending?.sendAll };
        return running;
      }
      running = (async () => {
        let next: { sendAll: boolean } | null = { sendAll };
        while (next && get().session) {
          pending = null;
          await cycle(next.sendAll);
          next = pending;
        }
      })().finally(() => {
        running = null;
      });
      return running;
    },

    deliverNow: async () => {
      await deliverInTransitNow();
      await loadSyncState();
    },

    // Grade do oficial médico. Cada tripulante aberto aqui entra no registro de acesso dele.
    loadCrewOverview: async () => {
      const session = requireSession();
      const { crew, settings } = get();
      const today = todayISO();
      const result: CrewOverview[] = [];
      const started = epoch;
      for (const member of crew.filter((c) => canViewCrew(session, c.id))) {
        const [all, reviews] = await Promise.all([listRecords(member.id), listReviews(member.id)]);
        assertCurrent(started);
        const records = visibleRecords(session, member.id, all);
        const { alerts } = derive(member.id, records, settings.environment, member, settings.cabinCo2Mmhg);
        const visible = visibleReviews(session, reviews);
        const lastDate = records[records.length - 1]?.date;
        result.push({
          member,
          alerts,
          level: worstLevel(...alerts.map((a) => a.level)),
          lastDate,
          checkinToday: lastDate === today,
          openAlerts: alerts.filter((a) => !currentReview(a, visible, records)).length,
        });
        if (!isOwnData(session, member.id)) {
          await logAccess({
            subjectCrewId: member.id,
            actorProfileId: session.profileId,
            actorName: session.name,
            actorRole: session.role,
            what: 'Viu o resumo na tela Tripulação',
          });
        }
      }
      return result;
    },

    // Tela do comandante: só check-in de hoje e se há vermelho, dos outros tripulantes.
    // O comandante não tem a chave de ninguém: lê o resumo que cada check-in selou para ele,
    // e só depois que o registro chegou à central.
    loadCrewStatus: async () => {
      const session = requireSession();
      if (!canViewCrewStatus(session)) return [];
      const { crew } = get();
      const today = todayISO();
      const started = epoch;
      const summaries = await listStatusesForCommander(await atCentralChecker());
      assertCurrent(started);
      const result: CrewStatusRow[] = [];
      for (const member of crew.filter((c) => c.id !== session.crewId)) {
        const summary = summaries.find((x) => x.crewId === member.id);
        result.push({
          id: member.id,
          name: member.name,
          role: member.role,
          checkinToday: summary?.lastCheckinDate === today,
          hasRed: !!summary?.red,
        });
        await logAccess({
          subjectCrewId: member.id,
          actorProfileId: session.profileId,
          actorName: session.name,
          actorRole: session.role,
          what: 'Viu o status de check-in na tela Tripulação',
        });
      }
      return result;
    },

    recordGroundAccess: async (crewId, what) => {
      const session = requireSession();
      await logAccess({
        subjectCrewId: crewId,
        actorProfileId: session.profileId,
        actorName: session.name,
        actorRole: session.role,
        what,
      });
    },

    loadAccessLog: async () => {
      const session = requireSession();
      return session.crewId ? listAccess(session.crewId) : [];
    },
  };
});

export function useActiveCrew(): CrewMember | undefined {
  return useAppStore((s) => s.crew.find((c) => c.id === s.settings.activeCrewId));
}

// Verdadeiro quando quem entrou está vendo os dados de outro tripulante.
export function useViewingOther(): boolean {
  return useAppStore((s) => !!s.session && s.settings.activeCrewId !== s.session.crewId);
}
