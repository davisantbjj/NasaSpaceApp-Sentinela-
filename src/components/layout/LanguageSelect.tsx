import i18n from '../../i18n';

export function LanguageSelect() {
  return (
    <label className="small language-choice">
      <span>{i18n.t('language.label')}</span>
      <select
        className="select"
        value={i18n.language.startsWith('pt') ? 'pt-BR' : 'en'}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        <option value="en">{i18n.t('language.en')}</option>
        <option value="pt-BR">{i18n.t('language.ptBR')}</option>
      </select>
    </label>
  );
}
