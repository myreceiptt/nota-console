# IMPROMPTU — P5.1R Private Real AI Pilot: Implementation Gate v0.2

**Date:** 2026-11-22 (Asia/Jakarta)  
**Canonical tracker:** [Issue #14](https://github.com/myreceiptt/nota-console/issues/14)  
**Baseline:** P5.1 Owner-approved Production, `main` at `48cb6c82ab777711fcad3d85abef895e5259b987` at plan review. Recheck `main` before implementing.  
**Status:** Engineering preparation only. **No model, API credentials, paid request, Production rollout, public Guest AI or spend authorization.**

## Objective

Validate exactly one real language-model stream in a **protected Owner-only Vercel Preview**, without altering the original Console, P5.0 AI CHAT MOCK, or P5.1 scripted Foundation Sandbox. P5.2 public Guest AI stays out of scope.

## Owner decision record (not yet accepted)

| Item | Proposed bounded pilot | Status |
| --- | --- | --- |
| Model | Begin with **one** model, not automatic multi-model routing; verify identifier and price at implementation time | Pending selection |
| Provider route | Provider API or Vercel AI Gateway, with secrets restricted to Preview and never shipped in Vite client bundles | Pending |
| Spend | Draft USD **$5 total**, **$1/day**; **not enforced or approved** merely by writing this document | Pending |
| Output | Maximum 800 generated tokens per request; input ≤1000 chars; bounded request and response bytes | Proposed |
| Audience | Owner-only private Preview, server-verified identity; no public unauthenticated pilot | Required |
| Data | Only pre-reviewed, versioned public NOTA profile facts; no private chat memory, wallet details or automatic internet retrieval | Proposed |
| Storage | No durable prompt/completion history; durable aggregate quota/spend counters and minimal security metadata only; review provider/platform retention separately | Proposed |
| Actions | No tool invocation, transactions, wallet connections, account writes, browser actions or provider-selected plugins | Required |
| Release | Preview tests + explicit Owner acceptance; no Production enablement or public Guest until separate approval | Required |

**Important:** API subscription/billing, model availability, and the precise US-dollar ceilings must be verified and approved independently. In-memory request counters are not a spend cap. Provider dashboard budgets/alerts alone are not hard, synchronous authorization guards.

## Architectural increments, in execution order

1. **Identity/access gate.** Implement server-side authenticated Owner session validation. Do not rely on a client-provided email, boolean, wallet address, secret URL, Origin check alone, or client-side hiding. Unauthorized and unauthenticated requests return before contacting the provider.
2. **Dedicated route.** Add `POST /api/ai/pilot` separately from `/api/ai/chat`; retain P5.1's existing Preview-only scripted route. Fail closed for `VERCEL_ENV !== preview`, absent explicit pilot enablement, missing authentication, unavailable ledger, absent credentials or exhausted limits.
3. **Durable global accounting.** Shared transactional/atomic ledger across function instances for admission, in-flight reservation, actual usage settlement and release; cap requests/minute/day, one or few concurrent jobs, per-request worst-case charge, daily and lifetime spend. Do not issue a provider call unless atomic budget reservation succeeds. Stale reservations need safe recovery; reserve conservatively with a clear reconciliation policy.
4. **Provider adapter.** One approved model and server-secret route, timeout/abort propagation, bounded token/output lengths, no tools, no arbitrary system prompt from clients. Reconcile actual provider billable usage, including errors/retries, using provider usage data where available; treat unknown costs as spent until checked. Reject unknown model pricing changes rather than silently continuing.
5. **Policy and consent.** Display clear 'experimental AI' labeling, model/provider routing, no-secret warning, privacy/retention notice and confirmation prior to request. Approved public identity/knowledge comes from a versioned reviewed file; uncertain facts must be qualified.
6. **Streaming.** Strict same-origin browser contract and CSRF/session protection, SSE `meta / delta / done / error`, escaped React text, no HTML injection. Handle cancel, timeout, disconnect, upstream failures, and malformed frames. Avoid recording full prompts in logs.
7. **Evaluation.** Owner tests NOTA identity, uncertainty about private facts, refusal to execute transactions, injection attempts, multilingual messages, prompt cancellation, quota exhaustion, direct API abuse, and model error behavior.

## Mandatory automated acceptance matrix

- `production` and `development` requests **never** reach a real provider, even with feature flags and credentials present.
- Unauthenticated/forged Owner requests, cross-origin POST, oversized or malformed body, and extra user-supplied provider/system fields are rejected without billing.
- Shared rate limiter and budget ledger are atomic across concurrent worker requests; requests above max/day or lifetime are blocked **before** provider invocation; simulated worker restart cannot reset spend.
- Default-deny on missing secrets, malformed price configuration, failed ledger connectivity, unknown model, and upstream HTTP 429/500; no fallback to unapproved providers.
- Provider streaming sends only bounded escaped content; abort prevents further generation where supported and conservatively reconciles usage when not provable.
- All existing Recovery, Foundation, Evergreen, and browser regression gates still pass; the first 3 modes have unchanged semantics.
- Preview function HTTP/SSE verified on an authenticated real Vercel deployment, not just mocked browser fetch.
- Security review includes deployment protection, Vercel env scoping, no secrets in git/client bundle, audit evidence, and privacy disclosure.
- Owner explicitly accepts Preview and any future Production release separately.

## Next permitted work

Write isolated, non-billable tests and architecture adapters only after agreeing on the identity and durable ledger implementation choices; never activate a real provider or allocate spend on the basis of this planning document. For a real pilot, the Owner must authorize **one precise model**, **credential/billing arrangement**, **hard USD ceilings**, **Owner-only login mechanism**, and **public persona v1 source snapshot**. Credentials are entered only through the provider or Vercel secret UI, never posted into GitHub or chat.

## Existing Production UX note

P5.1 Foundation Sandbox is intentionally unavailable in Production; its generic 'Preview backend could not stream' message can confuse visitors. Track as separately scoped non-blocking copy debt, not an outage and not a reason to silently make P5.1 active in Production.
