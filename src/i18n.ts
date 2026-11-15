import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enAlerts from './locales/en/alerts.json';
import enCheckin from './locales/en/checkin.json';
import enCommon from './locales/en/common.json';
import enIndicators from './locales/en/indicators.json';
import ptAlerts from './locales/pt-BR/alerts.json';
import ptCheckin from './locales/pt-BR/checkin.json';
import ptCommon from './locales/pt-BR/common.json';
import ptIndicators from './locales/pt-BR/indicators.json';

// O idioma escolhido fica guardado neste navegador e vale na próxima abertura, para todos os perfis.
// Fica no localStorage (e não no banco) para ser lido já na abertura, sem piscar em inglês antes.
// É uma preferência do aparelho, sem dado de saúde.
const LANGUAGE_KEY = 'sentinela.language';
export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const;

function savedLanguage(): string | undefined {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved) ? saved : undefined;
  } catch {
    return undefined; // sem acesso ao armazenamento (aba privada, bloqueio): fica o padrão
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, checkin: enCheckin, alerts: enAlerts, indicators: enIndicators },
    'pt-BR': { common: ptCommon, checkin: ptCheckin, alerts: ptAlerts, indicators: ptIndicators },
  },
  lng: savedLanguage() ?? 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'checkin', 'alerts', 'indicators'],
  interpolation: { escapeValue: false },
}).then(() => {
  if (typeof document !== 'undefined') document.documentElement.lang = i18n.language;
});

i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // A escolha vale nesta aba mesmo sem conseguir gravar.
  }
});

export default i18n;
