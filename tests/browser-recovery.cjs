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


    if(process.env.P52_BROWSER==="1"){
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
      await reset();
      assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("nav button")).map(x=>x.textContent.trim())'),['CONOTA','NOTAGENT']);
      const styles=selector=>'(()=>{const el=document.querySelector('+JSON.stringify(selector)+');const c=getComputedStyle(el);return [c.fontFamily,c.fontSize,c.lineHeight,c.backgroundColor,c.borderColor,c.borderRadius,c.boxShadow,el.getBoundingClientRect().width,el.getBoundingClientRect().height]})()';
      const consoleStyle=await evaluate(styles('[data-testid=console-mode-panel] section'));
      await type('!whois!');await enter();await until(()=>evaluate('document.body.innerText.includes("A Straight Line of Our Origin")'),'CONOTA canon');
      await healthy('P5.2 CONOTA original canon and navigation');
      const fixture=()=>{
        window.__p52requests=[];
        window.__p52authenticated=true;
        window.__p52ledger={admission_enabled:true,total_cap_microusd:5000000,daily_cap_microusd:1000000,spent_total_microusd:154,reserved_total_microusd:0};
        window.confirm=()=>true;
        const original=window.fetch;
        window.fetch=async(url,opt)=>{
          if(url==='/api/ai/pilot-session'){
            if(opt?.body&&JSON.parse(opt.body).action==='logout')window.__p52authenticated=false;
            return Response.json({authenticated:window.__p52authenticated});
          }
          if(url==='/api/ai/pilot-budget'){
            if(!window.__p52authenticated)return Response.json({error:'owner_session_required'},{status:401});
            return Response.json({ledger:window.__p52ledger,tokens:{token_cap:490000,input_tokens:479,output_tokens:260,reasoning_tokens:0,reserved_tokens:0,completed_requests:4},model_enabled:true});
          }
          if(url==='/api/ai/pilot'){
            const req=JSON.parse(opt.body);window.__p52requests.push(req);
            if(req.message==='reject')return Response.json({error:'admission_denied'},{status:429});
            const stop=req.message==='stop fixture';
            const out=req.history.length?'Recalled '+req.history[0].content:'We are Prof. NOTA. <img src=x onerror=alert(1)>';
            const encoder=new TextEncoder();
            const frame=(event,data)=>encoder.encode('event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n');
            return new Response(new ReadableStream({start(controller){
              controller.enqueue(frame('meta',{context:{droppedPairs:0}}));
              controller.enqueue(frame('delta',{text:stop?'First fragment':out}));
              const finish=()=>{if(stop)controller.enqueue(frame('delta',{text:'HIDDEN_LATE_FRAGMENT'}));controller.enqueue(frame('done',{usage:{input:100,output:20,reasoning:0},finish:'stop'}));controller.close();};
              if(stop)setTimeout(finish,1200);else finish();
            }}),{headers:{'content-type':'text/event-stream'}});
          }
          return original(url,opt);
        };
      };
      await evaluate('('+fixture.toString()+')()');
      const click=async sel=>evaluate('document.querySelector('+JSON.stringify(sel)+').click()');
      const byText=async label=>evaluate('Array.from(document.querySelectorAll("[data-testid=notagent-terminal] button")).find(b=>b.textContent.trim()==='+JSON.stringify(label)+').click()');
      await click('[data-testid=mode-pilot]');
      await until(()=>evaluate('document.activeElement?.id==="notagent-input" && document.body.innerText.includes("CONNECTED")'),'NOTAGENT signed-in fixture');
      assert.deepEqual(await evaluate(styles('[data-testid=notagent-terminal]')),consoleStyle);
      async function prompt(value){
        await evaluate('document.querySelector("#notagent-input").focus()');
        await send('Input.insertText',{text:value});
        await until(()=>evaluate('Array.from(document.querySelectorAll("[data-testid=notagent-terminal] button")).some(b=>b.textContent.trim()==="Send"&&!b.disabled)'), 'composer ready');
        await enter();
      }
      async function completed(count){
        await until(()=>evaluate('window.__p52requests.length==='+count+' && document.body.innerText.includes("Response complete. Usage recorded.") && !document.querySelector("#notagent-input").disabled'),'completed turn '+count);
      }
      await prompt('Marker <img src=x onerror=alert(1)>');
      await completed(1);
      assert.equal(await evaluate('document.querySelector("#notagent-input").value'),'');
      assert.equal(await evaluate('document.querySelectorAll("[data-testid=notagent-user] img,[data-testid=notagent-answer] img").length'),0);
      await prompt('What marker?');await completed(2);
      assert.equal(await evaluate('window.__p52requests[1].history.length'),2);
      assert.equal(await evaluate('document.querySelectorAll("[data-testid=notagent-answer]").length'),2);
      await click('[data-testid=mode-console]');await click('[data-testid=mode-pilot]');
      await until(()=>evaluate('document.querySelectorAll("[data-testid=notagent-answer]").length===2'),'switch preserves transcript');
      await healthy('P5.2 shared visual styles, escaped text, multi-turn and switch retention');
      await prompt('stop fixture');
      await until(()=>evaluate('document.body.innerText.includes("First fragment")'),'stop fixture started');
      await byText('Stop');
      await until(()=>evaluate('document.body.innerText.includes("Provider usage settled")'),'stop drains and settles');
      assert.equal(await evaluate('document.body.innerText.includes("HIDDEN_LATE_FRAGMENT")'),false);
      await prompt('After stop');await completed(4);
      assert.equal(await evaluate('window.__p52requests[3].history.length'),4);
      await byText('New Chat');
      await until(()=>evaluate('document.querySelectorAll("[data-testid=notagent-user]").length===0'),'new chat clears transcript');
      await prompt('Fresh');await completed(5);
      assert.equal(await evaluate('window.__p52requests[4].history.length'),0);
      await prompt('reject');
      await until(()=>evaluate('document.querySelector("#notagent-input").value==="reject" && document.body.innerText.includes("admission_denied")'),'rejected draft restored');
      assert.equal(await evaluate('document.querySelectorAll("[data-testid=notagent-answer]").length'),1);
      await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:false});
      assert.equal(await evaluate('(()=>{const r=document.querySelector("#notagent-input").getBoundingClientRect();return r.width>100&&r.right<=innerWidth&&r.bottom<=innerHeight})()'),true);
      await healthy('P5.2 Stop, New Chat, rejected draft and narrow composer');
      await byText('Sign out');
      await until(()=>evaluate('!!document.querySelector("#pilot-owner-email")&&!document.querySelector("#notagent-input")'),'logout removes transcript');
      assert.equal(await evaluate('JSON.stringify(localStorage).includes("Marker")||JSON.stringify(sessionStorage).includes("Marker")'),false);
      await healthy('P5.2 local logout and no transcript storage');
      return;
    }

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

    // P5.1: Browser-only controlled SSE fixture; real Vercel API is tested
    // separately in Node and must never be assumed to run under Vite preview.
    await reset();
    await send('Runtime.evaluate', { expression: [
      'window.__p51calls = 0;',
      'window.__p51originalFetch = window.fetch;',
      'window.fetch = async (url, options) => {',
      '  if (url !== "/api/ai/chat") return window.__p51originalFetch(url, options);',
      '  window.__p51calls++;',
      '  const encoder = new TextEncoder();',
      '  const frames = [',
      '    "data: " + JSON.stringify({ type: "meta", mode: "scripted-preview" }) + "\\n\\n",',
      '    "data: " + JSON.stringify({ type: "delta", text: "Scripted " }) + "\\n\\n",',
      '    "data: " + JSON.stringify({ type: "delta", text: "backend response" }) + "\\n\\n",',
      '    "data: " + JSON.stringify({ type: "done" }) + "\\n\\n"',
      '  ];',
      '  return new Response(new ReadableStream({ start(controller) {',
      '    for (const frame of frames) controller.enqueue(encoder.encode(frame));',
      '    controller.close();',
      '  }}), { status: 200, headers: { "Content-Type": "text/event-stream; charset=utf-8" } });',
      '};'
    ].join('\n') });
    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mode-foundation]").click()' });
    await until(() => evaluate('document.querySelector("[data-testid=foundation-mode-panel]").getAttribute("aria-hidden") === "false"'), 'Foundation mode visible');
    await until(() => evaluate('document.activeElement?.id === "foundation-input"'), 'Foundation input focused');
    await send('Input.insertText', { text: '<img src=x onerror=alert(1)>' });
    await enter();
    await until(() => evaluate('document.querySelectorAll("[data-testid=foundation-visitor]").length === 1'), 'Foundation visitor added');
    await until(() => evaluate('document.querySelectorAll("[data-testid=foundation-nota]").length === 2 && document.body.innerText.includes("Scripted backend response")'), 'Foundation stream parsed');
    assert.equal(await evaluate('window.__p51calls'), 1, 'Foundation performs only one scoped backend fetch');
    assert.equal(await evaluate('document.querySelectorAll("[data-testid=foundation-visitor] img").length'), 0, 'Foundation input rendered safely as text');
    await healthy('P5.1 streamed SSE frontend and escaped input');

    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=foundation-clear]").click()' });
    await until(() => evaluate('document.querySelectorAll("[data-testid=foundation-visitor]").length === 0'), 'Foundation transcript cleared');
    await send('Runtime.evaluate', { expression: 'document.querySelector("[data-testid=mode-console]").click()' });
    await until(() => evaluate('document.querySelector("[data-testid=console-mode-panel]").getAttribute("aria-hidden") === "false"'), 'Console restored after foundation');
    await until(keyboardListenerReady, 'Console keyboard restored from foundation mode');
    await type('!prof!');
    await enter();
    await until(() => evaluate('document.body.innerText.includes("All Command Prompts")'), 'Legacy Console after foundation');
    await healthy('P5.1 Console restored after server sandbox');

    console.log('PASS: 12 Chrome browser checks (7 baseline + 3 P5.0 + 2 P5.1 sandbox)');
  } finally {
    if (ws) ws.close();
    if (chrome) chrome.kill();
    if (preview) preview.kill();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 2 }); }
    catch { /* Browser process may still be shutting down. */ }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
