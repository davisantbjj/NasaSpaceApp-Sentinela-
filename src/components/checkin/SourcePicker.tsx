import { DATA_SOURCES } from '../../content/indicators';
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
      <legend className="small muted">De onde veio o valor?</legend>
      <p className="small muted">Origem declarada por você. O app não se conecta ao aparelho; copie o valor e informe a origem.</p>
      {options.map((source) => (
        <label key={source} className="option">
          <input type="radio" name={`${name}-source`} checked={value === source} onChange={() => onChange(source)} />
          <span className="option-face">
            {DATA_SOURCES[source].label}
            <span className="small muted">{DATA_SOURCES[source].example}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
