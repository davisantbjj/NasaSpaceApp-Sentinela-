interface Props {
  legend: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

// Passo de lista de marcar (sintomas).
export function ChecklistStep({ legend, options, value, onChange }: Props) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <fieldset className="options list">
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => (
        <label key={option.id} className="option">
          <input type="checkbox" checked={value.includes(option.id)} onChange={() => toggle(option.id)} />
          <span className="option-face">
            <span className="option-check" aria-hidden="true">✓</span>
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
