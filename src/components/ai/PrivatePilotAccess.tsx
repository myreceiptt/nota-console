import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

// Never put Supabase access tokens, OTP values, or service keys into localStorage.
// The session is held only by the server's Secure HttpOnly same-site cookie.
type Phase = "checking" | "email" | "signed-in";
type Payload = { authenticated?: boolean; status?: string; error?: string };
type Ledger = { admission_enabled: boolean; total_cap_microusd: number; daily_cap_microusd: number; spent_total_microusd: number; reserved_total_microusd: number };
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
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerNotice, setLedgerNotice] = useState("");
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const probe = useRef<AbortController | null>(null);

  const checkLedger = useCallback(async () => {
    probe.current?.abort();
    const controller = new AbortController();
    probe.current = controller;
    setLedger(null);
    setLedgerBusy(true);
    setLedgerNotice("Checking budget ledger…");
    try {
      const response = await fetch("/api/ai/pilot-budget", {
        credentials: "same-origin", cache: "no-store", signal: controller.signal
      });
      const data = await response.json() as { ledger?: Ledger; error?: string; model_enabled?: boolean };
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        setPhase("email");
        setNotice("Owner session expired or missing. Request a new Magic Link on this Preview.");
        return;
      }
      if (!response.ok || !data.ledger || data.model_enabled !== false) {
        setLedgerNotice("Budget ledger unavailable (" + (data.error || "invalid_response") + "). AI remains disabled.");
        return;
      }
      setLedger(data.ledger);
      setLedgerNotice("Budget ledger verified.");
    } catch {
      if (!controller.signal.aborted) setLedgerNotice("Budget check unavailable. AI remains disabled.");
    } finally {
      if (!controller.signal.aborted) setLedgerBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!active || phase !== "signed-in") return;
    void checkLedger();
    const recheck = () => { if (document.visibilityState === "visible") void checkLedger(); };
    window.addEventListener("focus", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      probe.current?.abort();
    };
  }, [active, phase, checkLedger]);

  useEffect(() => {
    if (!active) return;
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
        setLedger(null);
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

  return <section aria-label="P5.1R private AI pilot access" className="flex h-full flex-col gap-4 overflow-y-auto rounded-md border border-nota-border bg-nota-gray-dark p-5 font-nota text-sm text-nota-white">
    <header className="border-b border-nota-border pb-3">
      <p className="font-bold text-nota-cyan">IMPROMPTU · PRIVATE REAL AI PILOT</p>
      <p className="mt-2 text-xs text-nota-yellow">Preview-only Magic Link · AI model disconnected · No billable calls</p>
    </header>
    {phase === "checking" ? <p>Checking Owner session…</p> :
      phase === "signed-in" ? <>
        <p role="status">Owner session verified.</p>
        <p>Model integration remains disabled. This is a read-only budget check.</p>
        <div className="rounded border border-nota-border p-3" data-testid="pilot-budget-status">
          <p role="status" className="text-nota-yellow">{ledgerNotice}</p>
          {ledger && <div className="mt-2 flex flex-col gap-1">
            <p>Ledger: CONNECTED</p>
            <p>Total cap: USD {usd(ledger.total_cap_microusd)}</p>
            <p>Daily cap: USD {usd(ledger.daily_cap_microusd)}</p>
            <p>Spent: USD {usd(ledger.spent_total_microusd)}</p>
            <p>Reserved: USD {usd(ledger.reserved_total_microusd)}</p>
            <p>Admission: {ledger.admission_enabled ? "ON" : "OFF"} · AI model: OFF</p>
          </div>}
          <button type="button" disabled={ledgerBusy || busy} onClick={() => void checkLedger()} className="mt-3 rounded border border-nota-border px-3 py-2 disabled:opacity-50">Check budget ledger</button>
        </div>
        <button type="button" disabled={busy} onClick={() => void handle("logout")} className="w-fit rounded border border-nota-border px-3 py-2">Sign out</button>
      </> :
      <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
        <label htmlFor="pilot-owner-email">Owner email</label>
        <input id="pilot-owner-email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          className="rounded border border-nota-border bg-nota-black px-3 py-2 text-nota-white"/>
        <button type="submit" disabled={busy} className="w-fit rounded bg-nota-cyan px-3 py-2 font-bold text-nota-black disabled:opacity-50">
          Send Magic Link
        </button>
      </form>}
    {notice && <p role="status" className="text-nota-yellow">{notice}</p>}
    <p className="mt-auto text-xs text-nota-gray">Never enter wallet seed phrases, passwords or private information. Authentication does not enable paid AI.</p>
  </section>;
}
