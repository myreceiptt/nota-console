# IMPROMPTU — Phase 5 P5.0 Mock-only UI Acceptance Specification

**Date:** 2026-11-21 (Asia/Jakarta)  
**Standard:** Prof. NOTA EVERGREEN v1.7, Class A  
**Canonical tracking:** https://github.com/myreceiptt/nota-console/issues/14  
**Implementation:** P5.0 **MOCK-ONLY PREVIEW**, not a real AI, model gateway, agent, or public AI release.  
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

- [ ] Immutable Yarn, recursive security audit moderate+, TypeScript7 typecheck and Vite8 production build SUCCESS on final PR head.
- [ ] Existing 7/7 Chrome157 checks remain PASS, Recovery unit tests 4/4 PASS.
- [ ] New mock chat browser coverage: 3/3 checks PASS; visitor HTML-like text must never create an `<img>` element or execute scripts.
- [ ] Final PR diff limited to mock-only files documented here; no model/backend/API integration or new paid dependency.
- [ ] Vercel **Preview** READY on the exact reviewed PR commit, no Production alias or target, and Owner checks both desktop and narrow/mobile mock user experience.
- [ ] Explicit Owner Preview acceptance **before** considering any Production merge. A separate Owner merge/Production authorization remains required, as does Owner live Production acceptance.
- [ ] If no Preview approval, do not merge; preserve the accepted Production baseline.

### Known limitations and deferred choices

- P5.0 is **not AI**; scripted answers do not provide truth, grounding, live research, knowledge retrieval, or ability to act. There is no cost meter because there are **zero LLM calls**.
- Message history is retained only in the React state for the current tab while navigating between the two modes, and is lost on page reload. There is no server storage, authentication, member history or privacy-consent flow yet.
- Streaming, cancellation, genuine provider errors, server-side rate limiting, durable spend budgets, consent policy, official BYOK/provider linking and persona/knowledge allowlisting are **future P5.1+ gates**, not deceptively represented as built.
- The `!ai!`/`!console!` command aliases, wording, visual hierarchy and future official AI identity need Owner UX review before freeze.
- Existing Vite8 config native-loader warning and separate Analytics dashboard-ingestion/HTTP-CSP evidence gaps remain tracked; they do not get silently reclassified as PASS.

**Decision requested after green CI and protected Preview:** Owner acceptance of the **P5.0 mock-only Preview**, *not* authorization to enable a real AI provider.
