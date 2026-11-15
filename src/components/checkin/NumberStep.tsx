import i18n from '../../i18n';
import { formatNumber } from '../../lib/format';

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
  title?: string; // título do passo: um campo só com o mesmo nome não repete o rótulo na tela
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
  if (value === undefined) return i18n.t('checkin:typingError');
  if (value < field.min || value > field.max) {
    return i18n.t('checkin:rangeError', {
      min: formatNumber(field.min),
      max: formatNumber(field.max),
      unit: field.unit,
    });
  }
  return undefined;
}

// Passo de valor numérico. Pressão arterial usa dois campos.
export function NumberStep({ fields, title, onChange }: Props) {
  const repeatsTitle = fields.length === 1 && fields[0].label === title;
  return (
    <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
      {fields.map((field, i) => {
        const error = fieldError(field);
        return (
          <div key={field.id} className="field">
            <label htmlFor={field.id} className={repeatsTitle ? 'visually-hidden' : undefined}>{field.label}</label>
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
