'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const OWNER='12345678-1234-4234-8234-123456789abc', MEMBER='12345678-1234-4234-8234-999999999999',SID='e7e2fc40-7fd2-4f36-9a8e-112820260052';
const origin='https://prompt-endhonesa-com-git-feature-impromptu-p51-8a1c22-prof-nota.vercel.app';
const branch='feature/impromptu-p51r-deny-first-scaffold-20261122';
const token=(uid,extra='old')=>'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:uid,session_id:SID,extra})).toString('base64url')+'.mockSignature';
const user=uid=>({id:uid,email:uid===OWNER?'owner@example.com':'member@example.com',email_confirmed_at:'2026-01-01T00:00:00Z',identities:[{provider:'google'}]});
const profile=uid=>({user_id:uid,role:uid===OWNER?'owner':'member',expires_at:new Date(Date.now()+86400000).toISOString()});
const cookies=(uid,extra='old')=>'__Host-nota_p53_access='+token(uid,extra)+'; __Host-nota_p53_refresh=mockRefreshToken123';
const cfg={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:branch,P53_AUTH_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-publishable',SUPABASE_SERVICE_ROLE_KEY:'test-service',PILOT_OWNER_USER_ID:OWNER,PILOT_OWNER_EMAIL:'owner@example.com',P51R_ARK_FREE_ONLY:'true',ARK_API_KEY:'dummy-test-not-a-real-key'};
async function withConfig(fn){const old=Object.fromEntries(Object.keys(cfg).map(k=>[k,process.env[k]])),fetch=global.fetch;Object.assign(process.env,cfg);try{await fn();}finally{global.fetch=fetch;for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}}
function req(method='GET',body,extra={}){return {method,body,url:'/api/ai/pilot-session',headers:{host:new URL(origin).host,origin,'content-type':'application/json',...extra}};}
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(v){this.body=v?JSON.parse(v):undefined;}};}
const session=import('../api/ai/pilot-session.mjs'),budget=import('../api/ai/pilot-budget.mjs'),pilot=import('../api/ai/pilot.mjs'),auth=import('../lib/ai/p53-auth.mjs');
test('Google start uses S256 PKCE with fixed Preview callback and HttpOnly verifier; forged origin blocked',()=>withConfig(async()=>{
 const h=(await session).default;global.fetch=()=>{throw Error('unexpected provider call');};
 let r=response();await h(req('POST',{action:'google_start'},{origin:'https://evil.example'}),r);assert.equal(r.statusCode,403);
 r=response();await h(req('POST',{action:'google_start'}),r);assert.equal(r.statusCode,200);
 const verifier=r.headers['set-cookie'].split(';')[0].split('=')[1],url=new URL(r.body.url);
 assert.equal(url.origin,'https://example.supabase.co');assert.equal(url.pathname,'/auth/v1/authorize');
 assert.equal(url.searchParams.get('provider'),'google');assert.equal(url.searchParams.get('redirect_to'),origin+'/api/ai/pilot-session?oauth=1');
 assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(verifier).digest('base64url'));assert.match(r.headers['set-cookie'],/HttpOnly; Secure; SameSite=Lax/);
 assert.equal(JSON.stringify(r.body).includes(verifier),false);
}));
test('Callback requires PKCE cookie; verified Google Member automatically registers and cookies stay server-side',()=>withConfig(async()=>{
 const h=(await session).default;let calls=[];const callback=req('GET',undefined,{cookie:'__Host-nota_p53_pkce='+'v'.repeat(64)});callback.url='/api/ai/pilot-session?oauth=1&code=1234567890abcdef';
 global.fetch=async(url,opt)=>{const p=new URL(url).pathname;calls.push(p);
 if(p.endsWith('/token')){assert.equal(JSON.parse(opt.body).code_verifier,'v'.repeat(64));return Response.json({access_token:token(MEMBER),refresh_token:'mockRefreshToken123'});}
 if(p.endsWith('/user'))return Response.json(user(MEMBER));
 assert.equal(p,'/rest/v1/rpc/p53_register');assert.equal(JSON.parse(opt.body).p_role,'member');return Response.json(profile(MEMBER));};
 let r=response();await h({...callback,headers:{...callback.headers,cookie:''}},r);assert.equal(r.statusCode,303);assert.match(r.headers.location,/auth=failed/);assert.equal(calls.length,0);
 r=response();await h(callback,r);assert.equal(r.statusCode,303);assert.equal(r.headers.location,origin+'/?notagent=1');assert.equal(r.body,undefined);
 assert.equal(calls.length,3);assert.ok(r.headers['set-cookie'].some(x=>x.startsWith('__Host-nota_p53_refresh=')&&x.includes('HttpOnly; Secure; SameSite=Strict')));
}));
test('Expired access token refresh rotates safely within original session, rejects revoked session without token exchange',()=>withConfig(async()=>{
 const h=(await session).default;let revoked=false,calls=[];
 global.fetch=async(url,opt)=>{const u=new URL(url);calls.push(u.pathname);
 if(u.pathname.endsWith('/user'))return opt.headers.Authorization==='Bearer '+token(MEMBER,'new')?Response.json(user(MEMBER)):new Response('',{status:401});
 if(u.pathname.endsWith('/p53_session'))return Response.json(revoked?null:profile(MEMBER));
 if(u.pathname.endsWith('/token')){assert.equal(u.searchParams.get('grant_type'),'refresh_token');return Response.json({access_token:token(MEMBER,'new'),refresh_token:'newMockRefreshToken456'});}
 throw Error('unexpected');};
 let r=response();await h(req('POST',{action:'refresh'},{cookie:cookies(MEMBER)}),r);
 assert.equal(r.body.authenticated,true);assert.equal(r.body.role,'member');assert.ok(r.body.session_key);assert.ok(r.headers['set-cookie'].some(x=>x.includes('newMockRefreshToken456')));
 assert.equal(JSON.stringify(r.body).includes('newMockRefreshToken456'),false);
 revoked=true;calls=[];r=response();await h(req('POST',{action:'refresh'},{cookie:cookies(MEMBER)}),r);assert.equal(r.body.authenticated,false);assert.equal(calls.includes('/auth/v1/token'),false);
}));
test('Member sees own ledger only, cannot administer or bypass session binding',()=>withConfig(async()=>{
 const b=(await budget).default,p=(await pilot).default;let calls=[];
 global.fetch=async(url,opt)=>{const path=new URL(url).pathname;calls.push(path);
 if(path.endsWith('/user'))return Response.json(user(MEMBER));
 if(path.endsWith('/p53_session'))return Response.json(profile(MEMBER));
 if(path.endsWith('/p53_usage'))return Response.json({input_tokens:123,output_tokens:20,reasoning_tokens:0,reserved_tokens:0,completed_requests:1,daily_requests:1});
 if(path.endsWith('/p51r_status'))return Response.json({admission_enabled:true,total_cap_microusd:5000000,daily_cap_microusd:1000000,spent_total_microusd:400,reserved_total_microusd:0});
 if(path.endsWith('/p51r_ark_status'))return Response.json({token_cap:490000,input_tokens:1000,output_tokens:200,reasoning_tokens:0,reserved_tokens:0,completed_requests:4});
 if(path.endsWith('/p53_reserve')){assert.equal(JSON.parse(opt.body).p_uid,MEMBER);return Response.json(false);}
 throw Error('unexpected');};
 let r=response();await b(req('GET',undefined,{cookie:cookies(MEMBER)}),r);assert.equal(r.statusCode,200);assert.equal(r.body.role,'member');assert.equal(r.body.member_usage.input_tokens,123);assert.equal(r.body.ledger,undefined);assert.equal(r.body.tokens,undefined);assert.equal(r.body.daily_limit,3);
 const key=r.body.session_key;
 r=response();await b(req('POST',{action:'list_members'},{cookie:cookies(MEMBER)}),r);assert.equal(r.statusCode,403);
 r=response();await p(req('POST',{message:'x'},{cookie:cookies(MEMBER),'x-nota-session':'wrong'}),r);assert.equal(r.statusCode,401);assert.equal(calls.includes('/rest/v1/rpc/p53_reserve'),false);
 r=response();await p(req('POST',{message:'x'},{cookie:cookies(MEMBER),'x-nota-session':key}),r);assert.equal(r.statusCode,429);assert.ok(calls.includes('/rest/v1/rpc/p53_reserve'));assert.equal(calls.includes('/api/v3/chat/completions'),false);
}));
test('Owner role requires immutable UID, verified email and Google identity; logout revokes application session',()=>withConfig(async()=>{
 const h=(await session).default;let calls=[];
 global.fetch=async(url,opt)=>{const path=new URL(url).pathname;calls.push(path);
 if(path.endsWith('/user'))return Response.json(user(OWNER));
 if(path.endsWith('/p53_session'))return Response.json(profile(OWNER));
 if(path.endsWith('/p53_revoke'))return Response.json(true);
 if(path.endsWith('/logout'))return new Response(null,{status:204});
 throw Error('unexpected');};
 let r=response();await h(req('GET',undefined,{cookie:cookies(OWNER)}),r);assert.equal(r.body.role,'owner');
 r=response();await h(req('POST',{action:'logout'},{cookie:cookies(OWNER)}),r);assert.equal(r.body.authenticated,false);assert.ok(calls.indexOf('/rest/v1/rpc/p53_revoke')<calls.indexOf('/auth/v1/logout'));assert.ok(r.headers['set-cookie'].every(x=>x.includes('Max-Age=0')));
 process.env.VERCEL_ENV='production';calls=[];r=response();await h(req('POST',{action:'google_start'}),r);assert.equal(r.statusCode,503);assert.equal(calls.length,0);
}));
