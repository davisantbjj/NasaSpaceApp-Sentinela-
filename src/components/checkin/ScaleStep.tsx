import type { ScaleOption } from '../../content/indicators';

interface Props {
  name: string;
  legend: string;
  options: ScaleOption[];
  value?: number;
  onChange: (value: number) => void;
}

// Passo de escala: humor (1 a 5) e visão (0 a 2).
export function ScaleStep({ name, legend, options, value, onChange }: Props) {
  return (
    <fieldset className="options">
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="option-face">
            <span className="option-symbol" aria-hidden="true">{option.symbol}</span>
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
