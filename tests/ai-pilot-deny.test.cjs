'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const handler = import('../api/ai/pilot.mjs').then((module) => module.default);

async function exercise(env, method, body, headers = {}) {
  const original = process.env.VERCEL_ENV;
  if (env === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = env;
  const server = http.createServer(async (req, res) => (await handler)(req, res));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const url = 'http://127.0.0.1:' + server.address().port + '/api/ai/pilot';
    const response = await fetch(url, { method, headers: {
      Origin: new URL(url).origin,
      'Content-Type': 'application/json',
      ...headers
    }, ...(method === 'POST' ? { body: body ?? '{}' } : {}) });
    return { status: response.status, headers: response.headers, json: await response.json() };
  } finally {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
    await new Promise((resolve) => server.close(resolve));
  }
}

test('Pilot fails closed in every environment without server-side auth and durable budget', async () => {
  for (const env of [undefined, 'production', 'development', 'preview']) {
    const result = await exercise(env, 'POST', JSON.stringify({ message: 'Who is Prof. NOTA?' }));
    assert.equal(result.status, 503);
    assert.deepEqual(result.json, { error: 'pilot_not_enabled' });
    assert.match(result.headers.get('cache-control') || '', /no-store/);
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('Forged client role, provider hints and toggles cannot enable pilot', async () => {
  const result = await exercise('preview', 'POST', JSON.stringify({
    message: 'hello', role: 'owner', provider: 'live', enabled: true
  }), { 'X-Owner': 'true', Authorization: 'Bearer fake-owner' });
  assert.equal(result.status, 503);
  assert.deepEqual(result.json, { error: 'pilot_not_enabled' });
});

test('Preview rejects method and oversized declared payload before processing', async () => {
  const get = await exercise('preview', 'GET');
  assert.equal(get.status, 405);
  const oversized = await exercise('preview', 'POST', 'x'.repeat(66000));
  assert.equal(oversized.status, 413);
});
