import type { Alert, AlertReview, DailyRecord } from '../types';

// A anotação "visto" de um alerta só vale enquanto o alerta é o mesmo que o oficial médico viu:
// mesmo registro (não refeito) e mesmo nível. Se a tripulante refaz o check-in e um amarelo
// vira vermelho, o vermelho aparece de novo como não visto. Função pura, testada em sync.test.ts.
export function currentReview(alert: Alert, reviews: AlertReview[], records: DailyRecord[]): AlertReview | undefined {
  const review = reviews.find((r) => r.id === alert.id);
  if (!review) return undefined;
  const record = records.find((r) => r.crewId === alert.crewId && r.date === alert.date);
  if (!record || review.level !== alert.level || review.recordCreatedAt !== record.createdAt) return undefined;
  return review;
}
