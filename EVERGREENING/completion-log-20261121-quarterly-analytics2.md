# EVERGREEN Quarterly — Cluster 3: Vercel Web Analytics 2 (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Classification: **Class A — App Repo**
- Baseline: Owner-accepted Quarterly Cluster 2 Production commit `3411d0561f03f2c77808bdf49215927e159d854a`, Vercel `dpl_EFtsDrj5ut9XoW6Es5nt4Ya9a7yy` READY.
- Pull Request: https://github.com/myreceiptt/nota-console/pull/22
- **Status: QUARTERLY CLUSTER 3 PREVIEW CANDIDATE — pending final read-only CI, Vercel Preview and Owner approval. NOT merged and NOT deployed to Production.**
- Entire Quarterly: **NOT YET DONE**; other major clusters and final verification deferred.

## Scope — one major family only

| Dependency | Baseline | Updated | Context |
| --- | --- | --- | --- |
| `@vercel/analytics` | `^1.6.1` | `^2.0.1` | Official stable v2 release, resilient intake and refreshed lockfile |

### Existing integration preserved

- Vercel Web Analytics was **already present** and active in source: `src/components/layout/Main.tsx` imports `Analytics` from `@vercel/analytics/react` and renders a single `<Analytics />`.
- Vercel's official [v2 announcement](https://vercel.com/changelog/improved-data-collection-for-web-analytics-and-speed-insights-with-resilient) states existing integrations continue to function without new configuration and version 2 improves intake reliability. [Package releases](https://github.com/vercel/analytics/releases) identify v2.0.1 as the latest stable v2 release.
- **No `src/` or `public/` files were edited**. No UI, command, project configuration or analytics dashboard setting was changed; no new service or instrumentation was enabled.
- `package.json` and `yarn.lock` updated to Analytics v2.0.1. Existing Node 24, Yarn 4.18.1, React 19, TypeScript 7 and Vite 8 remain at their previously approved major versions.
- An additional focused test in `tests/browser-recovery.cjs` now verifies the **existing React component** injects exactly one Web Analytics script, with `data-sdkv="2.0.1"`, `data-sdkn="@vercel/analytics/react"`, and default script path `/_vercel/insights/script.js`. Existing six terminal tests remain intact.

## Reproducible validation

**Controlled one-time lockfile refresh:** [GitHub Actions #44855686189](https://github.com/myreceiptt/nota-console/actions/runs/44855686189) — SUCCESS.

On Node 24 / Yarn 4.18.1 / headless Chrome 157:
- Deliberate one-time `YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install` to generate the new lockfile — PASS, limited to the temporary updater.
- `yarn install --immutable` — PASS.
- Installed `@vercel/analytics` version **2.0.1** confirmed from installed package.
- Existing `Main.tsx` Analytics import and component verified unchanged.
- `yarn npm audit -R --severity moderate` — PASS, "No audit suggestions".
- `yarn lint` (TypeScript 7 native) — PASS.
- `yarn test:recovery` — **4/4 PASS** (scrollIntoView Promise-return and legacy cases).
- `yarn build` (Vite 8.3.8) — PASS.
- `node tests/browser-recovery.cjs` — **7/7 PASS**: single Analytics v2 injection, first character input, `!prof!` Enter, Tab autocomplete and Enter, unknown command, `!clear!`, and 375px viewport.
- Temporary GitHub Actions job with `contents: write` removed from branch after updating `yarn.lock`. Permanent EVERGREEN/Recovery CI remains read-only.

### Known limitations and boundaries

- Script **injection and exact SDK version** were verified in local built-app browser tests; they do **not** independently prove successful live Production Analytics ingestion, dashboard event arrival, exact request volume, or the absence of client-side analytics blockers. Owner may verify the Vercel dashboard separately using existing permissions.
- The analytics script endpoint may be missing on a local `vite preview` server; the focused smoke check intentionally validates injection, not server-side intake.
- Existing non-blocking Vite 8 config-native-loader ESM warning may continue on Vercel. No configuration changes or warning suppression have been applied.
- Upgrading the already-installed SDK does not itself enable or change Vercel Web Analytics service settings; existing Vercel usage limits/billing policies still apply. This work does not authorize a paid tier or subscription change.
- Existing six terminal regression checks test key workflows, not every hidden command, third-party link, or HTTP/CSP header; Owner Preview and Production acceptance are independent gates.

## Release / acceptance gates

- [x] Major upgrade restricted to one Analytics package family; application source preserved.
- [x] Controlled `yarn.lock` regeneration, immutable install, no moderate+ audit suggestions.
- [x] TypeScript 7 typecheck; Recovery regression 4/4; Vite 8 build; Analytics + terminal browser smoke 7/7.
- [x] Remove temporary write-enabled workflow.
- [ ] Final read-only CI from final PR head (EVERGREEN + Recovery) SUCCESS.
- [ ] Vercel Preview READY from exact final PR head; no Production alias.
- [ ] Owner visually verifies protected Preview, terminal parity, Analytics loading as practical.
- [ ] Owner explicitly approves PR #22 merge and Production deployment.
- [ ] Production READY and exact SHA/domain verification, then Owner live-browser acceptance.
- [ ] Only then mark **QUARTERLY CLUSTER 3 DONE**. The entire Quarterly cycle remains separate.

## Deferred

- Potential Node/runtime and GitHub Actions major upgrades evaluated later only if justified.
- Previously accepted documentation-only PRs [#17](https://github.com/myreceiptt/nota-console/pull/17), [#19](https://github.com/myreceiptt/nota-console/pull/19), and [#21](https://github.com/myreceiptt/nota-console/pull/21) stay unmerged to avoid unnecessary automatic Production rebuilds.
- No AI provider, model API, blockchain transaction, wallet activity, new login, credentials, billing configuration or unrelated functionality authorized.

**Never merge this PR or deploy to Production without explicit Owner approval after Preview review.**
