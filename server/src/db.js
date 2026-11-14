import { DatabaseSync } from 'node:sqlite';

// Um pacote por linha. O conteúdo (iv + data) chega cifrado do app e é guardado como veio:
// o servidor não tem a chave e não consegue ler nenhum dado de saúde.
// `seq` cresce a cada pacote recebido e serve de cursor para "o que chegou desde a última vez".

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS packets (
    seq         INTEGER PRIMARY KEY AUTOINCREMENT,
    id          TEXT NOT NULL UNIQUE,
    crew_id     TEXT NOT NULL,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    priority    TEXT NOT NULL CHECK (priority IN ('red', 'normal')),
    sent_at     TEXT NOT NULL,
    iv          TEXT NOT NULL,
    data        TEXT NOT NULL,
    received_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS packets_crew ON packets (crew_id, seq);
`;

/** @param {string} path caminho do arquivo, ou ':memory:' nos testes */
export function openDb(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);

  // Reenviar o mesmo pacote não duplica nem altera: o app pode repetir o envio sem medo.
  const insert = db.prepare(`
    INSERT INTO packets (id, crew_id, date, created_at, priority, sent_at, iv, data, received_at)
    VALUES (:id, :crewId, :date, :createdAt, :priority, :sentAt, :iv, :data, :receivedAt)
    ON CONFLICT (id) DO NOTHING
  `);
  const selectSince = db.prepare(`
    SELECT * FROM packets WHERE seq > :since ORDER BY seq LIMIT :limit
  `);
  const selectSinceForCrew = db.prepare(`
    SELECT * FROM packets WHERE crew_id = :crewId AND seq > :since ORDER BY seq LIMIT :limit
  `);

  return {
    /** Guarda os pacotes numa transação só. Devolve os ids aceitos (novos ou já guardados). */
    savePackets(packets, receivedAt) {
      db.exec('BEGIN');
      try {
        for (const p of packets) {
          insert.run({
            id: p.id, crewId: p.crewId, date: p.date, createdAt: p.createdAt, priority: p.priority,
            sentAt: p.sentAt, iv: p.sealed.iv, data: p.sealed.data, receivedAt,
          });
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return packets.map((p) => p.id);
    },

    /** Pacotes recebidos depois do cursor `since`, do mais antigo para o mais novo. */
    listPackets({ since = 0, crewId, limit = 200 }) {
      const rows = crewId ? selectSinceForCrew.all({ crewId, since, limit }) : selectSince.all({ since, limit });
      return rows.map((r) => ({
        seq: r.seq,
        id: r.id,
        crewId: r.crew_id,
        date: r.date,
        createdAt: r.created_at,
        priority: r.priority,
        sentAt: r.sent_at,
        receivedAt: r.received_at,
        sealed: { iv: r.iv, data: r.data },
      }));
    },

    close() {
      db.close();
    },
  };
}
