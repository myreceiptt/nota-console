import { useEffect, useRef, useState, type FormEvent } from "react";

type Props = { active: boolean; ready: boolean; onRefresh: () => Promise<void>; onSessionExpired: () => void };
type Usage = { input: number; output: number; reasoning: number };

export default function PrivatePilotChat({ active, ready, onRefresh, onSessionExpired }: Props) {
  const [message,setMessage]=useState("");
  const [answer,setAnswer]=useState("");
  const [notice,setNotice]=useState("");
  const [usage,setUsage]=useState<Usage|null>(null);
  const [running,setRunning]=useState(false);
  const current=useRef<AbortController|null>(null);
  useEffect(()=>()=>{current.current?.abort();},[]);
  // Hidden tabs do not issue new requests. In-flight calls may complete while
  // another mode is selected so usage is not needlessly left unresolved.
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const prompt=message.trim();
    if(!active||!ready||current.current||!prompt||prompt.length>1000)return;
    const controller=new AbortController();
    current.current=controller;
    setRunning(true);setAnswer("");setUsage(null);setNotice("Connecting to ModelArk…");
    let completed=false;
    try {
      const response=await fetch("/api/ai/pilot",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt}),signal:controller.signal
      });
      if(response.status===401){onSessionExpired();return;}
      if(!response.ok) {
        const data=await response.json().catch(()=>({}));
        throw new Error(typeof data.error==="string"?data.error:"request_unavailable");
      }
      if(!response.body||!response.headers.get("content-type")?.includes("text/event-stream"))throw new Error("stream_unavailable");
      const reader=response.body.getReader(),decoder=new TextDecoder();
      let buffer="",event="",bytes=0;
      const line=(raw:string)=>{
        const value=raw.replace(/\r$/,"");
        if(value.startsWith("event:"))event=value.slice(6).trim();
        if(!value.startsWith("data:"))return;
        const data=JSON.parse(value.slice(5).trim());
        if(event==="meta")setNotice("Receiving streamed response…");
        if(event==="delta"&&typeof data.text==="string")setAnswer(previous=>previous+data.text);
        if(event==="done"){
          if(!data.usage||!Number.isSafeInteger(data.usage.input)||!Number.isSafeInteger(data.usage.output))throw new Error("usage_unverified");
          setUsage(data.usage);completed=true;
          setNotice(data.finish==="length"?"Output limit reached. Usage recorded.":"Response complete. Usage recorded.");
        }
        if(event==="error")throw new Error(data.error||"stream_unavailable");
      };
      try {
        while(true){
          const chunk=await reader.read();if(chunk.done)break;
          bytes+=chunk.value.byteLength;if(bytes>262144)throw new Error("stream_limit");
          buffer+=decoder.decode(chunk.value,{stream:true});
          let end:number;
          while((end=buffer.indexOf("\n"))>=0){line(buffer.slice(0,end));buffer=buffer.slice(end+1);}
        }
        buffer+=decoder.decode();if(buffer.trim())line(buffer);
      }finally{await reader.cancel().catch(()=>{});}
      if(!completed)throw new Error("usage_unverified");
    }catch(error){
      if(controller.signal.aborted)setNotice("Stopped locally. Unconfirmed usage may remain reserved; do not retry until reconciled.");
      else {
        const code=error instanceof Error?error.message:"request_unavailable";
        const messages:Record<string,string>={
          admission_denied:"Request not admitted: check quota, limits or unresolved usage.",
          provider_quota_or_rate_limit:"ModelArk paused or rate limited the model. Do not disable Free Credits Only Mode.",
          provider_authorization_failed:"ModelArk authorization unavailable. No automatic retry.",
          usage_unverified:"Provider usage could not be verified. Reservation remains locked.",
          settlement_unverified:"Usage settlement could not be verified. No automatic retry."
        };
        setNotice(messages[code]||"Request incomplete. Check the ledger before retrying ("+code+").");
      }
    }finally{
      current.current=null;setRunning(false);void onRefresh();
    }
  }
  return <section className="flex flex-col gap-3 rounded border border-nota-border p-3" aria-label="ModelArk private chat">
    <p className="font-bold text-nota-cyan">REAL AI · Dola-Seed-2.0-mini 260428</p>
    <p className="text-xs">Text-only, single-turn pilot. Prompts go to BytePlus; no persistent chat history in IMPROMPTU. Public or dummy data only.</p>
    {!ready&&<p className="text-xs text-nota-yellow">Admission unavailable. Check the ledger. No automatic fallback.</p>}
    <form onSubmit={send} className="flex flex-col gap-2">
      <label htmlFor="pilot-message">Your prompt (maximum 1,000 characters)</label>
      <textarea id="pilot-message" rows={3} maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)}
        disabled={running} className="w-full rounded border border-nota-border bg-nota-black p-2 text-nota-white" placeholder="Ask a general question…"/>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!active||!ready||running||!message.trim()} className="rounded bg-nota-cyan px-3 py-2 font-bold text-nota-black disabled:opacity-50">Send</button>
        <button type="button" disabled={!running} onClick={()=>current.current?.abort()} className="rounded border border-nota-border px-3 py-2 disabled:opacity-50">Stop</button>
        <button type="button" disabled={running} onClick={()=>{setAnswer("");setUsage(null);setMessage("");setNotice("");}} className="rounded border border-nota-border px-3 py-2 disabled:opacity-50">Clear</button>
      </div>
    </form>
    {notice&&<p role="status" className="text-nota-yellow">{notice}</p>}
    {answer&&<div aria-label="AI response" className="whitespace-pre-wrap break-words rounded border border-nota-border p-3">{answer}</div>}
    {usage&&<p className="text-xs">Input: {usage.input} · Output: {usage.output} · Reasoning (included in output): {usage.reasoning} · Total: {usage.input+usage.output} tokens</p>}
  </section>;
}
