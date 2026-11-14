import type { CrewMember } from '../types';

const SOURCE = 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf';

// Conteúdo educativo separado do motor: sexo não entra na classificação dos indicadores.
export function crewHealthContext(sex: CrewMember['sex']) {
  const common = 'Ao voltar a um ambiente com gravidade depois de um período em microgravidade, pode ocorrer tontura ao levantar. Relate sintomas à equipe de bordo e siga o protocolo individual de readaptação.';
  return {
    text: sex === 'female'
      ? `${common} A NASA descreve maior suscetibilidade à intolerância ortostática em mulheres nos estudos citados; isso não determina o risco individual nem altera as faixas deste app.`
      : `${common} A resposta varia entre pessoas; esta nota não estima risco individual nem altera as faixas deste app.`,
    sourceUrl: SOURCE,
  };
}
