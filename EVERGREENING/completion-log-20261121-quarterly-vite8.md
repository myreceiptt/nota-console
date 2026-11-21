# EVERGREEN Quarterly — Vite 8 Toolchain Cluster (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Classification: **Class A — App Repo**
- Monthly-accepted Production baseline: `f7a5972b7484cf5b1b5102bd1d5a3ebff09d618c`
- Baseline Vercel deployment: `dpl_LptmN1VAtBz3yJ2u8ikXy725Vw1f` (READY)
- PR: https://github.com/myreceiptt/nota-console/pull/18
- **Status: Quarterly CLUSTER 1 validated by updater CI; pending final CI / Vercel Preview / Owner approval. NOT merged, NOT deployed to Production.**
- Quarterly completion across the entire repo: **NOT YET DONE** (other major clusters deferred).

## Scope / Major upgrade cluster 1 — Vite bundler and its React plugin

| Package | Before | Target | Why in same cluster |
| --- | --- | --- | --- |
| `vite` | `^7.3.8` | `^8.3.8` | Core bundler: Vite 8 switches to Rolldown/Oxc |
| `@vitejs/plugin-react` | `^5.2.0` | `^6.3.0` | Paired Vite 8 React transform/refresh integration |

- Vite configuration `vite.config.ts` unchanged: `plugins: [react()]`, `build.outDir: "dist"`.
- Application `src/`, UX, existing commands, visual assets, and public routes **unchanged** in the source.
- `yarn.lock` regenerated for this cluster; unrelated direct dependency majors are not part of this PR.
- Node **24.x**, Yarn **4.18.1**, React **19.3.1**, TypeScript **5.9.3**, Tailwind **4.3.5** held from Monthly baseline.
- Monthly acceptance documentation PR #17 remains separate, unmerged, and unmodified.
- Official migration references: https://vite.dev/guide/migration and https://vite.dev/blog/announcing-vite8

## Reproducible checks and evidence

**One-time controlled lockfile update / build / audit:** [GitHub Actions #44852546109](https://github.com/myreceiptt/nota-console/actions/runs/44852546109) — SUCCESS.

Checks performed in Node 24 / Yarn 4.18.1:
- `YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install` for the deliberately authorized lockfile update — PASS. The exception is scoped **only to the one-shot updater**, because Yarn enforces immutable installs by default on CI.
- `yarn install --immutable` — PASS after lockfile generation.
- `yarn npm audit -R --severity moderate` — PASS; no audit suggestions reported.
- `yarn lint` — PASS.
- `yarn test:recovery` — **4/4 PASS**.
- `yarn build` — PASS using **Vite 8.3.8**.
- `node tests/browser-recovery.cjs` — **6/6 PASS** on **Chrome 157.0.8103.78**: first character, `!prof!` Enter, autocomplete Tab + Enter, unknown command, `!clear!`, narrow viewport.
- The disposable workflow with `contents: write` permission was **removed** after it updated the lockfile; persistent audit/recovery CI remains read-only.

**Limitations:** The six browser checks run against the built app on localhost, not the real Production hostname. They do not independently prove full visual parity, every hidden command, all offsite links, or HTTP/CSP compliance. The user must verify Preview and approve a later Production release.

## Further verification / release gates

- [x] Restrict change to ONE major toolchain cluster in this PR.
- [x] Update manifest and lockfile; retain current UI and terminal source.
- [x] Pass immutable install, audit, lint, four unit regressions, build, six Chrome smoke scenarios on updater run.
- [x] Remove disposable write-enabled updater workflow.
- [ ] Verify final head with **read-only** CI (both EVERGREEN and Recovery checks).
- [ ] Deploy Vercel Preview from exact final PR head and confirm READY.
- [ ] Owner checks Preview and explicitly approves merge and Production release.
- [ ] Verify Production merge SHA / domain alias / build and owner-accepted terminal behavior.
- [ ] Mark THIS CLUSTER **DONE** only after Production acceptance.
- [ ] Evaluate next major clusters separately; do not label full Quarterly cycle COMPLETE prematurely.

## Deferred major upgrades

- **TypeScript 5 → 7**: separate dedicated PR and type compatibility validation.
- **`@vercel/analytics` 1 → 2**: separate dedicated PR, integration and behavior validation.
- **GitHub Actions action runtimes**, Node major, and `@types/node` remain on their existing documented pins until separately evaluated and authorized.
- **`resolutions.semver=6.3.1`** remains an intentional legacy pin.

## Governance

No app feature, command, agent, wallet transaction, authentication, LLM integration, billing, paid-plan change, or Production modification is authorized by this receipt. **Merge into `main` and Production deployment require explicit Owner approval.** Production continues to serve the previously approved Monthly release until those gates pass.
