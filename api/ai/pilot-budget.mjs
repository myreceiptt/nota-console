import { configured, verifiedOwner,sameOrigin } from "../../lib/ai/pilot-auth.mjs";
import { p53Enabled,p53Principal,p53Rpc } from "../../lib/ai/p53-auth.mjs";
import { readBudgetStatus, readArkStatus } from "../../lib/ai/pilot-budget.mjs";

import { arkConfigured, MODEL } from "../../lib/ai/modelark.mjs";

function reply(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify(payload));
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function adminBody(req){
 if(Number(req.headers["content-length"]||0)>4096)return null;
 let raw=req.body;
 if(raw===undefined){let n=0;const parts=[];for await(const chunk of req){const b=Buffer.from(chunk);n+=b.length;if(n>4096)return null;parts.push(b);}raw=Buffer.concat(parts).toString("utf8");}
 try{const v=typeof raw==="string"?raw:JSON.stringify(raw);if(Buffer.byteLength(v)>4096)return null;const b=JSON.parse(v);return b&&typeof b==="object"&&!Array.isArray(b)?b:null;}catch{return null;}
}
async function memberBudget(req,res){
 const p=await p53Principal(req);
 if(!p)return reply(res,401,{error:"session_required"});
 if(req.method==="POST"){
  if(p.role!=="owner")return reply(res,403,{error:"owner_required"});
  if(!sameOrigin(req))return reply(res,403,{error:"same_origin_required"});
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"]||""))return reply(res,415,{error:"json_required"});
  const b=await adminBody(req);if(!b)return reply(res,400,{error:"invalid_action"});
  if(b.action==="list_members"&&Object.keys(b).length===1)return reply(res,200,{members:await p53Rpc("p53_members")});
  let ok=false;
  if(b.action==="set_member"&&Object.keys(b).length===3&&typeof b.user_id==="string"&&UUID.test(b.user_id)&&["active","blocked"].includes(b.status))ok=await p53Rpc("p53_member_status",{p_uid:b.user_id,p_status:b.status});
  else if(b.action==="set_admission"&&Object.keys(b).length===2&&typeof b.enabled==="boolean")ok=await p53Rpc("p53_admission",{p_enabled:b.enabled});
  else return reply(res,400,{error:"invalid_action"});
  return reply(res,ok?200:409,{ok:ok===true});
 }
 if(req.method!=="GET")return reply(res,405,{error:"method_not_allowed"});
 const [ledger,tokens,usage]=await Promise.all([readBudgetStatus(),readArkStatus(),p53Rpc("p53_usage",{p_uid:p.uid})]);
 if(!ledger||!tokens||!usage||!["input_tokens","output_tokens","reasoning_tokens","reserved_tokens","completed_requests","daily_requests"].every(k=>Number.isSafeInteger(usage[k])&&usage[k]>=0))return reply(res,503,{error:"ledger_unavailable",model_enabled:false});
 const ready=arkConfigured()&&ledger.admission_enabled&&tokens.reserved_tokens===0&&tokens.input_tokens+tokens.output_tokens+8192<=tokens.token_cap&&(p.role==="owner"||usage.daily_requests<3);
 return reply(res,200,{role:p.role,member_usage:usage,unresolved:tokens.reserved_tokens>0,model_enabled:ready,model:MODEL,billing_policy:"free_only_owner_attested",...(p.role==="owner"?{ledger,tokens}:{daily_limit:3})});
}
// Legacy Owner-only diagnostic remains unchanged while P5.3 is gated off.
export default async function handler(req, res) {
  if (process.env.VERCEL_ENV !== "preview") return reply(res, 503, { error: "pilot_not_enabled" });
  if (p53Enabled()) {try{return await memberBudget(req,res);}catch{return reply(res,503,{error:"pilot_unavailable",model_enabled:false});}}
  if (req.method !== "GET") return reply(res, 405, { error: "method_not_allowed" });
  if (!configured()) return reply(res, 503, { error: "pilot_auth_not_configured" });
  try {
    if (!await verifiedOwner(req)) return reply(res, 401, { error: "owner_session_required" });
    const ledger = await readBudgetStatus();
    if (!ledger) return reply(res, 503, { error: "ledger_unavailable", model_enabled: false });
    if (!arkConfigured()) return reply(res, 200, { ledger, model_enabled: false });
    const tokens = await readArkStatus();
    if (!tokens) return reply(res, 503, { error: "token_ledger_unavailable", model_enabled: false });
    const ready=ledger.admission_enabled && tokens.reserved_tokens===0 && tokens.input_tokens+tokens.output_tokens+8192<=tokens.token_cap;
    return reply(res, 200, { ledger, tokens, model: MODEL, model_enabled: ready, billing_policy: "free_only_owner_attested" });
  } catch {
    return reply(res, 503, { error: "pilot_unavailable", model_enabled: false });
  }
}
