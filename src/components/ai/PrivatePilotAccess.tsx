import { useEffect, useState, type FormEvent } from "react";

// Never put Supabase access tokens, OTP values, or service keys into localStorage.
// The session is held only by the server's Secure HttpOnly same-site cookie.
type Phase = "checking" | "email" | "signed-in";
type Payload = { authenticated?: boolean; status?: string; error?: string };

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
    const validToken = !!accessToken && /^[A-Za-z0-9_\\-.]{20,4096}$/.test(accessToken);
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
        setPhase("email");
      }
    } catch {
      setNotice("Request not completed. Check Owner authorization or service configuration.");
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
        <p>Model integration is disabled until the shared spend ledger, model selection, and separate Owner authorization are complete.</p>
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
