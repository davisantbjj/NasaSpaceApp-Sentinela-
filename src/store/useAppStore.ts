import { create } from 'zustand';
import { listCrew } from '../data/crewRepo';
import { listRecords, saveRecord } from '../data/recordsRepo';
import { acknowledgePrivacyNotice, deleteCrewHealthData, hasAcknowledgedPrivacyNotice } from '../data/privacyRepo';
import { resetDemo, seedIfEmpty } from '../data/seed';
import { loadSettings, saveSettings } from '../data/settingsRepo';
import { missionDay, todayISO } from '../lib/dates';
import { computeBaselines } from '../rules/baseline';
import { findCorrelations } from '../rules/correlation';
import { evaluateRecord, levelByRegion } from '../rules/engine';
import { rules } from '../rules/rules';
import type {
  Alert, Baseline, BodyRegion, Correlation, CrewMember, DailyRecord, DailyValues,
  Environment, IndicatorId, Level, Settings,
} from '../types';

interface Derived {
  baselines: Baseline[];
  alerts: Alert[]; // alertas do registro mais recente do tripulante ativo
  correlations: Correlation[];
  regionLevels: Record<BodyRegion, Level>;
}

interface AppState extends Derived {
  ready: boolean;
  privacyAcknowledged: boolean;
  error?: string;
  crew: CrewMember[];
  settings: Settings;
  records: DailyRecord[]; // histórico do tripulante ativo, do mais antigo para o mais novo
  loadCrew: () => Promise<void>;
  switchCrew: (crewId: string) => Promise<void>;
  setEnvironment: (environment: Environment) => Promise<void>;
  saveCheckin: (values: DailyValues) => Promise<Alert[]>;
  setReminder: (indicator: IndicatorId, everyDays: number) => Promise<void>;
  resetDemo: () => Promise<void>;
  acknowledgePrivacy: () => Promise<void>;
  deleteActiveHealthData: () => Promise<void>;
}

// Único ponto que junta dados, linha de base e motor de regras.
function derive(crewId: string, records: DailyRecord[], environment: Environment): Derived {
  const baselines = computeBaselines(crewId, records, rules);
  const latest = records[records.length - 1];
  const alerts = latest ? evaluateRecord(latest, records.slice(0, -1), baselines, rules, environment) : [];
  return {
    baselines,
    alerts,
    correlations: findCorrelations(records, baselines, rules),
    regionLevels: levelByRegion(alerts),
  };
}

const EMPTY_SETTINGS: Settings = { environment: 'station', activeCrewId: '', reminders: [] };

export const useAppStore = create<AppState>((set, get) => {
  async function loadActive(settings: Settings) {
    const records = await listRecords(settings.activeCrewId);
    set({ settings, records, ...derive(settings.activeCrewId, records, settings.environment) });
  }

  async function updateSettings(patch: Partial<Settings>) {
    const settings = { ...get().settings, ...patch };
    await saveSettings(settings);
    return settings;
  }

  return {
    ready: false,
    privacyAcknowledged: false,
    crew: [],
    settings: EMPTY_SETTINGS,
    records: [],
    ...derive('', [], 'station'),

    loadCrew: async () => {
      try {
        if (!await hasAcknowledgedPrivacyNotice()) {
          set({ ready: true, privacyAcknowledged: false, error: undefined });
          return;
        }
        await seedIfEmpty();
        const crew = await listCrew();
        const saved = await loadSettings();
        const settings: Settings = {
          ...EMPTY_SETTINGS,
          ...saved,
          activeCrewId: crew.some((c) => c.id === saved?.activeCrewId) ? saved!.activeCrewId : crew[0].id,
        };
        set({ crew });
        await loadActive(settings);
        set({ ready: true, privacyAcknowledged: true, error: undefined });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : String(error) });
      }
    },

    acknowledgePrivacy: async () => {
      await acknowledgePrivacyNotice();
      set({ ready: false });
      await get().loadCrew();
    },

    deleteActiveHealthData: async () => {
      const settings = get().settings;
      await deleteCrewHealthData(settings.activeCrewId);
      await loadActive(settings);
    },

    switchCrew: async (crewId) => {
      await loadActive(await updateSettings({ activeCrewId: crewId }));
    },

    setEnvironment: async (environment) => {
      const settings = await updateSettings({ environment });
      const { records } = get();
      set({ settings, ...derive(settings.activeCrewId, records, environment) });
    },

    saveCheckin: async (values) => {
      const { settings, crew } = get();
      const member = crew.find((c) => c.id === settings.activeCrewId)!;
      const date = todayISO();
      await saveRecord({
        id: `${member.id}_${date}`,
        crewId: member.id,
        date,
        missionDay: missionDay(member.missionStart, date),
        values,
        createdAt: new Date().toISOString(),
      });
      await loadActive(settings);
      return get().alerts;
    },

    setReminder: async (indicator, everyDays) => {
      const others = get().settings.reminders.filter((r) => r.indicator !== indicator);
      const reminders = everyDays > 0 ? [...others, { indicator, everyDays }] : others;
      set({ settings: await updateSettings({ reminders }) });
    },

    resetDemo: async () => {
      await resetDemo();
      set({ ready: false });
      await get().loadCrew();
    },
  };
});

export function useActiveCrew(): CrewMember | undefined {
  return useAppStore((s) => s.crew.find((c) => c.id === s.settings.activeCrewId));
}
