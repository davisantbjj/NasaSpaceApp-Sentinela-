import { sourceContent } from '../../content/indicators';
import i18n from '../../i18n';
import type { DataSource } from '../../types';

interface Props {
  name: string;
  options: DataSource[];
  value: DataSource;
  onChange: (value: DataSource) => void;
}

// "De onde veio o valor?" (M10). O app não lê aparelhos: a pessoa diz onde leu o número.
export function SourcePicker({ name, options, value, onChange }: Props) {
  return (
    <fieldset className="options list">
      <legend className="small muted">{i18n.t('checkin:sourceQuestion')}</legend>
      <p className="small muted">{i18n.t('checkin:sourceNote')}</p>
      {options.map((source) => (
        <label key={source} className="option">
          <input type="radio" name={`${name}-source`} checked={value === source} onChange={() => onChange(source)} />
          <span className="option-face">
            {sourceContent(source).label}
            <span className="small muted">{sourceContent(source).example}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
