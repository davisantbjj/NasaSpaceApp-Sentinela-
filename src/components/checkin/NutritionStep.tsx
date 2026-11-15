import type { TranslatedScaleOption } from '../../content/indicators';
import i18n from '../../i18n';
import { ScaleStep } from './ScaleStep';

interface Props {
  mealOptions: TranslatedScaleOption[];
  meals?: number;
  water?: boolean;
  onMeals: (value: number) => void;
  onWater: (value: boolean) => void;
}

// Alimentação e água (N12): duas perguntas simples no mesmo passo, sem contagem de calorias.
export function NutritionStep({ mealOptions, meals, water, onMeals, onWater }: Props) {
  const waterOptions: TranslatedScaleOption[] = [
    { value: 1, labelKey: 'indicators:mealsCompleted.waterOptions.yes', symbol: '✓', label: i18n.t('indicators:mealsCompleted.waterOptions.yes') },
    { value: 0, labelKey: 'indicators:mealsCompleted.waterOptions.no', symbol: '✗', label: i18n.t('indicators:mealsCompleted.waterOptions.no') },
  ];
  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted" aria-hidden="true">{i18n.t('indicators:mealsCompleted.meals')}</p>
      <ScaleStep name="mealsCompleted" legend={i18n.t('indicators:mealsCompleted.meals')} options={mealOptions} value={meals} onChange={onMeals} />
      <p className="small muted" aria-hidden="true">{i18n.t('indicators:mealsCompleted.water')}</p>
      <ScaleStep
        name="waterSufficient"
        legend={i18n.t('indicators:mealsCompleted.water')}
        options={waterOptions}
        value={water === undefined ? undefined : water ? 1 : 0}
        onChange={(value) => onWater(value === 1)}
      />
    </div>
  );
}
