import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type Props = { sessionKey?: string; active: boolean; ready: boolean; unresolved: boolean; onRefresh: () => Promise<void>; onSessionExpired: () => void };
type Usage = { input: number; output: number; reasoning: number };
type Turn = { id: number; prompt: string; answer: string; state: "pending"|"complete"|"incomplete"; usage?: Usage; context?: string };
type Message = { role: "user"|"assistant"; content: string };
const buttonClass="text-nota-yellow hover:text-nota-cyan focus-visible:outline focus-visible:outline-nota-cyan disabled:opacity-40 disabled:cursor-not-allowed";
function PromptLine({children}:{children:React.ReactNode}) {
 return <div className="flex flex-col text-sm">
  <div className="font-bold text-nota-blue">┌──(<span className="text-nota-red">root🤫nota</span>)-[<span className="text-nota-white">~</span>]</div>
  <div className="flex min-w-0 gap-2"><span className="shrink-0 text-nota-blue">└─<b className="text-nota-white">#</b></span><div className="min-w-0 flex-1 text-nota-gray whitespace-pre-wrap break-words">{children}</div></div>
 </div>;
}
export default function PrivatePilotChat({sessionKey,active,ready,unresolved,onRefresh,onSessionExpired}:Props) {
 const [message,setMessage]=useState("");
 const [turns,setTurns]=useState<Turn[]>([]);
 const [notice,setNotice]=useState("");
 const [running,setRunning]=useState(false);
 const [stopped,setStopped]=useState(false);
 const current=useRef<AbortController|null>(null);
 const stopDisplay=useRef(false);
 const mounted=useRef(true);
 const serial=useRef(0);
 const scroll=useRef<HTMLDivElement>(null);
 const follow=useRef(true);
 const input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;current.current?.abort();};},[]);
 useEffect(()=>{if(active&&!running)input.current?.focus();},[active,running]);
 useEffect(()=>{if(active&&follow.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[turns,notice,active]);
 function patch(id:number,fn:(t:Turn)=>Turn){if(mounted.current)setTurns(old=>old.map(t=>t.id===id?fn(t):t));}
 async function send(e?:FormEvent<HTMLFormElement>) {
  e?.preventDefault();
  const prompt=message.trim();
  if(!active||!ready||current.current||!prompt||prompt.length>1000)return;
  const pairs=turns.filter(t=>t.state==="complete"&&t.answer.trim()).slice(-6);
  const history:Message[]=pairs.flatMap(t=>[{role:"user" as const,content:t.prompt},{role:"assistant" as const,content:t.answer}]);
  let omitted=turns.filter(t=>t.state==="complete"&&t.answer.trim()).length-pairs.length;
  // Transport limit is independent of the server's tighter model envelope.
  while(new TextEncoder().encode(JSON.stringify({message:prompt,history})).length>60000&&history.length){history.splice(0,2);omitted++;}
  const controller=new AbortController(),id=++serial.current;
  current.current=controller;stopDisplay.current=false;follow.current=true;
  setRunning(true);setStopped(false);setNotice("Connecting to Prof. NOTA…");
  setTurns(old=>[...old,{id,prompt,answer:"",state:"pending"}]);setMessage("");
  let admitted=false,completed=false,answer="",usage:Usage|undefined,context="";
  try{
   const response=await fetch("/api/ai/pilot",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json",...(sessionKey?{"X-NOTA-Session":sessionKey}:{})},body:JSON.stringify({message:prompt,history}),signal:controller.signal});
   if(response.status===401){onSessionExpired();throw new Error("session_expired");}
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(typeof data.error==="string"?data.error:"request_unavailable");}
   admitted=true;
   if(!response.body||!response.headers.get("content-type")?.includes("text/event-stream"))throw new Error("stream_unavailable");
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",event="",bytes=0;
   const line=(raw:string)=>{
    const value=raw.replace(/\r$/,"");
    if(value.startsWith("event:"))event=value.slice(6).trim();
    if(!value.startsWith("data:"))return;
    const data=JSON.parse(value.slice(5).trim());
    if(event==="meta"){
     const dropped=omitted+(Number.isSafeInteger(data.context?.droppedPairs)?data.context.droppedPairs:0);
     context=dropped>0?dropped+" older turn(s) omitted from model context; transcript retained.":"";
     patch(id,t=>({...t,context}));
     if(!stopDisplay.current)setNotice("Receiving response…");
    }
    if(event==="delta"&&typeof data.text==="string"&&!stopDisplay.current){answer+=data.text;patch(id,t=>({...t,answer}));}
    if(event==="done"){
     if(!data.usage||![data.usage.input,data.usage.output,data.usage.reasoning].every(Number.isSafeInteger))throw new Error("usage_unverified");
     usage=data.usage;completed=true;
     if(!stopDisplay.current)setNotice(data.finish==="length"?"Output limit reached. Usage recorded.":"Response complete. Usage recorded.");
    }
    if(event==="error")throw new Error(data.error||"stream_unavailable");
   };
   try{
    while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>262144)throw new Error("stream_limit");
     buffer+=decoder.decode(chunk.value,{stream:true});let end:number;while((end=buffer.indexOf("\n"))>=0){line(buffer.slice(0,end));buffer=buffer.slice(end+1);}}
    buffer+=decoder.decode();if(buffer.trim())line(buffer);
   }finally{await reader.cancel().catch(()=>{});}
   if(!completed)throw new Error("usage_unverified");
   patch(id,t=>({...t,answer,usage,context,state:stopDisplay.current?"incomplete":"complete"}));
   if(stopDisplay.current)setNotice("Display stopped. Provider usage settled; incomplete turn excluded from context.");
  }catch(error){
   if(!mounted.current)return;
   if(!admitted){setTurns(old=>old.filter(t=>t.id!==id));setMessage(prompt);}
   else patch(id,t=>({...t,state:"incomplete",answer,usage,context}));
   const code=error instanceof Error?error.message:"request_unavailable";
   setNotice("Request incomplete ("+code+"). Check Usage before retrying. No automatic retry.");
  }finally{
   current.current=null;
   if(mounted.current){setRunning(false);setStopped(false);void onRefresh();}
  }
 }
 function onKey(e:KeyboardEvent<HTMLTextAreaElement>){
  if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}
 }
 function newChat(){
  if(running||unresolved)return;
  if((turns.length||message)&&!window.confirm("Clear this conversation and its context? Token usage is retained."))return;
  setTurns([]);setMessage("");setNotice("");follow.current=true;input.current?.focus();
 }
 return <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="NOTAGENT conversation">
  <div ref={scroll} onScroll={()=>{const el=scroll.current;if(el)follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<40;}} className="min-h-0 flex-1 overflow-y-auto terminal-scrollbar px-1 pt-1 pb-2 text-nota-blue text-sm" data-testid="notagent-transcript">
   <p className="terminal-title">==== Welcome to NOTAGENT =======</p>
   <p className="my-4">OiOi! Hi, we are <span className="font-bold text-nota-green">Prof. NOTA!</span></p>
   <p className="mb-4">We exist in the <span className="font-bold text-nota-red">0101 Universe</span>. Here, we can have a conversation beyond our predefined command prompts.</p>
   <p className="mb-4">What would you like to talk about?</p>
   <p className="terminal-title mb-4">==== 47 =======</p>
   {turns.map(t=><div key={t.id} className="mb-4">
    <div data-testid="notagent-user"><PromptLine>{t.prompt}</PromptLine></div>
    {t.context&&<p className="text-nota-yellow">{t.context}</p>}
    <div className="mt-1 whitespace-pre-wrap break-words" data-testid="notagent-answer"><span className="font-bold text-nota-green">Prof. NOTA</span>{": "}{t.answer|| (t.state==="pending"?"…":"")}</div>
    {t.state==="incomplete"&&<p className="text-nota-yellow">[Incomplete — excluded from context]</p>}
    {t.usage&&<p className="text-nota-gray text-xs">[{t.usage.input} input · {t.usage.output} output · {t.usage.input+t.usage.output} tokens]</p>}
   </div>)}
  </div>
  <form onSubmit={send} className="shrink-0 border-t border-nota-border px-1 pt-1 pb-2">
   {notice&&<p role="status" className="text-nota-yellow text-xs break-words">{notice}</p>}
   <PromptLine><textarea ref={input} id="notagent-input" aria-label="Your prompt" rows={2} maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={onKey} disabled={running} className="block w-full resize-none bg-transparent text-nota-gray outline-none focus-visible:ring-1 focus-visible:ring-nota-cyan" placeholder="Type your next prompt…"/></PromptLine>
   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1">
    <button className={buttonClass} type="submit" disabled={!ready||running||!message.trim()}>Send</button>
    <button className={buttonClass} type="button" disabled={!running||stopped} onClick={()=>{stopDisplay.current=true;setStopped(true);setNotice("Display stopped. Waiting for provider usage settlement…");}}>Stop</button>
    <button className={buttonClass} type="button" disabled={running||unresolved} onClick={newChat}>New Chat</button>
    <span className="text-xs text-nota-gray">Enter · Shift+Enter: newline</span>
   </div>
  </form>
 </div>;
}
