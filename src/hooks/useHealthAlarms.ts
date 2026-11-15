import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../content/localize';
import { loadAlarmVolume } from '../data/alarmPrefsRepo';
import { clearAlarms, raiseAlarm, setAlarmVolume } from '../lib/alarm';
import { useAppStore } from '../store/useAppStore';

// Liga os alertas de saúde aos alarmes. Vale só para os dados da própria pessoa: o oficial médico
// vendo um colega não ouve o alarme dele por aqui (o escalonamento ao oficial médico é outra tarefa).
// Um alarme por nível e por registro: refazer o check-in gera um alarme novo.
export function useHealthAlarms(): void {
  const { i18n } = useTranslation();
  const { session, settings, records, alerts } = useAppStore();

  useEffect(() => {
    void loadAlarmVolume().then(setAlarmVolume);
  }, []);

  useEffect(() => {
    if (!session) {
      clearAlarms();
      return;
    }
    if (session.role === 'groundSurgeon' || !session.crewId || settings.activeCrewId !== session.crewId) return;
    const latest = records[records.length - 1];
    if (!latest || latest.crewId !== session.crewId) return;

    for (const level of ['red', 'yellow'] as const) {
      const list = alerts.filter((alert) => alert.level === level);
      if (list.length === 0) continue;
      raiseAlarm(level, list.map((alert) => translateText(alert.whatChanged)).join(' · '), {
        id: `health:${latest.id}:${latest.createdAt}:${level}`,
        link: '/alerts',
        speech: { text: i18n.t(`alarm.speech.${level}`), lang: i18n.language },
      });
    }
  }, [session, settings.activeCrewId, records, alerts, i18n, i18n.language]);
}
