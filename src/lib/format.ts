import i18n from '../i18n';

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1, ...options }).format(value);
}
