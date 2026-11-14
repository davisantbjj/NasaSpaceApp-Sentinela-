import { useEffect, useState } from 'react';

// Hora atual, atualizada a cada `ms`. Para contagens e status que mudam com o tempo.
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return now;
}
