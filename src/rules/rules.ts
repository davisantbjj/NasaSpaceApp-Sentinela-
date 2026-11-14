import type { Rules } from '../types';
import rulesJson from './rules.json';

// Única porta de entrada para as regras. Nenhuma faixa fica escrita no código.
export const rules = rulesJson as unknown as Rules;
