# EVERGREEN Quarterly — Vite 8 Toolchain Cluster (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Classification: **Class A — App Repo**
- Monthly-accepted Production baseline: `f7a5972b7484cf5b1b5102bd1d5a3ebff09d618c`
- Baseline Vercel deployment: `dpl_LptmN1VAtBz3yJ2u8ikXy725Vw1f` (READY)
- PR: https://github.com/myreceiptt/nota-console/pull/18
- **Status: QUARTERLY CLUSTER 1 DONE — 2026-11-21 (Asia/Jakarta), Owner-accepted in Production.** This is a documentation-only acceptance update; the live application remains on the approved merge commit and Vercel deployment.
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
- [x] Verify final reviewed PR head `bd801cd5241dcd20c45e74d351bd866390d5e870` with read-only CI: [EVERGREEN Audit #44852693294](https://github.com/myreceiptt/nota-console/actions/runs/44852693294) and [Recovery Validation #44852693266](https://github.com/myreceiptt/nota-console/actions/runs/44852693266), both SUCCESS.
- [x] Vercel Preview `dpl_D8JBZ9UvZpvRPobMKy63Go85B1EF` READY for exact reviewed PR head; no alias error.
- [x] Owner approved Preview and explicitly authorized merge and Production release: “Quarterly Cluster 1 Preview approved. Lanjutkan merge dan Production deployment.”
- [x] Production PR #18 merged at `85ceb18c88f923ee60a2d60093a9b85de4b4ec09`; Vercel deployment `dpl_2WeHVH3fLAbraiwP2PdPxTK121mx` READY, `prompt.endhonesa.com` mapped to that exact SHA, Vite 8.3.8 build completed, aliasError null. Owner subsequently approved live Production. This user-reported acceptance is distinct from CI smoke testing, and does not individually prove all hidden commands or live-hostname CSP.
- [x] This **QUARTERLY CLUSTER 1 is DONE** following Owner's final confirmation: “Quarterly Cluster 1 Production approved.” The *full Quarterly cycle* is not yet complete.
- [ ] Evaluate next major clusters separately; do not label full Quarterly cycle COMPLETE prematurely.

## Deferred major upgrades

- **TypeScript 5 → 7**: separate dedicated PR and type compatibility validation.
- **`@vercel/analytics` 1 → 2**: separate dedicated PR, integration and behavior validation.
- **GitHub Actions action runtimes**, Node major, and `@types/node` remain on their existing documented pins until separately evaluated and authorized.
- **`resolutions.semver=6.3.1`** remains an intentional legacy pin.

## Governance

No app feature, command, agent, wallet transaction, authentication, LLM integration, billing, or paid-plan change was introduced by this Quarterly toolchain release. The approved PR #18 merge and Production deployment have completed. This final acceptance receipt does **not** authorize further major upgrades, any new Production redeployment, or paid services; future clusters require their own approval.

## Final Production Acceptance Receipt — 2026-11-21 WIB

**Owner approval (verbatim):** “Quarterly Cluster 1 Production approved.”

- Implementation PR [#18](https://github.com/myreceiptt/nota-console/pull/18) merged and reviewed; merge commit `85ceb18c88f923ee60a2d60093a9b85de4b4ec09`.
- Released toolchain: Vite `8.3.8`, `@vitejs/plugin-react` `6.3.0`.
- Production Vercel deployment `dpl_2WeHVH3fLAbraiwP2PdPxTK121mx` **READY**, pointing to approved SHA with Production alias `prompt.endhonesa.com` and no alias error.
- Final CI evidence: [EVERGREEN Audit #44852693294](https://github.com/myreceiptt/nota-console/actions/runs/44852693294) and [Recovery Validation #44852693266](https://github.com/myreceiptt/nota-console/actions/runs/44852693266) **SUCCESS**; immutable install, Yarn moderate+ recursive security audit, TypeScript typecheck, 4/4 unit regression, Vite production build, 6/6 Chrome 157 browser smoke.
- Owner reported live Production acceptance, separately from automated CI. No independent exhaustive live-browser check was carried out for every hidden command, offsite link, or HTTP/CSP header.
- **Known non-blocking future compatibility warning:** `vite.config.ts` ESM syntax while package defaults to CommonJS may require explicit module format when native Vite config loading becomes standard; not a current build failure.
- **Decision: Quarterly Cluster 1 DONE.** The entire Quarterly cycle still includes other major upgrade clusters evaluated independently with Owner-approved Preview/Production gates.

This receipt is documentation-only. To avoid an unrequested Vercel rebuild, its merge into `main` should remain separately authorized; the corresponding acceptance is already recorded in [Issue #14](https://github.com/myreceiptt/nota-console/issues/14).
