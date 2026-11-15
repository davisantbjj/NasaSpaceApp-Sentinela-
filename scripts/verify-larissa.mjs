// Edge/Windows, perfil temporário isolado, somente dados fictícios.
// Antes: npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
// Executar: node scripts/verify-larissa.mjs [--screenshots]
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const profile = await mkdtemp(join(tmpdir(), 'sentinela-privacy-test-'));
const browser = spawn(process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Edge não iniciou em 20 segundos.')), 20_000);
    browser.on('error', (error) => { clearTimeout(timeout); reject(error); });
    browser.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const pages = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
  socket = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id); clearTimeout(waiter.timeout);
    message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
  };
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP sem resposta: ${method}`)); }, 45_000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(expression) {
    const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error('Condição não alcançada: ' + expression + '\nTela atual: ' + await evaluate('document.body.innerText'));
  }
  const click = (label) => evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim().endsWith(${JSON.stringify(label)}));
    if (!button || button.disabled) throw new Error('Botão indisponível: ' + ${JSON.stringify(label)});
    button.click();
  })()`);
  const fill = (selector, value) => evaluate(`(() => {
    const field = document.querySelector(${JSON.stringify(selector)});
    if (!field) throw new Error('Campo ausente: ' + ${JSON.stringify(selector)});
    const prototype = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(field, ${JSON.stringify(value)});
    field.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  async function login(id, pin) {
    await waitFor("!!document.querySelector('#pin')");
    await evaluate(`document.querySelector('input[name="profile"][value="${id}"]').click()`);
    await fill('#pin', pin);
    await waitFor("!document.querySelector('button[type=submit]').disabled");
    await click('Entrar');
    await waitFor("!!document.querySelector('.navbar')");
  }
  // Inspeção pelos repositórios; login, check-in, mensagem e pedido usam a interface.
  const inspect = (body) => evaluate(`(async () => {
    const { db } = await import('/src/data/db.ts');
    const privacy = await import('/src/data/privacyRepo.ts');
    const messages = await import('/src/data/messagesRepo.ts');
    ${body}
  })()`);
  // O app abre em inglês; as conferências abaixo usam os textos em português.
  async function ptBR() {
    await waitFor("document.querySelector('#root')?.childElementCount > 0");
    await evaluate("(async () => { const { default: i18n } = await import('/src/i18n.ts'); await i18n.changeLanguage('pt-BR'); return true; })()");
  }
  async function screenshot(name) {
    if (!process.argv.includes('--screenshots')) return;
    await delay(300);
    const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(`docs/capturas/${name}.png`, Buffer.from(shot.data, 'base64'));
  }

  await command('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: profile });
  await command('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await ptBR();
  await waitFor("document.body.innerText.includes('Li o aviso')");
  assert.equal(await inspect('return await db.crew.count();'), 0, 'Seed criado antes da leitura');
  assert.ok(await evaluate("document.body.innerText.includes('sem criptografia')"));
  await inspect("await db.preferences.put({ key: 'privacyNotice', value: '2026-11-15-v5' });");
  await command('Page.reload');
  await ptBR();
  await waitFor("document.body.innerText.includes('Li o aviso')");
  assert.equal(await inspect('return await privacy.hasAcknowledgedPrivacyNotice();'), false);
  await click('Li o aviso — abrir demonstração');
  await login('lia', '3333');
  console.log('PASS: aviso versionado antes do seed e login da Lia pela interface');

  await evaluate("location.hash = '#/mission'");
  await waitFor(`!!document.querySelector('select[aria-label="Perfil da missão"]')`);
  assert.ok(await evaluate("document.body.innerText.includes('Metas da semana') && document.body.innerText.includes('não é prescrição')"));
  await evaluate(`(() => {
    const select = document.querySelector('select[aria-label="Perfil da missão"]');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'lunarFlyby');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor("document.body.innerText.includes('10 dias') && document.body.innerText.includes('Trânsito ao redor da Lua')");
  await evaluate("location.hash = '#/'");
  await waitFor("!!document.querySelector('.region-button')");
  await evaluate("[...document.querySelectorAll('.region-button')].find(b => b.textContent.includes('Ossos e músculos')).click()");
  await waitFor("document.body.innerText.includes('Estimativa, não medida')");
  assert.ok(await evaluate("document.body.innerText.includes('Não mede nem prevê')"));
  assert.ok(await evaluate("document.body.innerText.includes('missão curta não foi validado')"));
  await evaluate("[...document.querySelectorAll('.region-button')].find(b => b.textContent.includes('Corpo inteiro')).click()");
  await waitFor("document.body.innerText.includes('Dose acumulada registrada na missão')");
  assert.ok(await evaluate("document.body.innerText.includes('não está conectado a um dosímetro')"));
  console.log('PASS: perfil lunar M8 e contexto ósseo/radiação M5–M6 sem promessa de medição individual');

  await evaluate("location.hash = '#/checkin'");
  await waitFor("!!document.querySelector('form.step')");
  const visited = [];
  for (let i = 0; i < 20; i++) {
    const title = await evaluate("document.querySelector('form.step h2')?.textContent");
    if (!title) throw new Error('Passo inesperado antes da revisão');
    visited.push(title);
    let skip = false;
    if (title === 'Tempo de reação') {
      // Respostas de automação verificam o fluxo, não a precisão clínica do teste.
      await click('Começar o teste (3 min)');
      for (let attempt = 0; attempt < 3; attempt++) {
        await waitFor("document.querySelector('form.step [aria-live=assertive]')?.textContent.includes('Toque agora')");
        await delay(180);
        await evaluate("document.querySelector('form.step [aria-live=assertive]').closest('button').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))");
      }
      await click('Encerrar agora');
      await waitFor("document.querySelector('form.step').textContent.includes('modo completo, interrompido')");
      await click('Versão curta (30 s, para demonstração)');
      // Aguarda os 30 s reais. O sinal é respondido após 180 ms, sem mudar o relógio do app.
      await evaluate(`new Promise((resolve, reject) => {
        let responding = false;
        const deadline = Date.now() + 40000;
        const interval = setInterval(() => {
          const signal = document.querySelector('form.step [aria-live=assertive]');
          if (!signal) { clearInterval(interval); resolve(true); return; }
          if (Date.now() > deadline) { clearInterval(interval); reject(new Error('Teste curto não terminou')); return; }
          if (!responding && signal.textContent.includes('Toque agora')) {
            responding = true;
            setTimeout(() => {
              signal.closest('button')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
              responding = false;
            }, 180);
          }
        }, 50);
      })`);
      await waitFor("document.querySelector('form.step').textContent.includes('modo curto;')");
    } else if (await evaluate("!!document.querySelector('#heartRate')")) {
      await fill('#heartRate', '70');
      await evaluate("[...document.querySelectorAll('form.step label')].find(l => l.textContent.includes('Sensor vestível')).querySelector('input').click()");
    } else if (await evaluate("!!document.querySelector('#radiationDose')")) {
      await fill('#radiationDose', '400');
      await evaluate("[...document.querySelectorAll('form.step label')].find(l => l.textContent.includes('Dosímetro pessoal')).querySelector('input').click()");
    } else if (await evaluate("!!document.querySelector('input[name=stress]')")) {
      await evaluate(`document.querySelector('input[name=stress][value="4"]').click()`);
    } else if (await evaluate("!!document.querySelector('input[name=workload]')")) {
      await evaluate(`document.querySelector('input[name=workload][value="3"]').click()`);
    } else if (await evaluate("!!document.querySelector('#exerciseAerobic')")) {
      await fill('#exerciseAerobic', '30'); await fill('#resistanceMinutes', '20');
    } else if (await evaluate("document.querySelector('form.step legend')?.textContent === 'Doses de hoje'")) {
      // Vitamina tomada, colírio não tomado. O app não registra cada dose/horário.
      await evaluate("document.querySelector('form.step input[type=checkbox]').click()");
    } else skip = true;
    const next = skip ? 'Pular' : await evaluate("document.querySelector('form.step button[type=submit]').textContent");
    await click(next);
    await waitFor(`!document.querySelector('form.step') || document.querySelector('form.step h2').textContent !== ${JSON.stringify(title)}`);
    if (await evaluate("document.body.innerText.includes('Confira antes de salvar')")) break;
  }
  for (const title of ['Estresse', 'Carga de trabalho', 'Exercício', 'Medicação', 'Tempo de reação']) assert.ok(visited.includes(title), `Passo não percorrido: ${title}`);
  await waitFor("document.body.innerText.includes('Confira antes de salvar')");
  await click('Salvar check-in');
  await waitFor("document.body.innerText.toLowerCase().includes('check-in salvo')");
  console.log('PASS: check-in M1–M3 pela interface, com exercício em dois campos');

  await evaluate("location.hash = '#/medical-contact'");
  await waitFor("!!document.querySelector('textarea')");
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  await inspect(`for (const text of ['   ', 'x'.repeat(2001)]) {
    let rejected = false;
    try { await messages.saveMedicalMessage('lia', text); } catch { rejected = true; }
    if (!rejected) throw new Error('Mensagem inválida aceita');
  }`);
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await fill('textarea', '<script>exemplo fictício</script>');
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  await click('Salvar mensagem local');
  await waitFor("document.body.innerText.includes('Mensagem salva somente neste dispositivo')");
  assert.equal(await evaluate("!!document.querySelector('.message-body script')"), false);
  assert.ok(await evaluate("document.querySelector('.message-body').textContent.includes('<script>exemplo fictício</script>')"));
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'Rolagem horizontal na comunicação');
  await screenshot('comunicacao-mobile');

  await evaluate("location.hash = '#/your-data'");
  await waitFor("document.body.innerText.includes('Cópia e pedido de exclusão')");
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'Rolagem horizontal em Seus dados');
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Excluir meu histórico'))"), false);
  await click('Registrar pedido de exclusão');
  await waitFor("document.body.innerText.includes('Pedido registrado. Nada foi apagado')");
  assert.ok(await inspect(`const first = await privacy.getCrewDeletionRequest('lia');
    await privacy.requestCrewDataDeletion('lia');
    const second = await privacy.getCrewDeletionRequest('lia');
    return first.id === second.id && first.createdAt === second.createdAt && await db.deletionRequests.count() === 1;`));
  await click('Exportar meus dados em JSON');
  let downloaded;
  for (let i = 0; i < 100; i++) {
    downloaded = (await readdir(profile)).find((name) => /^sentinela-lia-.*\.json$/.test(name));
    if (downloaded) break;
    await delay(100);
  }
  assert.ok(downloaded, 'Download JSON não concluído');
  const copy = JSON.parse(await readFile(join(profile, downloaded), 'utf8'));
  assert.equal(copy.crew.id, 'lia');
  assert.equal('missionProfile' in copy, false, 'Preferência compartilhada incluída como dado individual');
  assert.ok(copy.crew.medications.some((m) => m.id === 'eyeDrops'));
  assert.equal(copy.records.length, 61, 'Pedido apagou registros ou check-in não foi salvo');
  assert.equal(copy.medicalMessages.length, 1);
  assert.equal(copy.medicalMessages[0].body, '<script>exemplo fictício</script>');
  for (const row of [...copy.records, ...copy.medicalMessages, ...copy.deletionRequests, ...copy.alertReviews]) assert.equal(row.crewId, 'lia');
  for (const row of copy.accessLog) assert.equal(row.subjectCrewId, 'lia');
  const today = copy.records.find((r) => r.values.stress === 4 && r.values.workload === 3);
  assert.ok(today, 'Valores novos ausentes na exportação');
  assert.equal(today.values.exerciseMinutes, 50);
  assert.equal(today.values.resistanceMinutes, 20);
  assert.ok(today.values.reactionTime >= 100);
  assert.equal(today.values.reactionTest.mode, 'short');
  assert.equal(today.values.reactionTest.completed, true);
  assert.ok(today.values.reactionTest.elapsedSeconds >= 30);
  assert.ok(today.values.reactionTest.validResponses >= 3);
  assert.equal(today.values.sources.heartRate, 'wearable');
  assert.equal(today.values.sources.radiationDose, 'dosimeter');
  assert.ok(await inspect(`const { seriesPoints, hasValue } = await import('/src/lib/series.ts');
    const values = (await privacy.exportCrewData('lia')).records.find(r => r.id === ${JSON.stringify(today.id)}).values;
    return hasValue(values, 'reactionTime') && seriesPoints(values, 'reactionTime').length === 0;`));
  assert.equal(today.values.medication.find((m) => m.id === 'eyeDrops').taken, false);
  assert.equal(today.values.medication.find((m) => m.id === 'vitaminD').taken, true);
  assert.equal('sealed' in today, false);
  assert.ok(await inspect(`const row = await db.records.get(${JSON.stringify(today.id)});
    const message = (await db.medicalMessages.toArray())[0];
    return !!row.sealed && !('values' in row) && !!message.sealed && !('body' in message)
      && await db.records.where('crewId').equals('ana').count() === 60
      && await db.records.where('crewId').equals('kenji').count() === 60;`));
  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await screenshot('seus-dados-desktop');
  console.log('PASS: JSON isolado com resultado/modo de reação e origens declaradas; teste curto fora da série pessoal; mensagens e pedido preservados');

  await command('Page.reload');
  await ptBR();
  await login('lia', '3333');
  await waitFor("document.body.innerText.includes('Pedido registrado localmente')");
  assert.ok(await inspect("return (await privacy.exportCrewData('lia')).records.length === 61 && (await messages.listMedicalMessages('lia')).length === 1;"));
  console.log('PASS: bloqueio ao recarregar e persistência dos dados e do pedido');

  await evaluate("document.querySelector('.user-menu summary').click()");
  await click('Bloquear e trocar de perfil');
  await login('kenji', '2222');
  await evaluate("location.hash = '#/mission'");
  await waitFor("document.body.innerText.includes('Recriar dados de demonstração')");
  await click('Recriar dados de demonstração');
  await waitFor("document.body.innerText.includes('Sim, apagar e recriar')");
  await click('Sim, apagar e recriar');
  await waitFor("!!document.querySelector('#pin')");
  // O bloqueio é imediato; a geração das chaves e dos 180 registros termina depois.
  await waitFor("(async () => { const { db } = await import('/src/data/db.ts'); return await db.records.count() === 180 && await db.profiles.count() === 4; })()");
  const resetValid = await inspect(`return await db.records.count() === 180 && await db.medicalMessages.count() === 0
    && await db.deletionRequests.count() === 0 && await privacy.hasAcknowledgedPrivacyNotice();`);
  assert.ok(resetValid, 'Reset não limpou mensagens/pedidos ou perdeu a leitura do aviso');
  console.log('PASS: reset pelo oficial médico limpa mensagens/pedidos e preserva a leitura');
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    socket.close();
  }
  browser.kill();
  console.log('Perfil isolado, downloads e dados fictícios: ' + profile);
}
