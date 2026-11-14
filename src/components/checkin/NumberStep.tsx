export interface NumberField {
  id: string;
  label: string;
  unit: string;
  value: string; // texto digitado, aceita vírgula
  min: number;
  max: number;
  step: number;
}

interface Props {
  fields: NumberField[];
  onChange: (id: string, value: string) => void;
}

export function parseNumber(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

// Mensagem de erro de digitação, ou undefined se o campo está vazio ou válido.
export function fieldError(field: NumberField): string | undefined {
  if (field.value.trim() === '') return undefined;
  const value = parseNumber(field.value);
  if (value === undefined) return 'Digite só números.';
  if (value < field.min || value > field.max) {
    return `Confira o valor: o campo aceita de ${field.min} a ${field.max} ${field.unit}.`;
  }
  return undefined;
}

// Passo de valor numérico. Pressão arterial usa dois campos.
export function NumberStep({ fields, onChange }: Props) {
  return (
    <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
      {fields.map((field, i) => {
        const error = fieldError(field);
        return (
          <div key={field.id} className="field">
            <label htmlFor={field.id}>{field.label}</label>
            <div className="field-input">
              <input
                id={field.id}
                className="input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={i === 0}
                value={field.value}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
              <span className="muted">{field.unit}</span>
            </div>
            {error && <span id={`${field.id}-error`} className="field-error">{error}</span>}
          </div>
        );
      })}
    </div>
  );
}
