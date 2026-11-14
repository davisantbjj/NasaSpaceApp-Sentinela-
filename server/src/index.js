import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { createHandler } from './app.js';
import { openDb } from './db.js';

// Configuração por variáveis de ambiente (veja server/README.md):
//   MISSION_TOKEN    obrigatório; o app manda ao enviar pacotes
//   READ_TOKEN       obrigatório e diferente do MISSION_TOKEN; só a equipe da Terra usa para ler
//   ALLOWED_ORIGINS  endereços do app, separados por vírgula
//   DATA_DIR         pasta do banco; no Railway, o caminho do volume (ex.: /data)
//   PORT             o Railway define sozinho

const token = process.env.MISSION_TOKEN;
const readToken = process.env.READ_TOKEN;
if (!token || token.length < 16 || !readToken || readToken.length < 16) {
  console.error('Defina MISSION_TOKEN e READ_TOKEN, cada um com pelo menos 16 caracteres.');
  process.exit(1);
}
if (token === readToken) {
  console.error('READ_TOKEN precisa ser diferente de MISSION_TOKEN: o token de envio vai junto do app publicado.');
  process.exit(1);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const dataDir = process.env.DATA_DIR ?? './data';
mkdirSync(dataDir, { recursive: true });
const db = openDb(join(dataDir, 'sentinela.db'));

const port = Number(process.env.PORT ?? 8787);
const server = createServer(createHandler({ db, token, readToken, allowedOrigins }));
server.listen(port, () => {
  console.log(`Sentinela na Terra ouvindo na porta ${port}. Origens permitidas: ${allowedOrigins.join(', ')}`);
});

// O Railway encerra o processo com SIGTERM ao publicar uma versão nova. Termina as requisições
// em andamento e, se alguma conexão travar, sai assim mesmo depois de 10 s.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
    server.closeIdleConnections();
    setTimeout(() => {
      server.closeAllConnections();
      db.close();
      process.exit(0);
    }, 10_000).unref();
  });
}
