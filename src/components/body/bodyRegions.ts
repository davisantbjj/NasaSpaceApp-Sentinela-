import type { BodyRegion } from '../../types';

// Coordenadas em pixels da imagem public/body/corpo.webp (1024 x 765).
// Se trocar a imagem, refaça as formas abaixo.
export const BODY_IMAGE = { width: 1024, height: 765 } as const;

// Recorte mostrado na tela: só a área do corpo, sem o fundo vazio dos lados.
export const BODY_VIEWBOX = '318 84 388 676';

export type RegionShape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'polygon'; points: string };

export interface BodyRegionDef {
  id: BodyRegion;
  shapes: RegionShape[];
  anchor: { x: number; y: number }; // onde fica o marcador com o ícone do nível
}

// A ordem define quem fica por cima no desenho.
export const BODY_REGIONS: BodyRegionDef[] = [
  {
    id: 'wholeBody',
    shapes: [{ kind: 'ellipse', cx: 512, cy: 738, rx: 120, ry: 16 }],
    anchor: { x: 512, y: 738 },
  },
  {
    id: 'musculoskeletal',
    shapes: [
      { kind: 'polygon', points: '440,222 425,235 418,280 405,315 388,350 374,390 358,402 345,420 350,452 380,452 396,412 412,370 430,330 445,295 452,250' },
      { kind: 'polygon', points: '583,222 598,235 605,280 618,315 635,350 649,390 665,402 678,420 673,452 643,452 627,412 611,370 593,330 578,295 571,250' },
      { kind: 'polygon', points: '446,432 510,438 508,470 498,540 490,600 482,660 482,700 476,724 438,724 452,690 452,620 448,560 450,500 446,460' },
      { kind: 'polygon', points: '577,432 513,438 515,470 525,540 533,600 541,660 541,700 547,724 585,724 571,690 571,620 575,560 573,500 577,460' },
    ],
    anchor: { x: 470, y: 590 },
  },
  {
    id: 'metabolism',
    shapes: [{ kind: 'ellipse', cx: 512, cy: 352, rx: 46, ry: 48 }],
    anchor: { x: 512, y: 352 },
  },
  {
    id: 'immune',
    shapes: [
      { kind: 'ellipse', cx: 512, cy: 203, rx: 20, ry: 9 },
      { kind: 'ellipse', cx: 452, cy: 252, rx: 9, ry: 9 },
      { kind: 'ellipse', cx: 571, cy: 252, rx: 9, ry: 9 },
    ],
    anchor: { x: 470, y: 208 },
  },
  {
    id: 'heart',
    shapes: [{ kind: 'ellipse', cx: 533, cy: 262, rx: 24, ry: 20 }],
    anchor: { x: 533, y: 262 },
  },
  {
    id: 'mind',
    shapes: [{ kind: 'ellipse', cx: 512, cy: 122, rx: 27, ry: 20 }],
    anchor: { x: 566, y: 112 },
  },
  {
    id: 'head',
    shapes: [{ kind: 'ellipse', cx: 512, cy: 152, rx: 30, ry: 9 }],
    anchor: { x: 566, y: 162 },
  },
];
