import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

// Never put Supabase access tokens, OTP values, or service keys into localStorage.
// The session is held only by the server's Secure HttpOnly same-site cookie.
import PrivatePilotChat from "./PrivatePilotChat";
import TerminalTitle from "../terminal/TerminalTitle";

type Phase = "checking" | "email" | "signed-in";
type Payload = { authenticated?: boolean; status?: string; error?: string; google?: boolean; role?: "owner"|"member"; session_key?: string; url?: string };
type Ledger = { admission_enabled: boolean; total_cap_microusd: number; daily_cap_microusd: number; spent_total_microusd: number; reserved_total_microusd: number };
type TokenLedger = { token_cap: number; input_tokens: number; output_tokens: number; reasoning_tokens: number; reserved_tokens: number; completed_requests: number };
type MemberUsage = { input_tokens: number; output_tokens: number; reasoning_tokens: number; reserved_tokens: number; completed_requests: number; daily_requests: number };
type Member = { user_id: string; email: string; status: "active"|"blocked"; created_at: string; usage: MemberUsage };
const usd = (micros: number) => (micros / 1000000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");

async function session(body?: Record<string, string>): Promise<Payload> {
  const response = await fetch("/api/ai/pilot-session", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    cache: "no-store"
  });
  const data = await response.json() as Payload;
  if (!response.ok) throw new Error(data.error || "auth_unavailable");
  return data;
}

// Serialize refresh/logout across tabs where Web Locks is available.
let localAuthQueue: Promise<unknown> = Promise.resolve();
function authLock<T>(fn:()=>Promise<T>):Promise<T>{
 if(navigator.locks)return navigator.locks.request("impromptu-auth",fn);
 const next=localAuthQueue.then(fn,fn);localAuthQueue=next.catch(()=>{});return next;
}
async function resumeSession():Promise<Payload>{
 const data=await session();
 if(data.authenticated||!data.google)return data;
 return authLock(async()=>{const check=await session();return check.authenticated?check:session({action:"refresh"});});
}
async function ownerAction(body:Record<string,string|boolean>){
 const response=await fetch("/api/ai/pilot-budget",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await response.json();
 if(!response.ok)throw Error("management_unavailable");
 return data;
}
export default function PrivatePilotAccess({ active }: { active: boolean }) {
  const [closed,setClosed]=useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [google,setGoogle]=useState(false);
  const [role,setRole]=useState<"owner"|"member">("owner");
  const [identity,setIdentity]=useState("");
  const [memberUsage,setMemberUsage]=useState<MemberUsage|null>(null);
  const [unresolved,setUnresolved]=useState(true);
  const [members,setMembers]=useState<Member[]|null>(null);
  const [adminNotice,setAdminNotice]=useState("");
  const [adminBusy,setAdminBusy]=useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [tokens, setTokens] = useState<TokenLedger | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [ledgerNotice, setLedgerNotice] = useState("");
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const probe = useRef<AbortController | null>(null);

  const checkLedger = useCallback(async () => {
    probe.current?.abort();
    const controller = new AbortController();
    probe.current = controller;
    setLedgerBusy(true);
    setLedgerNotice("Checking budget ledger…");
    try {
      let response = await fetch("/api/ai/pilot-budget", {
        credentials: "same-origin", cache: "no-store", signal: controller.signal
      });
      if(response.status===401){
        const recovered=await resumeSession();
        if(controller.signal.aborted)return;
        if(recovered.google&&recovered.authenticated){
          response=await fetch("/api/ai/pilot-budget",{credentials:"same-origin",cache:"no-store",signal:controller.signal});
        }
      }
      const data = await response.json() as { ledger?: Ledger; tokens?: TokenLedger; error?: string; model_enabled?: boolean; role?: "owner"|"member"; session_key?:string; member_usage?:MemberUsage; unresolved?:boolean };
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        setLedger(null);setTokens(null);setModelReady(false);
        setPhase("email");setIdentity("");setMemberUsage(null);setMembers(null);setUnresolved(true);
        setNotice("Session expired or missing. Please connect your identity again.");
        return;
      }
      if (!response.ok || (!data.ledger&&!(data.role==="member"&&data.member_usage)) || typeof data.model_enabled !== "boolean") {
        setLedger(null);setTokens(null);setModelReady(false);
        setLedgerNotice("Budget ledger unavailable (" + (data.error || "invalid_response") + "). AI remains disabled.");
        return;
      }
      setRole(data.role||"owner");setIdentity(data.session_key||"");
      setMemberUsage(data.member_usage||null);setUnresolved(data.unresolved??(!data.tokens||data.tokens.reserved_tokens>0));
      if(data.role==="member")setMembers(null);
      setLedger(data.ledger||null);
      setTokens(data.tokens||null);
      setModelReady(data.model_enabled===true);
      setLedgerNotice("Budget ledger verified.");
    } catch {
      if (!controller.signal.aborted) {setLedger(null);setTokens(null);setModelReady(false);setLedgerNotice("Budget check unavailable. AI remains disabled.");}
    } finally {
      if (!controller.signal.aborted) setLedgerBusy(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "signed-in") return;
    void checkLedger();
    const recheck = () => { if (document.visibilityState === "visible") void checkLedger(); };
    window.addEventListener("focus", recheck);
    const timer=window.setInterval(recheck,30000);
    return () => {
      window.removeEventListener("focus", recheck);
      window.clearInterval(timer);
      probe.current?.abort();
    };
  }, [phase, checkLedger]);

  useEffect(() => {
    if (!active) return;
    setClosed(false);
    let cancelled = false;
    // Supabase default Magic Link returns an access token as a URL fragment.
    // Clear it synchronously, then verify it server-side against Owner UID.
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access_token");
    if (accessToken || fragment.has("error")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const validToken = !!accessToken && /^[A-Za-z0-9_.-]{20,4096}$/.test(accessToken);
    const flow = validToken
      ? session({ action: "accept_magic_link", access_token: accessToken })
      : resumeSession();
    void flow.then((data) => {
      if (!cancelled) {setGoogle(data.google===true);setRole(data.role||"owner");setIdentity(data.session_key||"");setPhase(data.authenticated ? "signed-in" : "email");if(!data.authenticated&&new URLSearchParams(window.location.search).get("auth")==="failed")setNotice("Google connection failed. Please try again.");}
    }).catch(() => {
      if (!cancelled) {
        setPhase("email");
        setNotice(accessToken ? "Magic Link expired or Owner authorization failed. Request a new link." : "Authentication temporarily unavailable. Try again.");
      }
    });
    return () => { cancelled = true; };
  }, [active]);

  async function handle(action: "request_otp" | "logout" | "google_start") {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const data = await (action==="logout"?authLock(()=>session({action})):session(action==="google_start"?{action}:{action,email:email.trim()}));
      if(action==="google_start"&&data.url){window.location.assign(data.url);return;}
      if (action === "request_otp" && data.status === "otp_requested") {
        setNotice("Check your Owner email and open the newest Magic Link on this protected Preview.");
      } else if (action === "logout") {
        probe.current?.abort();
        setLedger(null);setTokens(null);setModelReady(false);
        setLedgerNotice("");setIdentity("");setMemberUsage(null);setMembers(null);setUnresolved(true);
        setLedgerBusy(false);
        setPhase("email");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "email_rate_limited") {
        setNotice("Supabase email sending limit reached. Do not retry repeatedly. Try again after the quota resets.");
      } else {
        setNotice(action==="request_otp"?"Magic Link request unavailable. Check Supabase Auth email delivery and Preview configuration.":"Identity request unavailable. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function manage(body:Record<string,string|boolean>){
    if(adminBusy||role!=="owner"||!google)return;
    setAdminBusy(true);setAdminNotice("");
    try{
      const result=await ownerAction(body);
      if(body.action==="list_members")setMembers(Array.isArray(result.members)?result.members:[]);
      else {if(members!==null)setMembers((await ownerAction({action:"list_members"})).members);await checkLedger();}
      setAdminNotice("Updated.");
    }catch{setAdminNotice("Management request unavailable.");}
    finally{setAdminBusy(false);}
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handle("request_otp");
  }

  return <section aria-label="NOTAGENT terminal" data-testid="notagent-terminal" className={`rounded-md w-full h-full bg-nota-gray-dark/[.96] border border-solid border-nota-border font-nota text-sm shadow-terminal flex flex-col overflow-hidden cursor-default resize transition-all duration-100 ${closed?"scale-0 opacity-0":"scale-100 opacity-100"}`}>
    <TerminalTitle closeTerminal={()=>setClosed(true)} />
    {phase === "signed-in" ? <>
      <div className="shrink-0 px-1 pt-1 text-nota-gray text-xs border-b border-nota-border">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-nota-green">{role==="owner"?"Owner session verified.":"Identity connected."}</span>
          <span className={modelReady?"text-nota-green":"text-nota-yellow"}>{modelReady?"CONNECTED":"CHECK USAGE"}</span>
          <button type="button" disabled={busy} onClick={()=>void handle("logout")} className="text-nota-yellow hover:text-nota-cyan">Sign out</button>
        </div>
        <details data-testid="pilot-budget-status" className="pb-1">
          <summary className="cursor-pointer text-nota-cyan">Usage · {tokens?((tokens.input_tokens+tokens.output_tokens).toLocaleString("en-US")+" / "+tokens.token_cap.toLocaleString("en-US")+" local tokens"):memberUsage?((memberUsage.input_tokens+memberUsage.output_tokens).toLocaleString("en-US")+" personal tokens"):"Ledger"}</summary>
          <p role="status" className="text-nota-yellow">{ledgerNotice}</p>
          {ledger&&<div>
            <p>Ledger: CONNECTED · Admission: {ledger.admission_enabled?"ON":"OFF"}</p>
            <p>Nominal USD cap: {usd(ledger.total_cap_microusd)} total / {usd(ledger.daily_cap_microusd)} daily</p>
            <p>Nominal USD used: {usd(ledger.spent_total_microusd)} · Reserved: {usd(ledger.reserved_total_microusd)}</p>
          </div>}
          {tokens&&<div>
            <p>Input / output: {tokens.input_tokens} / {tokens.output_tokens} · Reserved: {tokens.reserved_tokens}</p>
            <p>Completed requests: {tokens.completed_requests}</p>
          </div>}
          {memberUsage&&<div><p>Your input / output: {memberUsage.input_tokens} / {memberUsage.output_tokens}</p><p>Your requests today: {memberUsage.daily_requests}{role==="member"?" / 3":""} (UTC)</p><p>Completed: {memberUsage.completed_requests} · Reserved: {memberUsage.reserved_tokens}</p></div>}
          {google&&role==="owner"&&<details className="mt-1 border-t border-nota-border"><summary className="text-nota-cyan cursor-pointer">Owner access management</summary>
            <button type="button" disabled={adminBusy} onClick={()=>void manage({action:"list_members"})} className="text-nota-yellow mr-3">Load Members</button>
            {ledger&&<button type="button" disabled={adminBusy} onClick={()=>{if(window.confirm(ledger.admission_enabled?"Pause all AI access?":"Resume AI within existing free-only caps?"))void manage({action:"set_admission",enabled:!ledger.admission_enabled});}} className="text-nota-yellow">{ledger.admission_enabled?"Pause AI":"Resume AI"}</button>}
            {adminNotice&&<p role="status">{adminNotice}</p>}
            {members?.map(m=><div key={m.user_id} className="flex flex-wrap gap-2"><span className="break-all">{m.email} · {m.status} · {m.usage.daily_requests} today</span><button type="button" disabled={adminBusy} onClick={()=>void manage({action:"set_member",user_id:m.user_id,status:m.status==="active"?"blocked":"active"})} className="text-nota-yellow">{m.status==="active"?"Block":"Unblock"}</button></div>)}
            {members?.length===0&&<p>No Members.</p>}
          </details>}
          <p>BytePlus ModelArk · Dola-Seed-2.0-mini 260428 · Free-only, no paid fallback.</p>
          <p>Local usage is not the provider invoice or remaining account quota.</p>
          <button type="button" disabled={ledgerBusy||busy} onClick={()=>void checkLedger()} className="text-nota-yellow hover:text-nota-cyan disabled:opacity-40">Check budget ledger</button>
        </details>
        <p className="pb-1">AI-mediated · Public or dummy data only. Prompts go to BytePlus. Session-only history.</p>
        {notice&&<p role="status" className="text-nota-red">{notice}</p>}
      </div>
      <PrivatePilotChat key={identity||"legacy"} sessionKey={identity||undefined} active={active&&!closed} ready={modelReady&&!ledgerBusy&&!busy} unresolved={unresolved} onRefresh={checkLedger} onSessionExpired={()=>{setModelReady(false);void checkLedger();}}/>
    </> : <div className="min-h-0 flex-1 overflow-y-auto terminal-scrollbar px-1 pt-1 pb-2 text-nota-blue">
      <p className="terminal-title">==== NOTAGENT · {google?"Connect Identity":"Owner Access"} =======</p>
      <p className="my-4">OiOi! Hi, we are <span className="font-bold text-nota-green">Prof. NOTA!</span></p>
      <p className="mb-4">This AI-mediated conversation is available in the protected Preview.</p>
      {phase==="checking"?<p>Checking session…</p>:google?<div className="flex max-w-md flex-col gap-2"><p>Connect your verified Google identity to converse with us. We store minimal identity, session and usage data. Prompts are sent to BytePlus; no permanent chat history. Do not enter private data.</p><button type="button" disabled={busy} onClick={()=>void handle("google_start")} className="w-fit font-bold text-nota-yellow hover:text-nota-cyan disabled:opacity-40">Continue with Google</button></div>:<form onSubmit={submit} className="flex max-w-md flex-col gap-2">
        <label htmlFor="pilot-owner-email" className="text-nota-yellow">Owner email</label>
        <input id="pilot-owner-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} className="rounded border border-nota-border bg-nota-black px-2 py-1 text-nota-gray"/>
        <button type="submit" disabled={busy} className="w-fit font-bold text-nota-yellow hover:text-nota-cyan disabled:opacity-40">Send Magic Link</button>
      </form>}
      {notice&&<p role="status" className="text-nota-yellow mt-2">{notice}</p>}
      <p className="mt-4 text-nota-gray text-xs">Never enter seed phrases, credentials or private information. Authentication does not enable paid AI.</p>
    </div>}
  </section>;
}
