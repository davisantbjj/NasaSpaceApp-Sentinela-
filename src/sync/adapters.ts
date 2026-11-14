import type { Environment } from '../types';

// Os dois trechos da comunicação, cada um atrás de uma interface:
//
//   tablet do tripulante ──SyncAdapter──▶ central de bordo ──EarthLink──▶ Terra
//
// Hoje as duas implementações são simuladas no próprio navegador (central.ts).
// O backend da equipe na Terra entra como outra implementação de EarthLink, sem mudar as telas.

// Item na fila do aparelho, esperando a rede da nave.
export interface OutboxItem {
  kind: 'record' | 'review';
  id: string;
  crewId: string;
  date: string;
  createdAt: string;
}

export interface SyncAdapter {
  readonly name: string;
  reachable(): boolean | Promise<boolean>;
  // Devolve os ids que a central aceitou.
  push(items: OutboxItem[]): Promise<string[]>;
}

export interface EarthLink {
  readonly name: string;
  // 'simulated': nenhum servidor configurado, o envio acontece só dentro deste navegador.
  // 'server': o backend da equipe; isOpen() pergunta ao servidor se ele está de pé.
  readonly mode: 'simulated' | 'server';
  isOpen(): boolean | Promise<boolean>;
  // Envia os pacotes indicados. A ordem dos ids é a ordem de envio.
  send(packetIds: string[], environment: Environment): Promise<void>;
}
