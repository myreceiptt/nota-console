'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const auth = import('../lib/ai/pilot-auth.mjs');
const budget = import('../lib/ai/pilot-budget.mjs');
const sessionHandler = import('../api/ai/pilot-session.mjs');
const OWNER_ID = '12345678-1234-4234-8234-123456789abc';

function mockRes() {
  const headers = {};
  return {
    statusCode: 200, headers,
    setHeader(key, value) { headers[key.toLowerCase()] = value; },
    end(text) { this.body = JSON.parse(text); }
  };
}
function request(method, body = undefined) {
  return {
    method, headers: {
      host: 'preview.example.com',
      origin: 'https://preview.example.com',
      'content-type': 'application/json'
    },
    body
  };
}
function withConfig(fn) {
  const keys = ['VERCEL_ENV', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', 'PILOT_OWNER_USER_ID', 'PILOT_OWNER_EMAIL'];
  const before = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  Object.assign(process.env, {
    VERCEL_ENV: 'preview',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    PILOT_OWNER_USER_ID: OWNER_ID,
    PILOT_OWNER_EMAIL: 'owner@example.com'
  });
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Promise.resolve().then(fn).finally(() => {
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
}

test('Owner identity checks immutable UID, email and email confirmation', async () => {
  await withConfig(async () => {
    const { isOwner, isOwnerEmail, sameOrigin } = await auth;
    const owner = { id: OWNER_ID, email: 'owner@example.com', email_confirmed_at: '2026-01-01T00:00:00Z' };
    assert.equal(isOwner(owner), true);
    assert.equal(isOwner({ ...owner, id: '12345678-1234-4234-8234-999999999999' }), false);
    assert.equal(isOwner({ ...owner, email: 'other@example.com' }), false);
    assert.equal(isOwner({ ...owner, email_confirmed_at: null }), false);
    assert.equal(isOwnerEmail('attacker@example.com'), false);
    assert.equal(sameOrigin(request('POST')), true);
    assert.equal(sameOrigin({ headers: { host: 'preview.example.com', origin: 'https://evil.example' } }), false);
  });
});

test('Session endpoint rejects Production even when configured', async () => {
  await withConfig(async () => {
    process.env.VERCEL_ENV = 'production';
    const handler = (await sessionHandler).default;
    const res = mockRes();
    await handler(request('POST', { action: 'request_otp', email: 'owner@example.com' }), res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'pilot_not_enabled' });
  });
});

test('Unknown email cannot trigger OTP provider call', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const original = global.fetch;
    let called = false;
    global.fetch = async () => { called = true; throw new Error('should not contact provider'); };
    try {
      const res = mockRes();
      await handler(request('POST', { action: 'request_otp', email: 'unknown@example.com' }), res);
      assert.equal(res.statusCode, 403);
      assert.equal(called, false);
    } finally { global.fetch = original; }
  });
});

test('Budget adapter fails closed without service role and rejects invalid amounts', async () => {
  await withConfig(async () => {
    const { reserveBudget, settleBudget } = await budget;
    assert.equal(await reserveBudget(OWNER_ID, 100000), false);
    assert.equal(await reserveBudget(OWNER_ID, 0), false);
    assert.equal(await reserveBudget(OWNER_ID, 1000001), false);
    assert.equal(await reserveBudget('invalid', 100000), false);
    assert.equal(await settleBudget(OWNER_ID, 0), false);
  });
});

test('Budget adapter uses server-only RPC and defaults deny on connection failures', async () => {
  await withConfig(async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test';
    const original = global.fetch;
    let requests = 0;
    global.fetch = async (url, options) => {
      requests++;
      assert.match(String(url), /\/rest\/v1\/rpc\/p51r_reserve$/);
      assert.equal(options.headers.Authorization, 'Bearer server-only-test');
      return { ok: true, json: async () => true };
    };
    try {
      const { reserveBudget } = await budget;
      assert.equal(await reserveBudget(OWNER_ID, 500000), true);
      assert.equal(requests, 1);
    } finally { global.fetch = original; }
  });
});

test('Magic Link server exchange verifies immutable Owner before session cookie', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const token = 'a'.repeat(120);
    const original = global.fetch;
    let calls = 0;
    global.fetch = async (url, options) => {
      calls++;
      assert.match(String(url), /\/auth\/v1\/user$/);
      assert.equal(options.headers.Authorization, 'Bearer ' + token);
      return { ok: true, json: async () => ({
        id: OWNER_ID, email: 'owner@example.com', email_confirmed_at: '2026-01-01T00:00:00Z'
      }) };
    };
    try {
      const res = mockRes();
      await handler(request('POST', { action: 'accept_magic_link', access_token: token }), res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.authenticated, true);
      assert.match(res.headers['set-cookie'], /HttpOnly; Secure; SameSite=Strict/);
      assert.equal(calls, 1);
    } finally { global.fetch = original; }
  });
});

test('Magic Link rejects different valid Supabase user and forged token', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const original = global.fetch;
    let calls = 0;
    global.fetch = async () => {
      calls++;
      return { ok: true, json: async () => ({
        id: '12345678-1234-4234-8234-999999999999',
        email: 'other@example.com', email_confirmed_at: '2026-01-01T00:00:00Z'
      }) };
    };
    try {
      const res = mockRes();
      await handler(request('POST', { action: 'accept_magic_link', access_token: 'a'.repeat(120) }), res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.headers['set-cookie'], undefined);
      const forged = mockRes();
      await handler(request('POST', { action: 'accept_magic_link', access_token: '<invalid>' }), forged);
      assert.equal(forged.statusCode, 400);
      assert.equal(calls, 1);
    } finally { global.fetch = original; }
  });
});

test('Supabase email quota HTTP 429 maps to explicit fail-closed rate-limit response', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const original = global.fetch;
    let calls = 0;
    global.fetch = async (url, options) => {
      calls++;
      assert.match(String(url), /\/auth\/v1\/otp$/);
      assert.equal(options.method, 'POST');
      return { ok: false, status: 429 };
    };
    try {
      const res = mockRes();
      await handler(request('POST', { action: 'request_otp', email: 'owner@example.com' }), res);
      assert.equal(res.statusCode, 429);
      assert.deepEqual(res.body, { error: 'email_rate_limited' });
      assert.equal(calls, 1);
    } finally { global.fetch = original; }
  });
});

test('Other Supabase email send failures do not masquerade as exhausted quota', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const original = global.fetch;
    global.fetch = async () => ({ ok: false, status: 500 });
    try {
      const res = mockRes();
      await handler(request('POST', { action: 'request_otp', email: 'owner@example.com' }), res);
      assert.equal(res.statusCode, 503);
      assert.deepEqual(res.body, { error: 'email_delivery_unavailable' });
    } finally { global.fetch = original; }
  });
});

test('Session refresh, invalid or expired bearer, cross-origin and local logout', async () => {
  await withConfig(async () => {
    const handler = (await sessionHandler).default;
    const { COOKIE_NAME } = await auth;
    const token = 'a'.repeat(120);
    const original = global.fetch;
    let status = 200, calls = 0;
    global.fetch = async (url, options) => {
      calls++;
      assert.match(String(url), /\/auth\/v1\/user$/);
      assert.equal(options.headers.Authorization, 'Bearer ' + token);
      return { ok: status === 200, status, json: async () => ({
        id: OWNER_ID, email: 'owner@example.com', email_confirmed_at: '2026-01-01T00:00:00Z'
      }) };
    };
    try {
      const anonymous = mockRes();
      await handler(request('GET'), anonymous);
      assert.deepEqual(anonymous.body, { authenticated: false });
      assert.equal(calls, 0);
      const authenticatedRequest = request('GET');
      authenticatedRequest.headers.cookie = COOKIE_NAME + '=' + token;
      for (let i = 0; i < 2; i++) {
        const res = mockRes();
        await handler(authenticatedRequest, res);
        assert.deepEqual(res.body, { authenticated: true });
      }
      status = 401;
      const expired = mockRes();
      await handler(authenticatedRequest, expired);
      assert.deepEqual(expired.body, { authenticated: false });
      const cross = request('POST', { action: 'logout' });
      cross.headers.origin = 'https://foreign.example';
      const denied = mockRes();
      await handler(cross, denied);
      assert.equal(denied.statusCode, 403);
      assert.equal(denied.headers['set-cookie'], undefined);
      const logout = mockRes();
      await handler(request('POST', { action: 'logout' }), logout);
      assert.deepEqual(logout.body, { authenticated: false });
      assert.match(logout.headers['set-cookie'], /Max-Age=0; HttpOnly; Secure; SameSite=Strict/);
      const after = mockRes();
      await handler(request('GET'), after);
      assert.deepEqual(after.body, { authenticated: false });
      assert.equal(calls, 3);
    } finally { global.fetch = original; }
  });
});

test('Read-only budget endpoint requires Owner, reports missing ledger and never reserves', async () => {
  await withConfig(async () => {
    const handler = (await import('../api/ai/pilot-budget.mjs')).default;
    const token = 'a'.repeat(120);
    const original = global.fetch;
    const ledger = {admission_enabled:false,total_cap_microusd:5000000,daily_cap_microusd:1000000,spent_total_microusd:0,reserved_total_microusd:0};
    let calls = [];
    global.fetch = async (url) => {
      calls.push(new URL(url).pathname);
      if (String(url).endsWith('/auth/v1/user')) return {ok:true,json:async()=>({id:OWNER_ID,email:'owner@example.com',email_confirmed_at:'2026-01-01T00:00:00Z'})};
      assert.match(String(url), /\/rest\/v1\/rpc\/p51r_status$/);
      return {ok:true,json:async()=>ledger};
    };
    try {
      const noOwner = mockRes();
      await handler(request('GET'),noOwner);
      assert.equal(noOwner.statusCode,401);
      assert.equal(calls.length,0);
      const req = request('GET');
      req.headers.cookie = (await auth).COOKIE_NAME + '=' + token;
      const noKey = mockRes();
      await handler(req,noKey);
      assert.equal(noKey.statusCode,503);
      assert.equal(noKey.body.error,'ledger_unavailable');
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test';
      const ready = mockRes();
      await handler(req,ready);
      assert.equal(ready.statusCode,200);
      assert.deepEqual(ready.body,{ledger,model_enabled:false});
      assert.deepEqual(calls,['/auth/v1/user','/auth/v1/user','/rest/v1/rpc/p51r_status']);
      const write = mockRes();
      await handler(request('POST',{}),write);
      assert.equal(write.statusCode,405);
      process.env.VERCEL_ENV='production';
      const prod = mockRes();
      await handler(req,prod);
      assert.equal(prod.statusCode,503);
      assert.equal(calls.length,3);
    } finally { global.fetch=original; }
  });
});

const ark = import('../lib/ai/modelark.mjs');
async function withArk(fn) {
  await withConfig(async()=>{
    const {BRANCH}=await ark;
    const names=['VERCEL_GIT_COMMIT_REF','P51R_ARK_FREE_ONLY','ARK_API_KEY','SUPABASE_SERVICE_ROLE_KEY'];
    const before=Object.fromEntries(names.map(k=>[k,process.env[k]]));
    Object.assign(process.env,{VERCEL_GIT_COMMIT_REF:BRANCH,P51R_ARK_FREE_ONLY:'true',ARK_API_KEY:'mock-test-key-not-a-credential',SUPABASE_SERVICE_ROLE_KEY:'server-only-test'});
    try {await fn();}
    finally {for(const k of names){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
  });
}
function arkSSE({usage=true,model='seed-2-0-mini-260428',done=true}={}) {
  const chunk=(x)=>'data: '+JSON.stringify(x)+'\n\n';
  const data=chunk({id:'test-request',model,choices:[{delta:{content:'Hello'},finish_reason:null}]})+
    chunk({id:'test-request',model,choices:[{delta:{content:' world'},finish_reason:'stop'}]})+
    (usage?chunk({id:'test-request',model,choices:[],usage:{prompt_tokens:80,completion_tokens:20,total_tokens:100,completion_tokens_details:{reasoning_tokens:0}}}):'')+
    (done?'data: [DONE]\n\n':'');
  const buf=new TextEncoder().encode(data);
  const stream=new ReadableStream({start(controller){for(let i=0;i<buf.length;i+=7)controller.enqueue(buf.slice(i,i+7));controller.close();}});
  return new Response(stream,{headers:{'content-type':'text/event-stream'}});
}
test('ModelArk real adapter contract: reserve before provider, fixed model, fragmented SSE, settle actual usage',async()=>{
 await withArk(async()=>{
  const original=global.fetch;const calls=[];let out='';
  global.fetch=async(url,opt)=>{
   const p=new URL(url).pathname;calls.push(p);
   if(p.endsWith('/p51r_ark_reserve'))return Response.json(true);
   if(p.endsWith('/p51r_ark_settle')){
    assert.deepEqual(JSON.parse(opt.body),{p_id:OWNER_ID,p_input:80,p_output:20,p_reasoning:0,p_provider_id:'test-request'});
    return Response.json(true);
   }
   assert.equal(String(url),'https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions');
   assert.equal(opt.headers.Authorization,'Bearer mock-test-key-not-a-credential');
   const b=JSON.parse(opt.body);
   assert.equal(b.model,'seed-2-0-mini-260428');assert.equal(b.max_completion_tokens,800);
   assert.equal(b.reasoning_effort,'minimal');assert.equal(b.thinking.type,'disabled');
   assert.equal(b.service_tier,'default');assert.equal(b.stream_options.include_usage,true);
   assert.equal(b.tools,undefined);assert.equal(b.messages.length,2);
   return arkSSE();
  };
  try{
   const r=await (await ark).runArk({id:OWNER_ID,message:'Test',onDelta:d=>out+=d});
   assert.equal(out,'Hello world');assert.deepEqual(r.usage,{input:80,output:20,reasoning:0});
   assert.deepEqual(calls,['/rest/v1/rpc/p51r_ark_reserve','/api/v3/chat/completions','/rest/v1/rpc/p51r_ark_settle']);
  }finally{global.fetch=original;}
 });
});
test('ModelArk rejects wrong environment, failed admission, quota error and missing usage without retry or release',async()=>{
 await withArk(async()=>{
  const original=global.fetch;const {runArk}=await ark;let calls=[];
  try{
   global.fetch=async(url)=>{calls.push(String(url));return Response.json(false);};
   process.env.VERCEL_ENV='production';
   await assert.rejects(runArk({id:OWNER_ID,message:'Test'}),{code:'pilot_not_enabled'});
   assert.equal(calls.length,0);process.env.VERCEL_ENV='preview';
   await assert.rejects(runArk({id:OWNER_ID,message:'Test'}),{code:'admission_denied'});
   assert.equal(calls.length,1);
   for(const [reply,code] of [[()=>new Response('',{status:429}),'provider_quota_or_rate_limit'],[()=>arkSSE({usage:false}),'usage_unverified'],[()=>arkSSE({model:'other-model'}),'model_mismatch'],[()=>arkSSE({done:false}),'usage_unverified']]){
    calls=[];
    global.fetch=async(url)=>{calls.push(String(url));return String(url).endsWith('p51r_ark_reserve')?Response.json(true):reply();};
    await assert.rejects(runArk({id:OWNER_ID,message:'Test'}),{code});
    assert.equal(calls.length,2);assert.ok(!calls.some(p=>p.endsWith('p51r_ark_settle')));
   }
  }finally{global.fetch=original;}
 });
});
test('Live route rejects anonymous, cross-origin and client model overrides before reserve',async()=>{
 await withArk(async()=>{
  const handler=(await import('../api/ai/pilot.mjs')).default;
  const original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return Response.json({id:OWNER_ID,email:'owner@example.com',email_confirmed_at:'2026-01-01T00:00:00Z'});};
  try{
   let req=request('POST',{message:'hello'}),res=mockRes();await handler(req,res);
   assert.equal(res.statusCode,401);assert.equal(calls,0);
   req=request('POST',{message:'hello'});req.headers.origin='https://foreign.example';res=mockRes();await handler(req,res);
   assert.equal(res.statusCode,403);assert.equal(calls,0);
   req=request('POST',{message:'hello',model:'other'});req.headers.cookie=(await auth).COOKIE_NAME+'='+'a'.repeat(120);
   res=mockRes();await handler(req,res);assert.equal(res.statusCode,400);assert.equal(calls,1);
  }finally{global.fetch=original;}
 });
});
test('Live route streams sanitized deltas and reports settlement only after usage verified',async()=>{
 await withArk(async()=>{
  const handler=(await import('../api/ai/pilot.mjs')).default;
  const original=global.fetch;let calls=[];
  global.fetch=async(url)=>{
   const p=new URL(url).pathname;calls.push(p);
   if(p==='/auth/v1/user')return Response.json({id:OWNER_ID,email:'owner@example.com',email_confirmed_at:'2026-01-01T00:00:00Z'});
   if(p.endsWith('p51r_ark_reserve')||p.endsWith('p51r_ark_settle'))return Response.json(true);
   return arkSSE();
  };
  try{
   const req=request('POST',{message:'hello'});req.headers.cookie=(await auth).COOKIE_NAME+'='+'a'.repeat(120);
   const headers={};let output='';
   const res={statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v;},write(s){output+=s;},end(s=''){output+=s;this.writableEnded=true;}};
   await handler(req,res);
   assert.equal(res.statusCode,200);assert.match(headers['content-type'],/text\/event-stream/);
   assert.match(output,/event: meta/);assert.match(output,/event: delta/);assert.match(output,/event: done/);
   assert.deepEqual(calls,['/auth/v1/user','/rest/v1/rpc/p51r_ark_reserve','/api/v3/chat/completions','/rest/v1/rpc/p51r_ark_settle']);
  }finally{global.fetch=original;}
 });
});
