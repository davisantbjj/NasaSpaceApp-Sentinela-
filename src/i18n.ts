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

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, checkin: enCheckin, alerts: enAlerts, indicators: enIndicators },
    'pt-BR': { common: ptCommon, checkin: ptCheckin, alerts: ptAlerts, indicators: ptIndicators },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'checkin', 'alerts', 'indicators'],
  interpolation: { escapeValue: false },
}).then(() => {
  if (typeof document !== 'undefined') document.documentElement.lang = i18n.language;
});

i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
});

export default i18n;
