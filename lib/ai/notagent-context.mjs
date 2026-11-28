import { VERSION,CORE,SOURCES,ENTRIES,PUBLIC_SOURCE_IDS } from "./canon/public-v1.mjs";
export const IDENTITY_VERSION=VERSION;
export const SYSTEM=CORE;
// Bounded, deterministic matching; question takes precedence over prior dialogue.
export function selectEntries(message,history=[]) {
 const rank=(s)=>{const q=s.normalize("NFKC").toLowerCase();return ENTRIES.map((entry,i)=>({entry,i,score:entry.aliases.reduce((n,a)=>n+(q.includes(a.replaceAll("\\\\.", "."))?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.entry);};
 const direct=rank(message);return (direct.length?direct:history.length?rank(history[history.length-2].content):[]).slice(0,3);
}
function entryText(e){const refs=e.source_ids.filter(id=>PUBLIC_SOURCE_IDS.includes(id)).map(id=>SOURCES[id].url).filter(Boolean);return "\n["+e.entry_id+"; "+e.kind+"] "+e.statement+(refs.length?" References: "+refs.join(" "):"");}
export const MAX_PAIRS=6;
export const INPUT_LIMIT=7392;
// Conservative byte envelope: UTF-8 bytes of serialized messages plus 512
// tokens of headroom for model framing. Not an exact provider tokenizer.
export const envelope=messages=>Buffer.byteLength(JSON.stringify(messages),"utf8")+512;
export function validPrompt(value) {
 return typeof value==="string" && value.trim().length>0 && value.length<=1000 && Buffer.byteLength(value,"utf8")<=4000;
}
export function buildContext(message,history=[]) {
 if(!validPrompt(message)||!Array.isArray(history)||history.length>MAX_PAIRS*2||history.length%2!==0)return null;
 for(let i=0;i<history.length;i++){
  const item=history[i];
  if(!item||typeof item!=="object"||Array.isArray(item)||Object.keys(item).length!==2||
    item.role!==(i%2===0?"user":"assistant")||typeof item.content!=="string"||!item.content.trim()||
    (i%2===0&&!validPrompt(item.content))||Buffer.byteLength(item.content,"utf8")>32768)return null;
 }
 const head={role:"system",content:SYSTEM},tail={role:"user",content:message.trim()};
 const selected=[];
 for(const e of selectEntries(message,history)){
  const addition=entryText(e);if(envelope([{role:"system",content:head.content+addition},tail])<=INPUT_LIMIT){head.content+=addition;selected.push(e.entry_id);}
 }
 const kept=history.map(x=>({role:x.role,content:x.content}));
 if(envelope([head,tail])>INPUT_LIMIT)return null;
 let dropped=0;
 while(envelope([head,...kept,tail])>INPUT_LIMIT){kept.splice(0,2);dropped++;}
 const messages=[head,...kept,tail];
 return {messages,context:{keptPairs:kept.length/2,droppedPairs:dropped,inputEnvelope:envelope(messages),identityVersion:IDENTITY_VERSION,canonEntries:selected}};
}
