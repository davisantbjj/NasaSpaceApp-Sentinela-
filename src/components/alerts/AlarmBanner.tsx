import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { acknowledgeAlarm, silenceAlarms, useAlarmStore } from '../../lib/alarm';
import { LevelIcon } from './LevelBadge';

const BASE_TITLE = typeof document !== 'undefined' ? document.title : 'Sentinela';

// Banner dos alarmes: equivalente visual de todo som (cor, ícone e texto).
// Nada pisca nem se move (WCAG 2.3.1). "Silenciar" para o som; o banner só sai com "Confirmar".
//
// O bloco completo rola com a página. Quando ele sai da tela e há um vermelho (Warning, ação
// imediata), aparece abaixo da barra uma faixa compacta de uma linha com o vermelho e as mesmas
// ações, para o alerta continuar visível sem cobrir o conteúdo. O amarelo (Caution) não fica preso.
export function AlarmBanner() {
  const { t } = useTranslation();
  const alarms = useAlarmStore((state) => state.alarms);
  const stackRef = useRef<HTMLElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const [stackVisible, setStackVisible] = useState(true);

  // Contador também no título da aba, visível com o app em segundo plano.
  useEffect(() => {
    document.title = alarms.length > 0 ? `(${alarms.length}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [alarms.length]);

  const reds = alarms.filter((a) => a.level === 'red');
  const hasRed = reds.length > 0;

  // O bloco completo está visível abaixo da barra de navegação?
  useEffect(() => {
    const stack = stackRef.current;
    if (!hasRed || !stack || typeof IntersectionObserver === 'undefined') {
      setStackVisible(true);
      return undefined;
    }
    const navbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-h')) || 64;
    const observer = new IntersectionObserver(([entry]) => setStackVisible(entry.isIntersecting), {
      rootMargin: `-${Math.round(navbar)}px 0px 0px 0px`,
    });
    observer.observe(stack);
    return () => observer.disconnect();
  }, [hasRed]);

  // --alarm-h: espaço da faixa compacta, para âncoras e foco rolarem para baixo dela.
  useEffect(() => {
    const root = document.documentElement.style;
    const compact = compactRef.current;
    if (!hasRed || !compact || typeof ResizeObserver === 'undefined') {
      root.setProperty('--alarm-h', '0px');
      return () => root.removeProperty('--alarm-h');
    }
    const update = () => root.setProperty('--alarm-h', `${compact.offsetHeight + 8}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(compact);
    return () => {
      observer.disconnect();
      root.removeProperty('--alarm-h');
    };
  }, [hasRed]);

  if (alarms.length === 0) return null;
  const sounding = reds.some((a) => !a.silenced);
  const first = reds[0];
  const others = alarms.length - 1;

  return (
    <>
      <section ref={stackRef} className="alarm-stack" aria-label={t('alarm.region')}>
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

      {first && (
        // Sem role="alert": o mesmo alarme já foi anunciado pelo bloco completo. Escondida, a faixa
        // usa visibility: hidden, que também a tira do Tab e do leitor de tela.
        <div ref={compactRef} className="alarm-compact" data-visible={!stackVisible}>
          <span className="level-color alarm-icon" data-level="red"><LevelIcon level="red" /></span>
          <strong className="level-color" data-level="red">{t('alarm.title.red')}</strong>
          <span className="alarm-compact-text">{first.text}</span>
          {others > 0 && <span className="alarm-compact-more">{t('alarm.more', { count: others })}</span>}
          {sounding && !first.silenced && (
            <button type="button" className="btn" onClick={silenceAlarms} aria-label={t('alarm.silence')}>
              <span aria-hidden="true">🔇</span>
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => acknowledgeAlarm(first.id)}>
            {t('alarm.confirm')}
          </button>
        </div>
      )}
    </>
  );
}
