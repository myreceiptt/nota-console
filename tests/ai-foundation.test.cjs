'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');

const handler = import('../api/ai/chat.mjs').then((mod) => mod.default);

async function fixture(run) {
  const original = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  const server = http.createServer(async (req, res) => (await handler)(req, res));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port + '/api/ai/chat';
  async function post(body, headers = {}) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: new URL(url).origin, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }
  try { await run({ post, url }); }
  finally {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
    await new Promise((resolve) => server.close(resolve));
  }
}

test('Preview streams a bounded local reply with SSE and no-store', async () => {
  await fixture(async ({ post }) => {
    const res = await post({ message: 'Who is Prof. NOTA?' });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
    assert.match(res.headers.get('cache-control') || '', /no-store/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const content = await res.text();
    assert.match(content, /"type":"meta"/);
    assert.match(content, /"type":"delta"/);
    assert.match(content, /"type":"done"/);
    assert.match(content, /"persona":"nota-foundation-draft-v0.1"/);
    assert.match(content, /not AI/);
  });
});

test('Rejects cross-origin, missing origin, wrong methods and content types', async () => {
  await fixture(async ({ post, url }) => {
    assert.equal((await fetch(url, { method: 'GET', headers: { Origin: new URL(url).origin } })).status, 405);
    assert.equal((await fetch(url, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })).status, 403);
    assert.equal((await post({ message: 'hello' }, { Origin: 'https://malicious.example' })).status, 403);
    assert.equal((await post('hello', { 'Content-Type': 'text/plain' })).status, 415);
  });
});

test('Validates empty, invalid and oversized messages', async () => {
  await fixture(async ({ post }) => {
    assert.equal((await post({ message: '' })).status, 400);
    assert.equal((await post({ message: 'x'.repeat(1001) })).status, 400);
    assert.equal((await post({ message: 'hello', provider: 'real' })).status, 400);
    assert.equal((await post('{invalid')).status, 400);
    assert.equal((await post({ message: 'x'.repeat(4200) })).status, 413);
  });
});

test('Production and non-Preview environments fail closed', async () => {
  await fixture(async ({ post }) => {
    process.env.VERCEL_ENV = 'production';
    const response = await post({ message: 'hello' });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'foundation_not_enabled' });
    process.env.VERCEL_ENV = 'development';
    assert.equal((await post({ message: 'hello' })).status, 503);
  });
});

test('Provider registry rejects external models and does not execute HTML', async () => {
  const { createFoundationProvider, persona } = await import('../lib/ai/foundation.mjs');
  assert.throws(() => createFoundationProvider('openai/example'), /not configured/);
  assert.equal(persona.version, 'nota-foundation-draft-v0.1');
  const stream = createFoundationProvider().streamText('<script>alert(1)</script>');
  let answer = '';
  for await (const text of stream) answer += text;
  assert.ok(answer.length > 30);
  assert.ok(!answer.includes('<script>'));
  assert.ok(!answer.includes('alert(1)'));
});
