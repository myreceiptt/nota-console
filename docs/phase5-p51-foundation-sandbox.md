# IMPROMPTU — P5.1 AI Foundation: Safe Server Streaming Sandbox v0.1

**Date:** 2026-11-21 (Asia/Jakarta)  
**Canonical tracker:** https://github.com/myreceiptt/nota-console/issues/14  
**Production baseline:** `e9cec134670e1c024ea8e50dfd7f3a518affff90` (P5.0, Owner accepted).  
**Status:** **Preview-only FOUNDATION WORK**. Not a real AI model, not a public product release, not a budget authorization.

## Scope authorization and limits

Owner instructed: **“Kerjakan tahan berikutnya, P5.1 – AI Foundation.”**

This authorizes development of a working server/UI foundation in **isolated Preview**. Since the Owner has not approved any model, provider, model credentials, quota, paid usage, retention policy, or public launch, this increment has **no LLM usage**. A provider-neutral, hardcoded `scripted-preview` adapter exercises the server streaming contract end-to-end. It cannot be switched to a live model via an environment variable or request parameter.

**Do not merge/deploy Production or activate a model until separately authorized.**

## Existing features preserved

- P5.0 Console and AI CHAT MOCK remain available and unchanged as the first two modes. Existing Console is still the default.
- A third, explicit **FOUNDATION SANDBOX** mode is added for test-driving the backend stream.
- The original command map, hidden commands, keyboard constraints, P5.0 local mock, Web Analytics integration, and public assets are unmodified.
- User-supplied and streamed output is displayed as escaped React text; no `dangerouslySetInnerHTML`, HTML execution, third-party JavaScript, Markdown injection, or tool execution.

## Architecture

```
Classic Console Mode ── deterministic command map (unchanged)
AI CHAT MOCK        ── local P5.0 scripted responses (unchanged)
FOUNDATION SANDBOX  ── React textarea + SSE stream parser (new)
                                 │
                         POST /api/ai/chat
                         Vercel Node Function (new)
                                 │
                         Preview env only
                     strict same-origin check
                     POST + JSON only
                     1000 char message limit
                     4096 byte request cap
                     no-store / nosniff
                                 │
                       versioned public persona
                       provider adapter interface
                            scripted-preview
                                 │
                     deterministic bounded SSE
                   meta → delta(s) → done/error
```

- `lib/ai/foundation.mjs`: public, limited NOTA identity snapshot v0.1 and provider abstraction. No private conversation memories, wallet identifiers, password, sensitive financial facts or unapproved knowledge source is embedded.
- `api/ai/chat.mjs`: Vercel Function, Node.js runtime, response streaming and fixed error codes; **hard disables outside `VERCEL_ENV=preview`**, including accidental Production deployment.
- `src/components/ai/FoundationSandbox.tsx`: third mode, handles SSE, abort/stop, retry/clear, network errors and touch/keyboard interaction; uses `fetch` only for this sandbox route.
- `src/components/layout/ModeShell.tsx`: adds a discrete Foundation Sandbox switch without removing previous Console/AI CHAT MOCK options.
- `tests/ai-foundation.test.cjs`: actual Node HTTP contract tests: preview stream, response headers, same-origin, HTTP methods, media type, input limits, malformed JSON, Production fail-closed and adapter deny-list.
- `tests/browser-recovery.cjs`: original ten tests preserved plus two browser UI tests for controlled SSE parsing, safe escaping and return-to-Console; browser harness uses a **stubbed** fetch (Vite preview cannot itself host a Vercel Function), while API behavior is independently checked in Node.
- `package.json` adds `yarn test:foundation` script; Yarn dependency lockfile unchanged.
- Both read-only GitHub Actions workflows cover the new API/source paths and include Foundation contract tests; security audit, TS7, Vite8 build and existing regression checks remain.

## Security and scope decisions

**Fail-closed behavior**
- `VERCEL_ENV !== 'preview'` → HTTP 503 `foundation_not_enabled`. No model API client is present.
- Non-POST → 405; origin must match host → 403; non-JSON → 415.
- JSON input must contain exactly one key `message`, non-empty string of 1–1000 characters, bounded 4096-byte body. No supplied provider/system/tool settings or chat history accepted.
- SSE is fixed-shape JSON lines (`meta`, `delta`, `done` or sanitized `error`), response is no-store and nosniff; no client-side HTML rendering.
- User text is neither deliberately logged nor persisted. Existing infrastructure logs and platform-level telemetry may collect request metadata; do not claim zero metadata processing.
- Client aborts in-flight requests on mode switch/clear/stop, with retry and visible failure state.

**Not yet implemented / not misrepresented as done**
- No authenticated user session, Guest rollout, account quotas, durable shared rate limits, request concurrency caps across server instances, provider budgets, billable tokens, live model adapter, provider credentials, LLM safety policy, agent tools, external knowledge retrieval or database.
- No chat history persistence, export/delete workflow, legal privacy/retention decision, end-to-end billing monitoring, model-output evaluation, real network prompt injection protection or streaming from a live LLM.
- The scripted adapter is a **contract test**, not proof of live model quality or a suitable final persona.
- Vercel function invocations and platform resource use can have hosting costs under applicable plan even with **zero model/API token fees**. Preview access should remain protected; a real public rollout requires durable rate limiting, spend caps, abuse controls and Owner budget approval.

## Preview acceptance gates

- [ ] Both exact-head GitHub CI workflows SUCCESS: immutable Yarn install, recursive moderate+ security audit, typecheck, 4/4 original unit regression, Foundation HTTP tests, Vite8 build, **12/12** Chrome tests (7 baseline + 3 P5.0 + 2 P5.1).
- [ ] Vercel Preview READY from exact final commit, with `/api/ai/chat` genuinely resolved as a Function (not `index.html` SPA fallback); verify headers and response streaming on actual Preview, not simply local Vite tests.
- [ ] Verify no keys, model SDK/provider calls, database or billing changes; no Production alias.
- [ ] Owner checks Console/AI CHAT MOCK unchanged; Foundation Sandbox sends streaming scripted reply, Stop/Retry/Clear, no unsafe HTML, desktop/narrow/mobile; reports issues before release.
- [ ] **Explicit Owner Preview acceptance required**, then a **separate Owner merge/Production authorization** and final Production acceptance; a P5.1 Preview approval cannot authorize real LLM access.

## Future P5.1 live-model readiness decision (not authorized)

Before real LLM streaming, agree on provider/model choices from current catalog, exact cost caps and budget fail-closed mechanisms, public Guest policy, approved Prof. NOTA persona/knowledge sources, retention/consent, upstream error handling and monitoring. Add a durable shared rate limiter rather than relying on process memory. Implement and test those pieces on their own approval-gated PR.

**This is a working backend transport foundation, not a deployed AI service.**
