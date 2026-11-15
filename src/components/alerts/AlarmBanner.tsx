import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { acknowledgeAlarm, silenceAlarms, useAlarmStore } from '../../lib/alarm';
import { LevelIcon } from './LevelBadge';

const BASE_TITLE = typeof document !== 'undefined' ? document.title : 'Sentinela';

// Banner fixo dos alarmes: equivalente visual de todo som (cor, ícone e texto).
// Nada pisca nem se move (WCAG 2.3.1). "Silenciar" para o som; o banner só sai com "Confirmar".
export function AlarmBanner() {
  const { t } = useTranslation();
  const alarms = useAlarmStore((state) => state.alarms);

  // Contador também no título da aba, visível com o app em segundo plano.
  useEffect(() => {
    document.title = alarms.length > 0 ? `(${alarms.length}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [alarms.length]);

  if (alarms.length === 0) return null;
  const sounding = alarms.some((a) => a.level === 'red' && !a.silenced);

  return (
    <section className="alarm-stack" aria-label={t('alarm.region')}>
      {alarms.map((alarm) => (
        <div key={alarm.id} className="alarm-banner" data-level={alarm.level} role={alarm.level === 'red' ? 'alert' : 'status'}>
          <span className="level-color alarm-icon" data-level={alarm.level}><LevelIcon level={alarm.level} /></span>
          <div className="alarm-text">
            <strong className="level-color" data-level={alarm.level}>{t(`alarm.title.${alarm.level}`)}</strong>
            <span>{alarm.text}</span>
            {alarm.level === 'red' && alarm.silenced && <span className="small muted">{t('alarm.silenced')}</span>}
            {alarm.link && <Link className="link-arrow small" to={alarm.link}>{t('alarm.details')}</Link>}
          </div>
          <div className="alarm-actions">
            {alarm.level === 'red' && sounding && !alarm.silenced && (
              <button type="button" className="btn" onClick={silenceAlarms}>
                <span aria-hidden="true">🔇</span> {t('alarm.silence')}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => acknowledgeAlarm(alarm.id)}>
              {t('alarm.confirm')}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
