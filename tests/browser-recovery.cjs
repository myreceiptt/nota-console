'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(fn, label, maxMs = 25000) {
  const started = Date.now();
  let failure;
  while (Date.now() - started < maxMs) {
    try { const result = await fn(); if (result) return result; }
    catch (e) { failure = e; }
    await delay(120);
  }
  throw new Error('Timeout: ' + label + (failure ? ' / ' + failure.message : ''));
}

function chromeBinary() {
  for (const binary of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try { return execFileSync('which', [binary], { encoding: 'utf8' }).trim(); }
    catch { /* Try another available browser. */ }
  }
  throw Error('Chromium browser binary missing');
}

async function main() {
  let preview, chrome, ws;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nota-browser-'));
  const errors = [];
  try {
    const url = 'http://127.0.0.1:4173/';
    const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    assert.ok(fs.existsSync(vite), 'Build/install must finish before browser test');
    preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
      cwd: root, stdio: 'ignore',
    });
    await until(async () => (await fetch(url)).ok, 'Vite preview HTTP 200');
    chrome = spawn(chromeBinary(), [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-extensions', '--no-first-run', '--remote-allow-origins=*',
      '--remote-debugging-port=0', '--user-data-dir=' + profile, url,
    ], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    await until(() => fs.existsSync(portFile), 'Chrome remote debugging');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const debugging = 'http://127.0.0.1:' + port;
    const version = await (await fetch(debugging + '/json/version')).json();
    console.log('Browser: ' + version.Browser);
    const major = Number((version.Browser.match(/Chrome\/(\d+)/) || [])[1] || 0);
    if (major < 150) console.warn('Browser predates Chrome 150; Promise case separately covered by unit tests.');
    const pages = await (await fetch(debugging + '/json/list')).json();
    const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
    assert.ok(page, 'CDP page target must exist');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    const pending = new Map();
    let nextId = 0;
    ws.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') {
        const e = message.params.exceptionDetails;
        errors.push(e.exception?.description || e.text || 'Unknown JS exception');
      }
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    await send('Runtime.enable');
    await send('Page.enable');
    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    }
    async function key(key, code, value, text = '', modifiers = 0) {
      const base = { key, code, windowsVirtualKeyCode: value, nativeVirtualKeyCode: value, modifiers };
      await send('Input.dispatchKeyEvent', { ...base, type: 'keyDown', text });
      await send('Input.dispatchKeyEvent', { ...base, type: 'keyUp' });
      await delay(20);
    }
    async function type(value) {
      for (const c of value) {
        const upper = c.toUpperCase();
        await key(c, c === '!' ? 'Digit1' : 'Key' + upper,
          c === '!' ? 49 : upper.charCodeAt(0), c, c === '!' ? 8 : 0);
      }
    }
    const enter = () => key('Enter', 'Enter', 13);
    async function keyboardListenerReady() {
      // The terminal registers its document keydown handler in a React effect.
      // DOM visibility alone does not prove that effect has run yet.
      const doc = await send('Runtime.evaluate', { expression: 'document' });
      const objectId = doc.result?.objectId;
      if (!objectId) return false;
      const { listeners } = await send('DOMDebugger.getEventListeners', { objectId });
      return listeners.some((listener) => listener.type === 'keydown');
    }
    let visit = 0;
    async function reset() {
      const n = ++visit;
      await send('Page.navigate', { url: url + '?recovery=' + n });
      await until(() => evaluate('location.search.includes("recovery=' + n + '") && !!document.querySelector("section") && document.body.innerText.includes("Message of The Day")'), 'terminal initial render');
      await until(keyboardListenerReady, 'React document keyboard handler attached');
      await send('Page.bringToFront');
      errors.length = 0;
    }
    async function healthy(label) {
      await delay(200);
      assert.equal(await evaluate('!!document.querySelector("section")'), true, label + ': blank page');
      assert.deepEqual(errors, [], label + ': JS exception');
      console.log('PASS: ' + label);
    }
    async function promptHas(value) {
      return evaluate('Array.from(document.querySelectorAll("span.ml-2")).some(el => el.textContent.trim() === ' + JSON.stringify(value) + ')');
    }
    async function promptDraft(value) {
      // Auto-complete adds ghost text to textContent; inspect actual typed text.
      return evaluate('Array.from(document.querySelectorAll("span.ml-2")).some(el => (el.firstChild?.textContent || "").trim() === ' + JSON.stringify(value) + ')');
    }

    await reset();
    // Web Analytics v2 must preserve the existing React component integration
    // and inject exactly one production tracking script without UI changes.
    await until(
      () => evaluate('document.querySelectorAll("script[data-sdkn=\\\"@vercel/analytics/react\\\"]").length === 1'),
      'Vercel Analytics v2 script injected once',
    );
    assert.equal(
      await evaluate('document.querySelector("script[data-sdkn=\\\"@vercel/analytics/react\\\"]").dataset.sdkv'),
      '2.0.1',
      'React Analytics should use the approved v2.0.1 release',
    );
    assert.equal(
      await evaluate('document.querySelector("script[data-sdkn=\\\"@vercel/analytics/react\\\"]").getAttribute("src")'),
      '/_vercel/insights/script.js',
      'Analytics should keep the existing default Vercel intake path',
    );
    await healthy('Vercel Analytics v2 single script injection');

    await type('x');
    await until(() => promptHas('x'), 'first character displayed');
    await healthy('first keystroke');

    await reset();
    await type('!prof!');
    await enter();
    await until(() => evaluate('document.body.innerText.includes("All Command Prompts")'), '!prof! output');
    await healthy('!prof! Enter');

    await reset();
    await type('!pro');
    await key('Tab', 'Tab', 9);
    await until(() => evaluate('Array.from(document.querySelectorAll("span.text-nota-yellow")).some(el => el.textContent === "!prof!")'), 'Tab autocomplete');
    await enter();
    await until(() => evaluate('document.body.innerText.includes("All Command Prompts")'), 'autocompleted command output');
    await healthy('autocomplete and Enter');

    await reset();
    await type('!zz!');
    await enter();
    await until(() => evaluate('document.body.innerText.includes("command not found")'), 'unknown command output');
    await healthy('unknown command');

    await reset();
    await type('!clear!');
    await enter();
    await until(() => evaluate('!document.body.innerText.includes("Message of The Day")'), '!clear! output');
    await healthy('clear command');

    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: false });
    await reset();
    await type('x');
    await until(() => promptHas('x'), 'narrow viewport input');
    await healthy('narrow viewport input');

    console.log('PASS: 7 browser smoke checks (6 terminal + 1 Analytics v2)');

    // P5.0 only: AI Chat is a local mock, with no provider/backend or raw HTML.
    // Check that switching modes preserves Console drafts and its legacy commands.
    await reset();
    await type('!pro');
    await until(() => promptDraft('!pro'), 'Console draft exists before switching');
    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mode-ai]").click()' });
    await until(
      () => evaluate('document.querySelector("[data-testid=ai-mode-panel]").getAttribute("aria-hidden") === "false"'),
      'mock AI panel active',
    );
    await until(() => evaluate('document.activeElement && document.activeElement.id === "mock-chat-input"'), 'AI input focus');
    assert.equal(await evaluate('document.querySelector("[data-testid=mode-ai]").getAttribute("aria-pressed")'), 'true');

    // HTML-like visitor text must remain plain text in React, never executable markup.
    const injection = '<img src=x onerror=alert(1)>';
    await send('Input.insertText', { text: injection });
    await until(
      () => evaluate('document.querySelector("#mock-chat-input").value.includes("<img src=x")'),
      'AI accepts literal text with angle brackets',
    );
    await enter();
    await until(
      () => evaluate('document.querySelectorAll("[data-testid=mock-message-visitor]").length === 1'),
      'mock visitor message rendered',
    );
    assert.equal(
      await evaluate('document.querySelectorAll("[data-testid=mock-message-visitor] img").length'),
      0,
      'Mock user input must never be parsed as HTML',
    );
    assert.equal(
      await evaluate('document.querySelectorAll("[data-testid=mock-message-nota]").length'),
      2,
      'Mock assistant adds only scripted local text',
    );
    await healthy('P5.0 mock chat text escaping and keyboard focus');

    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mock-retry]").click()' });
    await until(
      () => evaluate('document.querySelectorAll("[data-testid=mock-message-nota]").length === 3'),
      'mock retry',
    );
    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mock-clear]").click()' });
    await until(
      () => evaluate('document.querySelectorAll("[data-testid=mock-message-visitor]").length === 0'),
      'mock chat clear',
    );
    await healthy('P5.0 mock retry and clear');

    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mode-console]").click()' });
    await until(
      () => evaluate('document.querySelector("[data-testid=console-mode-panel]").getAttribute("aria-hidden") === "false"'),
      'Console mode restored',
    );
    await until(keyboardListenerReady, 'Console document key handler restored');
    await until(() => promptDraft('!pro'), 'Console draft preserved across mode switch');
    await key('Tab', 'Tab', 9);
    await enter();
    await until(() => evaluate('document.body.innerText.includes("All Command Prompts")'), 'Console autocomplete after switch');
    await healthy('P5.0 Console parity after mock AI return');

    console.log('PASS: 10 browser checks (7 baseline + 3 P5.0 mock tests)');
  } finally {
    if (ws) ws.close();
    if (chrome) chrome.kill();
    if (preview) preview.kill();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 2 }); }
    catch { /* Browser process may still be shutting down. */ }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
