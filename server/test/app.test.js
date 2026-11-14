import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { createHandler } from '../src/app.js';
import { openDb } from '../src/db.js';

const TOKEN = 'token-de-teste-com-16+';
const READ = 'leitura-de-teste-com-16+';
const ORIGIN = 'http://localhost:5173';
let base;
let server;
let db;

before(async () => {
  db = openDb(':memory:');
  server = createServer(createHandler({ db, token: TOKEN, readToken: READ, allowedOrigins: [ORIGIN] }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
});

function packet(id, overrides = {}) {
  return {
    id,
    crewId: 'ana',
    date: '2026-11-14',
    createdAt: '2026-11-14T10:00:00.000Z',
    sentAt: '2026-11-14T10:00:05.000Z',
    priority: 'normal',
    sealed: { iv: 'AAAAAAAAAAAAAAAA', data: 'c2VncmVkbw==' },
    ...overrides,
  };
}

function call(path, { method = 'GET', body, token = method === 'POST' ? TOKEN : READ, headers = {} } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('backend do Sentinela', () => {
  it('health responde sem token', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });

  it('recusa sem token ou com token errado', async () => {
    assert.equal((await call('/api/packets', { token: null })).status, 401);
    assert.equal((await call('/api/packets', { token: 'errado' })).status, 401);
  });

  it('o token de envio não serve para ler, e o de leitura não serve para enviar', async () => {
    assert.equal((await call('/api/packets?since=0', { token: TOKEN })).status, 401);
    assert.equal((await call('/api/crew/ana/packets', { token: TOKEN })).status, 401);
    assert.equal((await call('/api/packets', { method: 'POST', token: READ, body: { packets: [packet('z')] } })).status, 401);
  });

  it('guarda pacotes e devolve pelo cursor, sem duplicar no reenvio', async () => {
    const first = await call('/api/packets', { method: 'POST', body: { packets: [packet('p1'), packet('p2', { crewId: 'lia', priority: 'red' })] } });
    assert.equal(first.status, 200);
    assert.deepEqual((await first.json()).received, ['p1', 'p2']);

    // Reenvio do mesmo pacote: aceito, mas não duplica.
    await call('/api/packets', { method: 'POST', body: { packets: [packet('p1')] } });

    const all = await (await call('/api/packets?since=0')).json();
    assert.deepEqual(all.packets.map((p) => p.id), ['p1', 'p2']);
    assert.equal(all.packets[1].priority, 'red');
    assert.deepEqual(all.packets[0].sealed, packet('p1').sealed); // volta exatamente como foi

    const later = await (await call(`/api/packets?since=${all.cursor}`)).json();
    assert.deepEqual(later.packets, []);
    assert.equal(later.cursor, all.cursor);
  });

  it('backup de um tripulante traz só os pacotes dele', async () => {
    const res = await (await call('/api/crew/lia/packets')).json();
    assert.deepEqual(res.packets.map((p) => p.id), ['p2']);
  });

  it('recusa pacote com formato errado', async () => {
    const bad = [
      { packets: [] },
      { packets: [packet('x', { date: '14/11/2026' })] },
      { packets: [packet('x', { priority: 'urgente' })] },
      { packets: [packet('x', { sealed: { iv: 'não é base64!', data: 'abc=' } })] },
      { packets: [packet('x', { crewId: '../etc' })] },
      { nada: true },
    ];
    for (const body of bad) {
      assert.equal((await call('/api/packets', { method: 'POST', body })).status, 400, JSON.stringify(body));
    }
  });

  it('recusa corpo que não é JSON e corpo grande demais', async () => {
    const notJson = await fetch(`${base}/api/packets`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'text/plain' },
      body: 'oi',
    });
    assert.equal(notJson.status, 415);
    const huge = await call('/api/packets', { method: 'POST', body: { packets: [packet('h', { sealed: { iv: 'AAAA', data: 'A'.repeat(1_100_000) } })] } });
    assert.equal(huge.status, 413);
  });

  it('CORS: só a origem configurada recebe permissão', async () => {
    const ok = await fetch(`${base}/api/packets`, { method: 'OPTIONS', headers: { origin: ORIGIN } });
    assert.equal(ok.status, 204);
    assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
    const other = await fetch(`${base}/api/packets`, { method: 'OPTIONS', headers: { origin: 'https://exemplo.invalid' } });
    assert.equal(other.status, 403);
    const get = await call('/api/packets', { headers: { origin: 'https://exemplo.invalid' } });
    assert.equal(get.headers.get('access-control-allow-origin'), null);
  });

  it('since inválido dá 400', async () => {
    assert.equal((await call('/api/packets?since=-1')).status, 400);
    assert.equal((await call('/api/packets?since=abc')).status, 400);
  });
});
