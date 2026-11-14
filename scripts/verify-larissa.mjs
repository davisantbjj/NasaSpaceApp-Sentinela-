// Teste de integração real no IndexedDB do Edge, com perfil temporário isolado.
// Antes: npm run dev -- --host 127.0.0.1 --port 5173
// Executar: node scripts/verify-larissa.mjs
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:5173';
const profile = await mkdtemp(join(tmpdir(), 'sentinela-privacy-test-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Edge não iniciou em 20 segundos.')), 20000);
    browser.on('error', (error) => { clearTimeout(timeout); reject(error); });
    browser.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const port = new URL(endpoint).port;
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
    }
  };
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(expression) {
    const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Condição não alcançada: ' + expression + '\nTela atual: ' + await evaluate('document.body.innerText'));
  }
  await command('Page.navigate', { url: origin });
  await waitFor("document.body.innerText.includes('Li o aviso')");
  console.log('PASS: aviso antes dos formulários');

  console.log(await evaluate(`(async () => {
    const { db } = await import('/src/data/db.ts');
    if (await db.crew.count() !== 0) throw new Error('Seed criado antes do aviso');
    // Simula migração de uma instalação anterior, apenas no perfil temporário.
    const Dexie = Object.getPrototypeOf(db.constructor);
    db.close(); await db.delete();
    const old = new Dexie('sentinela');
    old.version(3).stores({ crew: 'id', records: 'id, crewId, date, [crewId+date]', settings: 'key' });
    await old.crew.put({ id: 'legacy', name: 'Legado fictício', role: 'Teste', missionStart: '2026-01-01', trackedIndicators: [] });
    await old.records.put({ id: 'legacy_2026-01-01', crewId: 'legacy', date: '2026-01-01', missionDay: 1, values: { mood: 4 }, createdAt: '2026-01-01' });
    old.close(); await db.open();
    if (!(await db.records.get('legacy_2026-01-01'))) throw new Error('Migração perdeu registros');
    if (db.verno !== 4) throw new Error('Versão incorreta');
    const privacy = await import('/src/data/privacyRepo.ts');
    await privacy.acknowledgePrivacyNotice();
    const { resetDemo } = await import('/src/data/seed.ts');
    await resetDemo();
    const messages = await import('/src/data/messagesRepo.ts');
    await messages.saveMedicalMessage('ana', '<script>exemplo fictício</script>');
    await messages.saveMedicalMessage('kenji', 'Mensagem de outro perfil');
    for (const body of ['   ', 'x'.repeat(2001)]) {
      let rejected = false;
      try { await messages.saveMedicalMessage('ana', body); } catch { rejected = true; }
      if (!rejected) throw new Error('Mensagem inválida aceita');
    }
    await privacy.requestCrewDataDeletion('ana');
    const first = await privacy.getCrewDeletionRequest('ana');
    await privacy.requestCrewDataDeletion('ana');
    const second = await privacy.getCrewDeletionRequest('ana');
    if (first.createdAt !== second.createdAt || await db.deletionRequests.count() !== 1) throw new Error('Pedido duplicado');
    const copy = await privacy.exportCrewData('ana');
    if (copy.crew.id !== 'ana' || copy.records.length !== 60 || copy.medicalMessages.length !== 1 || copy.deletionRequests.length !== 1) throw new Error('Exportação incompleta');
    if ([...copy.records, ...copy.medicalMessages, ...copy.deletionRequests].some(x => x.crewId !== 'ana')) throw new Error('Exportação vazou outro perfil');
    return 'PASS: migração v3→v4, aviso antes do seed, validação de mensagens, pedido idempotente e exportação isolada';
  })()`));

  // Entrar pela interface evita importar uma segunda instância do store quando
  // o Vite acrescenta timestamps de HMR aos imports usados pelo React.
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Li o aviso')).click()");
  await waitFor("document.body.innerText.includes('Ana Ribeiro') && !document.body.innerText.includes('Li o aviso')");

  await evaluate("location.hash = '#/medical-contact'");
  await waitFor("document.body.innerText.includes('<script>exemplo fictício</script>')");
  if (await evaluate("!!document.querySelector('.message-body script')")) throw new Error('HTML executável na mensagem');
  console.log('PASS: histórico de mensagens renderiza texto sem interpretar HTML');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`(() => {
    const field = document.querySelector('textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, 'Exemplo fictício: preciso mostrar uma mensagem à equipe.');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("document.body.innerText.includes('Mensagem salva somente neste dispositivo')");
  if (await evaluate('document.documentElement.scrollWidth > innerWidth')) throw new Error('Rolagem horizontal na comunicação mobile');
  console.log('PASS: formulário salva pela interface no celular, sem rolagem horizontal');
  if (process.argv.includes('--screenshots')) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile('docs/capturas/comunicacao-mobile.png', Buffer.from(shot.data, 'base64'));
  }

  await evaluate("location.hash = '#/your-data'");
  await waitFor("document.body.innerText.includes('Acesso e exclusão local')");
  if (await evaluate('document.documentElement.scrollWidth > innerWidth')) throw new Error('Rolagem horizontal em Seus dados mobile');
  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  if (process.argv.includes('--screenshots')) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const size = (await command('Page.getLayoutMetrics')).cssContentSize;
    const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 } });
    await writeFile('docs/capturas/seus-dados-desktop.png', Buffer.from(shot.data, 'base64'));
  }
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Excluir meu histórico local')).click()");
  await waitFor("document.body.innerText.includes('Sim, excluir o histórico deste perfil')");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sim, excluir o histórico deste perfil')).click()");
  await waitFor("document.body.innerText.includes('Histórico local excluído')");
  console.log(await evaluate(`(async () => {
    const { db } = await import('/src/data/db.ts');
    if (await db.records.where('crewId').equals('ana').count() || await db.medicalMessages.where('crewId').equals('ana').count() || await db.deletionRequests.count()) throw new Error('Exclusão incompleta');
    if (await db.records.where('crewId').equals('kenji').count() !== 60 || await db.medicalMessages.where('crewId').equals('kenji').count() !== 1) throw new Error('Outro perfil foi afetado');
    return 'PASS: confirmação na interface e exclusão isolada';
  })()`));
  await command('Page.reload');
  await waitFor("document.body.innerText.includes('Acesso e exclusão local')");
  await evaluate("location.hash = '#/'");
  await waitFor("document.body.innerText.includes('Sem registros para avaliar')");
  if (await evaluate("document.querySelector('.region-list').textContent.includes('OK')")) throw new Error('Região vazia foi mostrada como normal');
  console.log(await evaluate(`(async () => {
    const { db } = await import('/src/data/db.ts');
    const privacy = await import('/src/data/privacyRepo.ts');
    if (await db.records.where('crewId').equals('ana').count()) throw new Error('Histórico reapareceu');
    if (!await privacy.hasAcknowledgedPrivacyNotice()) throw new Error('Aviso perdeu leitura');
    const { resetDemo } = await import('/src/data/seed.ts');
    await resetDemo();
    if (await db.records.count() !== 180 || await db.medicalMessages.count() || await db.deletionRequests.count()) throw new Error('Reset incompleto');
    if (!await privacy.hasAcknowledgedPrivacyNotice()) throw new Error('Reset apagou leitura');
    return 'PASS: exclusão persiste ao recarregar e reset limpa mensagens/pedidos preservando leitura';
  })()`));
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    socket.close();
  }
  browser.kill();
  console.log('Perfil de teste isolado (sem dados reais): ' + profile);
}
