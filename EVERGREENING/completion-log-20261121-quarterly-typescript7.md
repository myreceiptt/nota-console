# EVERGREEN Quarterly — Cluster 2: TypeScript 7 Native Compiler (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Classification: **Class A — App Repo**
- Production baseline: **Quarterly Cluster 1 DONE** at `85ceb18c88f923ee60a2d60093a9b85de4b4ec09`
- Baseline Production Vercel: `dpl_2WeHVH3fLAbraiwP2PdPxTK121mx`, READY at `https://prompt.endhonesa.com/`
- Pull Request: https://github.com/myreceiptt/nota-console/pull/20
- **Status: CLUSTER 2 PREVIEW CANDIDATE — CI validation ongoing. NOT merged, NOT deployed to Production, NOT Owner-accepted yet.**
- Entire Quarterly cycle: **NOT DONE**; other major clusters remain separate.

## Upgrade scope — TypeScript compiler family ONLY

| Component | Before | After | Reason |
| --- | --- | --- | --- |
| `typescript` | `^5.9.3` | `^7.0.2` | Stable native Go-based TypeScript 7 compiler; `tsc` remains the typechecker used by `yarn lint` |
| `@typescript/typescript6` | Not installed | `^6.0.2` as dev dependency | Official JS compiler API compatibility for `transpileModule` in the Recovery unit test harness |
| `tsconfig.compilerOptions.target` | `es5` | `es2015` | TypeScript 7 removed ES5 target; `noEmit: true` means Vite remains in charge of JS output |
| `tsconfig.compilerOptions.moduleResolution` | `node` | `bundler` | TypeScript 7 removed node/node10 resolution; bundler mode matches Vite with `module: esnext` |

- The **application source under `src/` is unchanged**. No commands, visual content, images, user flow or UI added/modified.
- The only test harness change is `require('typescript') → require('@typescript/typescript6')`, preserving real TS/TSX-source regression testing for Promise-returning `scrollIntoView()`.
- The TypeScript 7 CLI and TypeScript 6 JS API are deliberately separate; the TypeScript 6 shim is **not used to run `yarn lint`**.
- `yarn.lock` was regenerated for this toolchain cluster; Vite 8.3.8, React 19 and Yarn 4.18.1 remain at their previously approved major versions.
- No `vite.config.ts` change was made; existing non-blocking Vite 8 future-native-config warning remains independently tracked.
- Official reference: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/

## Automated validation evidence

**One-time controlled lockfile update + regression workflow:** [GitHub Actions run #44854211981](https://github.com/myreceiptt/nota-console/actions/runs/44854211981) — **SUCCESS**.

On Node 24 / Yarn 4.18.1 / Chrome 157:
- `YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install` — **PASS** only in the intentionally authorized lockfile-generation step.
- `yarn install --immutable` — **PASS** after lockfile update.
- `yarn tsc --version` — **Version 7.0.2**.
- Legacy regression API available: `@typescript/typescript6` exported `transpileModule` (runtime API version `6.0.3`).
- Recursive audit `yarn npm audit -R --severity moderate` — **PASS**, no audit suggestions reported.
- `yarn lint` (TypeScript 7 native compiler, `--noEmit`) — **PASS**.
- `yarn test:recovery` — **4/4 PASS** (both Chrome 150+ Promise and legacy undefined return cases).
- `yarn build` — **PASS** (Vite 8.3.8).
- `node tests/browser-recovery.cjs` — **6/6 PASS** on Chrome 157.0.8103.78: first keystroke, `!prof!`, Tab autocomplete and Enter, unknown command, `!clear!`, narrow 375 px viewport.
- Temporary `contents: write` workflow removed from branch after successful lockfile generation; the persistent EVERGREEN and Recovery validations remain read-only.

## Release and parity gates

- [x] Separate one-major-cluster branch, from Owner-accepted Cluster 1 Production baseline.
- [x] Implement compiler-only compatible configuration, preserving application code.
- [x] Verify native `tsc` and TS6 test API compatibility.
- [x] Controlled lockfile update; immutable install; security audit; lint; build; unit and Chrome smoke tests pass.
- [x] Remove temporary write-enabled CI updater before proposing release.
- [ ] Final review of PR head via read-only EVERGREEN and Recovery workflows.
- [ ] Vercel Preview READY on exact PR head, with no Production alias.
- [ ] Owner visually accepts Preview and confirms first-character input, `!prof!`, tab autocomplete, hidden commands where practical, desktop/narrow parity.
- [ ] Owner explicitly approves PR #20 merge and Production deployment.
- [ ] Vercel Production deployment READY on exact merge SHA; final Owner live-browser acceptance.
- [ ] Mark **THIS CLUSTER** DONE only after Production approval. Other Quarterly clusters remain separate.

**Evidence limitation:** Chrome smoke runs against the built application served locally during CI, not the live Production domain; this does not prove every hidden command, external link, HTTP/CSP header or visual pixel parity. Owner verification is a mandatory separate gate.

## Deferred major clusters / governance

- `@vercel/analytics` major 1 → 2 and optional Node/GitHub Actions runtime changes require their own reviewed cluster PRs and approvals.
- Monthly final receipt [PR #17](https://github.com/myreceiptt/nota-console/pull/17) and Quarterly Cluster 1 acceptance [PR #19](https://github.com/myreceiptt/nota-console/pull/19) remain separate, intentionally unmerged to avoid unrelated automatic Production deployments.
- No AI, LLM, Web3, wallet transaction, authentication, credential, business feature, paid plan or billing change is part of this upgrade.
- **No merge to `main` or Production deployment without explicit Owner authorization.**
