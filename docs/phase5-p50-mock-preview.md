# IMPROMPTU — Phase 5 P5.0 Mock-only UI Acceptance Specification

**Date:** 2026-11-21 (Asia/Jakarta)  
**Standard:** Prof. NOTA EVERGREEN v1.7, Class A  
**Canonical tracking:** https://github.com/myreceiptt/nota-console/issues/14  
**Implementation:** P5.0 **MOCK-ONLY PRODUCTION — OWNER ACCEPTED / DONE**. This is not a real AI, model gateway, agent, or public AI release.  
**Source baseline:** Owner-accepted Production `d0ed6d1560c84b9ce7680d010e92219a837cad29`.

## Scope accepted by Owner

> Phase 5 P5.0 approved. Lanjutkan mock-only Preview.

This approval authorizes an isolated Preview branch/PR with a **demonstrable local scripted conversation and mode switch only**. It does **not** authorize a Production merge/deployment, AI provider/model account, API credential, AI requests, billing, persistent user data, or high-impact agent capability.

### Product behavior implemented for Preview

1. **Classic Console Mode is the default.** The original `TerminalContainer`, its command map, hidden-command behavior, styling, local typed content and Analytics component are retained. Existing Console session/draft survives toggling to/from AI Chat.
2. **Explicit mode controls** above the existing terminal: `CONSOLE` and `AI CHAT MOCK`. No new Console command is registered at P5.0; `!ai!` / `!console!` remain possible future design decisions and are **not** advertised as working commands.
3. **AI Chat Mock Mode** is a terminal-styled React conversation with visitor/NOTA roles, normal `textarea`, Enter-to-send, Shift+Enter newline, Clear and Retry. Responses are locally generated deterministic sample strings with clearly visible **MOCK ONLY** status, not an LLM. The initial greeting uses Prof. NOTA's 0101 Universe motif. Draft capped at 1,000 characters. Chat state is ephemeral React memory, not persisted.
4. **No API or LLM calls.** No AI SDK, provider adapter, backend endpoint, auth or service key added. Existing Vercel Analytics remains unchanged and separate from chat content.
5. **Safe output:** visitor input and scripted mock responses render as escaped React text nodes, **never** `dangerouslySetInnerHTML`, Markdown rendered as HTML, dynamically executed JavaScript, or unsafe links. Existing curated Console HTML output stays unchanged in its existing rendering path.
6. **Keyboard isolation:** the existing global Console document `keydown` handler is enabled only while Console Mode is active and ignores active form/button/anchor controls. Empty-input Tab can reach the mode controls. AI textarea receives native keyboard and composition events. Switching back re-enables Console keyboard and preserves the draft.
7. **Device support:** AI Chat uses a textarea suitable for touch/soft keyboard without changing the legacy Console Mode's separate mobile warning. No collection of user identities or wallet information.

### Technical files

- `src/App.tsx`: mount the new mode shell inside existing Main.
- `src/components/layout/ModeShell.tsx`: accessible opt-in switch, stable mounting of Console and Chat.
- `src/components/ai/MockChat.tsx`: local mock-only conversation, escaped output.
- `src/components/terminal/TerminalContainer.tsx`: optional active flag for keyboard listener; otherwise existing code unchanged.
- `src/hooks/useKeyboardInput.ts`: respect active flag, leave native input/button focus alone; preserve legacy console keystrokes.
- `tests/browser-recovery.cjs`: retain seven baseline browser checks and add three P5.0 checks including XSS-like literal text, retry/clear, mode switching and Console draft preservation.
- This Markdown acceptance specification.

No `package.json`, lockfile, Node runtime, Vercel project settings, `vercel.json`, secrets, `public/` or original `commands.ts` changes.

## Acceptance gates

- [x] Final [EVERGREEN Audit #44863085462](https://github.com/myreceiptt/nota-console/actions/runs/44863085462) and [Recovery Validation #44863085515](https://github.com/myreceiptt/nota-console/actions/runs/44863085515) SUCCESS on final reviewed PR head `f4a42f01a167de8d1ea076dce39ca631cf68a83a`, including immutable install, recursive audit moderate+, TS7 typecheck and Vite8 build.
- [x] Baseline 7/7 Chrome 157 checks and 4/4 Recovery unit regressions PASS.
- [x] Added P5.0 browser coverage **3/3 PASS**, including React escaping of HTML-like input (no `img` node created), keyboard focus/Chat controls and return-to-Console parity. Overall Chrome checks **10/10 PASS**.
- [x] Final [implementation PR #26](https://github.com/myreceiptt/nota-console/pull/26) diff limited to the seven mock-only UI/keyboard/test/doc files documented here; no model/backend/API integration or added dependencies.
- [x] Vercel Preview `dpl_4u3JghzJhjq5MgLykQaEaDVRwNLz` **READY** on reviewed PR head, Preview only/no Production alias error. Owner reports completing the requested manual Preview checks.
- [x] Owner Preview accepted: “Phase 5 P5.0 Preview approved.” Owner separately authorized merge/Production: “hase 5 P5.0 Preview approved. Lanjutkan merge dan Production deployment.” [PR #26](https://github.com/myreceiptt/nota-console/pull/26) MERGED as `e9cec134670e1c024ea8e50dfd7f3a518affff90`; Vercel Production `dpl_FLiEUjabrXK3dty9FEaeAxu8jR74` READY on the exact merge SHA at `https://prompt.endhonesa.com/` with `aliasError: null`. Owner then explicitly confirmed: **“Phase 5 P5.0 Production approved.”**
- [x] Conditional release gate satisfied: Owner approved Preview and subsequently authorized Production merge; no unapproved merge or additional application changes occurred.

### Known limitations and deferred choices

- P5.0 is **not AI**; scripted answers do not provide truth, grounding, live research, knowledge retrieval, or ability to act. There is no cost meter because there are **zero LLM calls**.
- Message history is retained only in the React state for the current tab while navigating between the two modes, and is lost on page reload. There is no server storage, authentication, member history or privacy-consent flow yet.
- Streaming, cancellation, genuine provider errors, server-side rate limiting, durable spend budgets, consent policy, official BYOK/provider linking and persona/knowledge allowlisting are **future P5.1+ gates**, not deceptively represented as built.
- The `!ai!`/`!console!` command aliases, wording, visual hierarchy and future official AI identity need Owner UX review before freeze.
- Existing Vite8 config native-loader warning and separate Analytics dashboard-ingestion/HTTP-CSP evidence gaps remain tracked; they do not get silently reclassified as PASS.

**Final decision (2026-11-21 WIB): P5.0 MOCK-ONLY DONE — Owner accepted Production.** P5.1+ real AI scope, provider, backend, credentials, paid services, budgets and data policies remain **NOT STARTED / NOT APPROVED**. This documentation-only update is intentionally held in a separate **unmerged** acceptance PR to avoid a redundant Vercel Production rebuild; canonical acceptance is recorded in [Issue #14](https://github.com/myreceiptt/nota-console/issues/14).


## Final Production Acceptance — Receipt (2026-11-21 WIB)

**Owner final statement, verbatim:** “Phase 5 P5.0 Production approved.”

### Evidence
- **Implementation PR #26**: https://github.com/myreceiptt/nota-console/pull/26 — MERGED, reviewed PR head `f4a42f01a167de8d1ea076dce39ca631cf68a83a`; exact GitHub `main` merge SHA `e9cec134670e1c024ea8e50dfd7f3a518affff90`.
- **Vercel Production deployment:** `dpl_FLiEUjabrXK3dty9FEaeAxu8jR74`, READY, production target, git ref `main`, exactly `e9cec134670e1c024ea8e50dfd7f3a518affff90`, alias `prompt.endhonesa.com` attached, `aliasError: null`. Owner acceptance is a user attestation about actual browser behavior and is separate from deployment readiness.
- **CI**: [EVERGREEN #44863085462](https://github.com/myreceiptt/nota-console/actions/runs/44863085462) SUCCESS and [Recovery #44863085515](https://github.com/myreceiptt/nota-console/actions/runs/44863085515) SUCCESS, including 4/4 unit regressions, 10/10 Chrome 157 checks and moderate+ security audit. Existing browser checks ran against the locally served production build, not the live hostname; Owner separately accepted live Production.
- **Vercel build log**: Yarn `4.18.1`, Vite `8.3.8`, client bundle emitted, deployment completed. Nonblocking Vite native config-loader warning persists. Latest sampled Vercel server/runtime error report had no error clusters; this is not exhaustive proof of zero client/browser issues.
- **Scope**: Opt-in mock chat, deterministic scripted responses, safe React text output, Console mode preservation and test coverage. No live provider/model, API calls, server function, key, auth, persistence, usage-metering requirement for LLM spend (none exists), new paid service, blockchain transaction or wallet action.
- **Exceptions**: Historical Analytics dashboard ingestion and live hostname HTTP/CSP evidence gaps remain as previously documented. They are not asserted as checked here.

### Governance and next stage
- [x] Mock-only P5.0 Preview approved.
- [x] Explicit Owner merge/Production authorization received.
- [x] Production source/deployment SHA READY verified.
- [x] Owner live Production accepted; **P5.0 DONE**.
- [ ] **P5.1 AI Foundation**: not authorized; require new Owner agreement on product scope, versioned NOTA persona/knowledge, provider/model, backend security, budgets, consent and Preview gate before any paid or real-AI integration.

**Documentation governance:** This receipt update is made on `docs/p50-production-owner-acceptance-20261121` only, not on `main`. Merging a Markdown-only receipt PR could trigger an unnecessary Production rebuild, so the final acceptance must be recorded canonically on Issue #14, and this docs-only PR intentionally stays open/unmerged.
