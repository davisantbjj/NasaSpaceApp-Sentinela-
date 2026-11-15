import i18n from '../../i18n';
import { LARGE_TEXT_PERCENT, setLargeText, useTextSize } from '../../lib/textSize';

// Botão liga/desliga do texto maior, no menu do usuário e na tela de entrada.
export function TextSizeToggle() {
  const large = useTextSize((state) => state.large);
  return (
    <button
      type="button"
      className="btn btn-ghost text-size-toggle"
      aria-pressed={large}
      onClick={() => void setLargeText(!large)}
    >
      <span aria-hidden="true" className="text-size-icon">A<span>A</span></span>
      {i18n.t('textSize.label')}
      <span className="small muted">{large ? i18n.t('textSize.on', { percent: LARGE_TEXT_PERCENT }) : i18n.t('textSize.off')}</span>
    </button>
  );
}
