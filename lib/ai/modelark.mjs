import { reserveArk, settleArk } from "./pilot-budget.mjs";
import { buildContext, validPrompt } from "./notagent-context.mjs";
export { validPrompt };

export const MODEL="seed-2-0-mini-260428";
export const BRANCH="feature/impromptu-p51r-deny-first-scaffold-20261122";
const URL="https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions";
export function arkConfigured() {
 return process.env.VERCEL_ENV==="preview" &&
 process.env.VERCEL_GIT_COMMIT_REF===BRANCH &&
 process.env.P51R_ARK_FREE_ONLY==="true" &&
 typeof process.env.ARK_API_KEY==="string" && process.env.ARK_API_KEY.length>16;
}
export class PilotError extends Error {
 constructor(code, status=503){super(code);this.code=code;this.status=status;}
}
function parseUsage(u) {
 const input=u?.prompt_tokens,output=u?.completion_tokens,reasoning=u?.completion_tokens_details?.reasoning_tokens??0;
 if (![input,output,reasoning,u?.total_tokens].every(Number.isSafeInteger) ||
 input<1 || input>7392 || output<0 || output>800 || reasoning<0 || reasoning>output || u.total_tokens!==input+output)
 throw new PilotError("usage_unverified");
 return {input,output,reasoning};
}
// Only a bounded text request; no tools, attachments, fallback or paid tiers.
// No automatic retry. Missing usage leaves reservation held for reconciliation.
export async function runArk({id,message,history=[],onDelta=()=>{},onContext=()=>{},signal}) {
 if (!arkConfigured() || !validPrompt(message)) throw new PilotError("pilot_not_enabled");
 const prepared=buildContext(message,history);
 if(!prepared)throw new PilotError("invalid_context",400);
 if (!await reserveArk(id)) throw new PilotError("admission_denied",429);
 onContext(prepared.context);
 const timeout=AbortSignal.timeout(35000);
 const combined=signal?AbortSignal.any([signal,timeout]):timeout;
 let response;
 try {
 response=await fetch(URL,{method:"POST",redirect:"error",headers:{
  Authorization:"Bearer "+process.env.ARK_API_KEY,"Content-Type":"application/json",Accept:"text/event-stream"
 },body:JSON.stringify({model:MODEL,messages:prepared.messages,
  stream:true,stream_options:{include_usage:true},max_completion_tokens:800,reasoning_effort:"minimal",thinking:{type:"disabled"},service_tier:"default"}),signal:combined});
 if(!response.ok){
  // No raw upstream message or key is returned or logged.
  await response.body?.cancel().catch(()=>{});
  throw new PilotError(response.status===429?"provider_quota_or_rate_limit":response.status===401||response.status===403?"provider_authorization_failed":"provider_unavailable",response.status===429?429:503);
 }
 if(!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new PilotError("provider_stream_invalid");
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let buffer="",bytes=0,outputBytes=0,done=false,usage=null,finish=null,providerId="";
 function line(raw) {
  const value=raw.trim();
  if(!value.startsWith("data:")) return;
  const data=value.slice(5).trim();
  if(data==="[DONE]"){done=true;return;}
  if(done) throw new PilotError("provider_stream_invalid");
  const chunk=JSON.parse(data);
  if(chunk.error) throw new PilotError("provider_stream_invalid");
  if(chunk.model && ![MODEL,"dola-seed-2-0-mini-260428"].includes(chunk.model)) throw new PilotError("model_mismatch");
  if(typeof chunk.id==="string" && /^[A-Za-z0-9_.:-]{1,200}$/.test(chunk.id)) providerId=chunk.id;
  if(chunk.usage) usage=parseUsage(chunk.usage);
  if(chunk.choices?.length>1) throw new PilotError("provider_stream_invalid");
  const choice=chunk.choices?.[0];
  if(choice?.delta?.tool_calls || choice?.delta?.function_call) throw new PilotError("unexpected_tool_call");
  if(choice?.finish_reason) finish=choice.finish_reason;
  const delta=choice?.delta?.content;
  if(typeof delta==="string" && delta){
   outputBytes+=Buffer.byteLength(delta,"utf8");
   if(outputBytes>32768) throw new PilotError("output_limit");
   onDelta(delta);
  }
 }
 try {
 while(true){
  const x=await reader.read();if(x.done)break;
  bytes+=x.value.byteLength;if(bytes>262144)throw new PilotError("stream_limit");
  buffer+=decoder.decode(x.value,{stream:true});
  let n;while((n=buffer.indexOf("\n"))>=0){line(buffer.slice(0,n));buffer=buffer.slice(n+1);}
  if(done)break;
 }
 buffer+=decoder.decode();if(buffer.trim())line(buffer);
 } finally {await reader.cancel().catch(()=>{});}
 if(!done || !usage || !["stop","length","content_filter"].includes(finish) || !providerId) throw new PilotError("usage_unverified");
 if(!await settleArk(id,usage,providerId)) throw new PilotError("settlement_unverified");
 return {model:MODEL,usage,finish,requestId:id,context:prepared.context};
 }catch(e){if(e instanceof PilotError)throw e;throw new PilotError("provider_or_stream_unverified");}
}
