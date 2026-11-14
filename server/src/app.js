import { createHash, timingSafeEqual } from 'node:crypto';
import { parsePacketsBody } from './validate.js';

// Rotas (todas em JSON):
//
//   GET  /api/health                     sem token; para o Railway saber se está de pé
//   POST /api/packets                    a central de bordo envia pacotes cifrados
//   GET  /api/packets?since=N            pacotes que chegaram depois do cursor N (a Terra lê)
//   GET  /api/crew/:crewId/packets       backup de um tripulante (aceita ?since=N também)
//
// Dois tokens, no cabeçalho "Authorization: Bearer <token>":
//   MISSION_TOKEN  só para enviar (POST). Vai junto do app publicado, então não é segredo forte.
//   READ_TOKEN     só para ler (GET). Fica só com a equipe médica na Terra. Sem ele, quem tem o
//                  app não descobre nem os metadados (quem, quando, prioridade vermelha).

const MAX_BODY_BYTES = 1_000_000;

function sha256(text) {
  return createHash('sha256').update(text).digest();
}

// Comparação em tempo constante, para o tempo de resposta não entregar o token aos poucos.
function tokenMatches(header, token) {
  const match = /^Bearer (.+)$/.exec(header ?? '');
  return !!match && timingSafeEqual(sha256(match[1]), sha256(token));
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readJson(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new HttpError(415, 'Envie o corpo como application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Corpo maior que 1 MB.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}

function cursorParams(url) {
  const since = Number(url.searchParams.get('since') ?? 0);
  const limit = Number(url.searchParams.get('limit') ?? 200);
  if (!Number.isInteger(since) || since < 0) throw new HttpError(400, 'since deve ser um inteiro >= 0.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new HttpError(400, 'limit deve ser de 1 a 500.');
  return { since, limit };
}

/**
 * @param {{ db: ReturnType<import('./db.js').openDb>, token: string, readToken: string, allowedOrigins: string[], now?: () => Date }} options
 */
export function createHandler({ db, token, readToken, allowedOrigins, now = () => new Date() }) {
  function send(res, status, body, origin) {
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    };
    if (origin && allowedOrigins.includes(origin)) {
      headers['access-control-allow-origin'] = origin;
      headers.vary = 'Origin';
    }
    res.writeHead(status, headers);
    res.end(body === undefined ? '' : JSON.stringify(body));
  }

  async function route(req, res, url, origin) {
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/api/health') {
      return send(res, 200, { ok: true }, origin);
    }
    if (!pathname.startsWith('/api/')) throw new HttpError(404, 'Rota não encontrada.');
    const needed = req.method === 'POST' ? token : readToken;
    if (!tokenMatches(req.headers.authorization, needed)) {
      throw new HttpError(401, req.method === 'POST' ? 'Token da missão ausente ou errado.' : 'Token de leitura ausente ou errado.');
    }

    if (pathname === '/api/packets' && req.method === 'POST') {
      const parsed = parsePacketsBody(await readJson(req));
      if (parsed.error) throw new HttpError(400, parsed.error);
      const receivedAt = now().toISOString();
      const received = db.savePackets(parsed.packets, receivedAt);
      return send(res, 200, { received, receivedAt }, origin);
    }

    if (pathname === '/api/packets' && req.method === 'GET') {
      const packets = db.listPackets(cursorParams(url));
      return send(res, 200, { packets, cursor: packets.at(-1)?.seq ?? cursorParams(url).since }, origin);
    }

    const crew = /^\/api\/crew\/([\w-]{1,64})\/packets$/.exec(pathname);
    if (crew && req.method === 'GET') {
      const packets = db.listPackets({ ...cursorParams(url), crewId: crew[1] });
      return send(res, 200, { packets, cursor: packets.at(-1)?.seq ?? cursorParams(url).since }, origin);
    }

    throw new HttpError(404, 'Rota não encontrada.');
  }

  return async function handler(req, res) {
    const origin = req.headers.origin;
    const url = new URL(req.url ?? '/', 'http://localhost');

    // Pré-verificação do navegador (CORS). Só as origens configuradas recebem permissão.
    if (req.method === 'OPTIONS') {
      if (origin && allowedOrigins.includes(origin)) {
        res.writeHead(204, {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'authorization, content-type',
          'access-control-max-age': '600',
          vary: 'Origin',
        });
      } else {
        res.writeHead(403);
      }
      return res.end();
    }

    try {
      await route(req, res, url, origin);
    } catch (error) {
      if (error instanceof HttpError) return send(res, error.status, { error: error.message }, origin);
      console.error(error);
      send(res, 500, { error: 'Erro interno.' }, origin);
    }
  };
}
