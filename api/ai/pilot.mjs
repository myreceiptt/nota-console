import { randomUUID } from "node:crypto";
import { configured, sameOrigin, verifiedOwner } from "../../lib/ai/pilot-auth.mjs";
import { arkConfigured, validPrompt, runArk, PilotError, MODEL } from "../../lib/ai/modelark.mjs";
import { p53Enabled,p53Principal,sessionKey } from "../../lib/ai/p53-auth.mjs";
import { buildContext } from "../../lib/ai/notagent-context.mjs";
const MAX_BODY_BYTES=65536;
function headers(res) {
 res.setHeader("Cache-Control","no-store, private");
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("X-Robots-Tag","noindex");
}
function reject(res,status,error) {
 res.statusCode=status;headers(res);
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.end(JSON.stringify({error}));
}
async function readBody(req) {
 let b=req.body;
 if(b===undefined){
  let bytes=0;const chunks=[];
  for await(const chunk of req){const c=Buffer.from(chunk);bytes+=c.length;if(bytes>MAX_BODY_BYTES)return null;chunks.push(c);}
  b=Buffer.concat(chunks).toString("utf8");
 }
 try{
  const raw=Buffer.isBuffer(b)?b.toString("utf8"):typeof b==="string"?b:JSON.stringify(b);
  if(Buffer.byteLength(raw,"utf8")>MAX_BODY_BYTES)return null;
  return JSON.parse(raw);
 }catch{return null;}
}
export default async function handler(req,res) {
 if(process.env.VERCEL_ENV!=="preview")return reject(res,503,"pilot_not_enabled");
 if(req.method!=="POST")return reject(res,405,"method_not_allowed");
 if(Number(req.headers["content-length"]||0)>MAX_BODY_BYTES)return reject(res,413,"payload_too_large");
 if(!arkConfigured()||!configured())return reject(res,503,"pilot_not_enabled");
 if(!sameOrigin(req))return reject(res,403,"same_origin_required");
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"]||""))return reject(res,415,"json_required");
 let principal;
 try{
  if(p53Enabled()){
   principal=await p53Principal(req);
   if(!principal||req.headers["x-nota-session"]!==sessionKey(principal))return reject(res,401,"session_required");
  }else if(!await verifiedOwner(req))return reject(res,401,"owner_session_required");
 }catch{return reject(res,503,"auth_unavailable");}
 const body=await readBody(req);
 if(!body||typeof body!=="object"||Array.isArray(body)||!Object.keys(body).every(k=>k==="message"||k==="history")||!validPrompt(body.message)||!buildContext(body.message,body.history))return reject(res,400,"invalid_message");
 const id=randomUUID();
 let started=false;
 let context;
 const start=()=>{
  if(started||res.destroyed)return;
  started=true;headers(res);res.statusCode=200;
  res.setHeader("Content-Type","text/event-stream; charset=utf-8");
  res.setHeader("X-Accel-Buffering","no");
  res.write("event: meta\ndata: "+JSON.stringify({model:MODEL,requestId:id,context})+"\n\n");
 };
 const emit=(event,data)=>{
  if(res.destroyed||res.writableEnded)return;
  start();res.write("event: "+event+"\ndata: "+JSON.stringify(data)+"\n\n");
 };
 // Do not expose a new unauthenticated smoke endpoint or model route.
 // Disconnects may terminate the serverless invocation; an unresolved
 // reservation remains locked rather than risking unaccounted token use.
 const disconnect=new AbortController();
 res.once?.("close",()=>{if(!res.writableEnded)disconnect.abort();});
 try{
  const result=await runArk({id,principal,message:body.message,history:body.history,onContext:value=>{context=value;},signal:disconnect.signal,onDelta:delta=>emit("delta",{text:delta})});
  emit("done",result);
  if(!res.destroyed)res.end();
 }catch(e){
  const code=e instanceof PilotError?e.code:"pilot_unavailable";
  if(res.destroyed)return;
  if(!started)return reject(res,e instanceof PilotError?e.status:503,code);
  emit("error",{error:code});res.end();
 }
}
