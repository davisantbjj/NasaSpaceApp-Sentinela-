import type { BodyRegion } from '../../types';

// Figura humana em viewBox 0 0 240 500. O lado esquerdo do corpo fica à direita de quem olha.
export const BODY_VIEWBOX = '0 0 240 500';

// Silhueta de fundo, sem interação.
export const BODY_BASE: string[] = [
  'M108 92h24v24h-24z', // pescoço
  'M100 108h40a30 30 0 0 1 30 30v112a22 22 0 0 1-22 22H92a22 22 0 0 1-22-22V138a30 30 0 0 1 30-30z', // tronco
];

export interface RegionShape {
  region: BodyRegion;
  paths: string[];
  mark: { x: number; y: number }; // onde fica o ícone do nível
  whole?: boolean; // contorno em volta da figura
}

// A ordem define quem fica por cima no desenho.
export const BODY_REGIONS: RegionShape[] = [
  {
    region: 'wholeBody',
    whole: true,
    paths: ['M70 14h100a48 48 0 0 1 48 48v376a48 48 0 0 1-48 48H70a48 48 0 0 1-48-48V62a48 48 0 0 1 48-48z'],
    mark: { x: 120, y: 486 },
  },
  {
    region: 'musculoskeletal',
    paths: [
      'M47 124a13 13 0 0 1 13 13v126a13 13 0 0 1-26 0V137a13 13 0 0 1 13-13z', // braço
      'M193 124a13 13 0 0 1 13 13v126a13 13 0 0 1-26 0V137a13 13 0 0 1 13-13z', // braço
      'M76 280h40v176a20 20 0 0 1-40 0z', // perna
      'M124 280h40v176a20 20 0 0 1-40 0z', // perna
    ],
    mark: { x: 96, y: 380 },
  },
  { region: 'mind', paths: ['M82 58a38 38 0 0 1 76 0z'], mark: { x: 120, y: 44 } },
  { region: 'head', paths: ['M82 62h76a38 38 0 0 1-76 0z'], mark: { x: 120, y: 82 } },
  { region: 'immune', paths: ['M100 132a17 17 0 1 1 0 34a17 17 0 0 1 0-34z'], mark: { x: 100, y: 154 } },
  { region: 'heart', paths: ['M140 130a19 19 0 1 1 0 38a19 19 0 0 1 0-38z'], mark: { x: 140, y: 154 } },
  { region: 'metabolism', paths: ['M120 190a34 28 0 1 1 0 56a34 28 0 0 1 0-56z'], mark: { x: 120, y: 223 } },
];
