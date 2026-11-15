import type { TranslatedScaleOption } from '../../content/indicators';
import i18n from '../../i18n';
import { formatNumber } from '../../lib/format';
import { ScaleStep } from './ScaleStep';

interface Props {
  mealOptions: TranslatedScaleOption[];
  meals?: number;
  water: string; // mL digitados, aceita vazio
  referenceMl?: number; // referência pelo peso (context.hydration)
  bodyMassKg?: number; // massa usada na referência
  perKg?: number;
  onMeals: (value: number) => void;
  onWater: (value: string) => void;
}

export const WATER_MAX_ML = 10000;

// Água digitada em mL: vazio é "não informado"; fora de 0 a 10.000 ou com letra é erro de digitação.
export function parseWaterMl(text: string): number | undefined | 'invalid' {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= WATER_MAX_ML ? Math.round(value) : 'invalid';
}

// Alimentação e água (N12): refeições completas e quanto de água o tripulante bebeu, sem contar calorias.
// A água é comparada com uma referência pelo peso, mostrada aqui antes de salvar.
export function NutritionStep({ mealOptions, meals, water, referenceMl, bodyMassKg, perKg, onMeals, onWater }: Props) {
  const parsed = parseWaterMl(water);
  const invalid = parsed === 'invalid';
  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted" aria-hidden="true">{i18n.t('indicators:mealsCompleted.meals')}</p>
      <ScaleStep name="mealsCompleted" legend={i18n.t('indicators:mealsCompleted.meals')} options={mealOptions} value={meals} onChange={onMeals} />
      <div className="field">
        <label htmlFor="water-intake">{i18n.t('indicators:mealsCompleted.water')}</label>
        <div className="field-input">
          <input
            id="water-intake"
            className="input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={water}
            aria-invalid={invalid}
            aria-describedby="water-reference"
            onChange={(event) => onWater(event.target.value)}
          />
          <span className="muted">mL</span>
        </div>
        {invalid && <span className="field-error">{i18n.t('checkin:rangeError', { min: 0, max: formatNumber(WATER_MAX_ML), unit: 'mL' })}</span>}
        {referenceMl !== undefined && (
          <p id="water-reference" className="small muted">
            {bodyMassKg !== undefined
              ? i18n.t('indicators:mealsCompleted.waterReference', {
                  reference: formatNumber(referenceMl),
                  perKg,
                  mass: formatNumber(bodyMassKg),
                })
              : i18n.t('indicators:mealsCompleted.waterReferenceMinimum', { reference: formatNumber(referenceMl) })}
          </p>
        )}
      </div>
    </div>
  );
}
