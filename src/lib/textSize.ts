import { create } from 'zustand';
import { db } from '../data/db';

// "Texto maior": aumenta a escala base da fonte (WCAG 1.4.4). Todo o CSS usa rem, então mudar o
// tamanho do <html> aumenta o texto do app inteiro, sem quebrar o layout. É uma preferência do
// aparelho, sem dado de saúde, e vale para todos os perfis.

const KEY = 'textSize';
export const LARGE_TEXT_PERCENT = 125;

interface TextSizeState {
  large: boolean;
}

export const useTextSize = create<TextSizeState>(() => ({ large: false }));

function apply(large: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('text-large', large);
}

export async function loadTextSize(): Promise<void> {
  try {
    const large = (await db.preferences.get(KEY))?.value === 'large';
    useTextSize.setState({ large });
    apply(large);
  } catch {
    // Sem acesso ao banco: fica o tamanho normal.
  }
}

export async function setLargeText(large: boolean): Promise<void> {
  useTextSize.setState({ large });
  apply(large);
  try {
    await db.preferences.put({ key: KEY, value: large ? 'large' : 'normal' });
  } catch {
    // A escolha vale nesta aba mesmo sem conseguir gravar.
  }
}
