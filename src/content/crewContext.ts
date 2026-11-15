import type { CrewMember } from '../types';
import i18n from '../i18n';

const SOURCE = 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf';

// Conteúdo educativo separado do motor: sexo não entra na classificação dos indicadores.
export function crewHealthContext(sex: CrewMember['sex']) {
  return {
    text: i18n.t(sex === 'female' ? 'mission.gravityContext.female' : 'mission.gravityContext.other'),
    sourceUrl: SOURCE,
  };
}
