import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

// Never put Supabase access tokens, OTP values, or service keys into localStorage.
// The session is held only by the server's Secure HttpOnly same-site cookie.
import PrivatePilotChat from "./PrivatePilotChat";
import TerminalTitle from "../terminal/TerminalTitle";

type Phase = "checking" | "email" | "signed-in";
type Payload = { authenticated?: boolean; status?: string; error?: string };
type Ledger = { admission_enabled: boolean; total_cap_microusd: number; daily_cap_microusd: number; spent_total_microusd: number; reserved_total_microusd: number };
type TokenLedger = { token_cap: number; input_tokens: number; output_tokens: number; reasoning_tokens: number; reserved_tokens: number; completed_requests: number };
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

export default function PrivatePilotAccess({ active }: { active: boolean }) {
  const [closed,setClosed]=useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
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
      const response = await fetch("/api/ai/pilot-budget", {
        credentials: "same-origin", cache: "no-store", signal: controller.signal
      });
      const data = await response.json() as { ledger?: Ledger; tokens?: TokenLedger; error?: string; model_enabled?: boolean };
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        setLedger(null);setTokens(null);setModelReady(false);
        setPhase("email");
        setNotice("Owner session expired or missing. Request a new Magic Link on this Preview.");
        return;
      }
      if (!response.ok || !data.ledger || typeof data.model_enabled !== "boolean") {
        setLedger(null);setTokens(null);setModelReady(false);
        setLedgerNotice("Budget ledger unavailable (" + (data.error || "invalid_response") + "). AI remains disabled.");
        return;
      }
      setLedger(data.ledger);
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
      : session();
    void flow.then((data) => {
      if (!cancelled) setPhase(data.authenticated ? "signed-in" : "email");
    }).catch(() => {
      if (!cancelled) {
        setPhase("email");
        setNotice(accessToken ? "Magic Link expired or Owner authorization failed. Request a new link." :
          "Private pilot authentication is not configured.");
      }
    });
    return () => { cancelled = true; };
  }, [active]);

  async function handle(action: "request_otp" | "logout") {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const data = await session(action === "logout" ? { action } : { action, email: email.trim() });
      if (action === "request_otp" && data.status === "otp_requested") {
        setNotice("Check your Owner email and open the newest Magic Link on this protected Preview.");
      } else if (action === "logout") {
        probe.current?.abort();
        setLedger(null);setTokens(null);setModelReady(false);
        setLedgerNotice("");
        setLedgerBusy(false);
        setPhase("email");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "email_rate_limited") {
        setNotice("Supabase email sending limit reached. Do not retry repeatedly. Try again after the quota resets.");
      } else {
        setNotice("Magic Link request unavailable. Check Supabase Auth email delivery and Preview configuration.");
      }
    } finally {
      setBusy(false);
    }
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
          <span className="text-nota-green">Owner session verified.</span>
          <span className={modelReady?"text-nota-green":"text-nota-yellow"}>{modelReady?"CONNECTED":"CHECK USAGE"}</span>
          <button type="button" disabled={busy} onClick={()=>void handle("logout")} className="text-nota-yellow hover:text-nota-cyan">Sign out</button>
        </div>
        <details data-testid="pilot-budget-status" className="pb-1">
          <summary className="cursor-pointer text-nota-cyan">Usage · {tokens?((tokens.input_tokens+tokens.output_tokens).toLocaleString("en-US")+" / "+tokens.token_cap.toLocaleString("en-US")+" local tokens"):"Ledger"}</summary>
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
          <p>BytePlus ModelArk · Dola-Seed-2.0-mini 260428 · Free-only, no paid fallback.</p>
          <p>Local usage is not the provider invoice or remaining account quota.</p>
          <button type="button" disabled={ledgerBusy||busy} onClick={()=>void checkLedger()} className="text-nota-yellow hover:text-nota-cyan disabled:opacity-40">Check budget ledger</button>
        </details>
        <p className="pb-1">AI-mediated · Public or dummy data only. Prompts go to BytePlus. Session-only history.</p>
        {notice&&<p role="status" className="text-nota-red">{notice}</p>}
      </div>
      <PrivatePilotChat active={active&&!closed} ready={modelReady&&!ledgerBusy&&!busy} unresolved={!tokens||tokens.reserved_tokens>0} onRefresh={checkLedger} onSessionExpired={()=>{setPhase("email");setLedger(null);setTokens(null);setModelReady(false);setNotice("Owner session expired. Sign in again.");}}/>
    </> : <div className="min-h-0 flex-1 overflow-y-auto terminal-scrollbar px-1 pt-1 pb-2 text-nota-blue">
      <p className="terminal-title">==== NOTAGENT · Owner Access =======</p>
      <p className="my-4">OiOi! Hi, we are <span className="font-bold text-nota-green">Prof. NOTA!</span></p>
      <p className="mb-4">This AI-mediated conversation is available in the protected Preview.</p>
      {phase==="checking"?<p>Checking Owner session…</p>:<form onSubmit={submit} className="flex max-w-md flex-col gap-2">
        <label htmlFor="pilot-owner-email" className="text-nota-yellow">Owner email</label>
        <input id="pilot-owner-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} className="rounded border border-nota-border bg-nota-black px-2 py-1 text-nota-gray"/>
        <button type="submit" disabled={busy} className="w-fit font-bold text-nota-yellow hover:text-nota-cyan disabled:opacity-40">Send Magic Link</button>
      </form>}
      {notice&&<p role="status" className="text-nota-yellow mt-2">{notice}</p>}
      <p className="mt-4 text-nota-gray text-xs">Never enter seed phrases, credentials or private information. Authentication does not enable paid AI.</p>
    </div>}
  </section>;
}
