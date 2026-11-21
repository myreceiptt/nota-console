# EVERGREEN Quarterly — Cluster 4: GitHub Actions Node24 Runtime (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Class: **A — App Repo**
- Baseline: Owner-accepted Quarterly Cluster 3 Production commit `c71832ab3cfa41b6949c640a940bbd5191fab725`
- Baseline Vercel: `dpl_3PbiMMAY5EPx5Q2d9sYfUc6GredJ`, **READY**, serving `https://prompt.endhonesa.com/`
- Implementation PR: https://github.com/myreceiptt/nota-console/pull/24
- **Status: QUARTERLY CLUSTER 4 DONE — 2026-11-21 (Asia/Jakarta), Owner-accepted Production.** This completion-log edit is documentation-only and does not alter the approved live deployment.
- Broader Quarterly status: **TECHNICAL CYCLE COMPLETE WITH DOCUMENTED EXCEPTIONS** after Owner acceptance of Clusters 1–4, detailed in the closure assessment below. Master Roadmap remains open for separately governed future phases.

## Scope: One major GitHub Actions Node24 runtime cluster

| CI dependency | Before (SHA pinned) | After (SHA pinned) | Role |
| --- | --- | --- | --- |
| `actions/checkout` | `v4.2.2` (`11bd71901bbe5b1630ceea73d27597364c9af683`) | `v7.0.1` (`3d3c42e5aac5ba805825da76410c181273ba90b1`) | Read-only repo checkout; modern Node24 action runtime and safer fork guard |
| `actions/setup-node` | `v4.4.0` (`49933ea5288caeca8642d1e84afbd3f7d6820020`) | `v7.1.0` (`949feb2413d6458794dcd2491c4babbbce0c15c1`) | Node version from repository `.nvmrc`; modern Node24 action runtime |

- Versions and exact tag SHAs were checked against official GitHub `actions/checkout` v7.0.1 and `actions/setup-node` v7.1.0 tags/releases.
- The two changed workflows: `.github/workflows/evergreen-audit.yml` and `.github/workflows/recovery-validation.yml`. No unrelated workflow, app, terminal or dependency update.
- Both workflows use **GitHub-hosted `ubuntu-24.04`**, retain `permissions: contents: read`, `persist-credentials: false`, `node-version-file: .nvmrc` and immutable Yarn install. There are **no** registry authentication, npm automatic cache, `pull_request_target`, `workflow_run`, Docker-container authenticated git or write-permission requirements in these two jobs.
- New checkout action's fork safeguards and setup-node's dropped dummy `NODE_AUTH_TOKEN` fallback do not conflict with these workflows.
- Earlier Evergreen audit logs explicitly warned that the old checkout/setup-node actions target deprecated Node20 and were forcibly run under Node24. The updated actions natively target Node24.

## App Runtime & Dependency Evaluation (no major change)

- Node.js app version remains **24.x**, consistent in `.nvmrc`, `package.json#engines`, GitHub CI and Vercel. Node 24 is **Maintenance LTS** until **2028-04-30**; Node 26 is **Active LTS** but is deferred because no current compatibility, build or security evidence requires a disruptive app major switch.
- GitHub-hosted runners `ubuntu-24.04` stay fixed rather than using a moving `ubuntu-latest` alias.
- Yarn **4.18.1** remains pinned in `package.json` and `.yarnrc.yml`.
- Latest prior direct-dependency audit [EVERGREEN CI #44856553400](https://github.com/myreceiptt/nota-console/actions/runs/44856553400) listed all direct packages at latest available registry versions, except intentionally pinned `@types/node 24.10.7` (latest overall npm major 26, not compatible with chosen Node major policy). Existing `resolutions.semver=6.3.1` is deliberate. This registry-version table is not the same as literally running `yarn outdated`.
- Stable **Vite 8**, **React 19**, **TypeScript 7** and **Analytics v2** are preserved from the accepted Clusters 1–3. No `src/`, `public/`, `package.json`, `yarn.lock`, configuration or user-facing behavior was changed in Cluster 4.
- Known non-blocking Vite 8 `vite.config.ts` ESM/CommonJS native-loader warning remains for a later risk-based review. Analytics v2 script injection is tested, but end-to-end Analytics dashboard event ingestion has not been verified.

## Baseline and upstream evidence

- Official Node.js schedule: https://github.com/nodejs/Release (24.x Maintenance LTS until 2028-04-30; 26.x Active LTS).
- GitHub Node20 action retirement: https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/
- Official actions:
  - https://github.com/actions/checkout/releases/tag/v7.0.1
  - https://github.com/actions/setup-node/releases/tag/v7.1.0

## Release / acceptance gates

- [x] Isolated one-major-cluster PR from Owner-accepted Production baseline.
- [x] Upgrade only the two coordinated GitHub Actions runtime dependencies; SHA-pin exact reviewed stable releases.
- [x] Preserve Node24/Yarn4 app policy and both CI workflows' read-only credentials/permissions.
- [x] [EVERGREEN Audit #44856937284](https://github.com/myreceiptt/nota-console/actions/runs/44856937284) SUCCESS on exact reviewed head `472192980911d62f6e6657ba22d7987b6d78d23a`: immutable install, recursive moderate+ security audit clean, TS7 typecheck, Vite8 build, 4/4 unit and 7/7 Chrome 157 checks.
- [x] [Recovery Validation #44856937230](https://github.com/myreceiptt/nota-console/actions/runs/44856937230) SUCCESS on exact reviewed PR head, same pinned GitHub Actions v7 runtime.
- [x] Vercel Preview `dpl_4FnkYdATEkB7xALMLE4D4hNsSKmD` READY for exact PR head, isolated from Production with no alias error.
- [x] Owner explicitly approved Preview and authorized merge/Production: “Quarterly Cluster 4 Preview approved. Lanjutkan merge dan Production deployment.” PR #24 merged at `d0ed6d1560c84b9ce7680d010e92219a837cad29`.
- [x] Production Vercel `dpl_CDxYHAkkTqvUxTn9M5rXsP5cZxom` READY and bound to `prompt.endhonesa.com` with matching exact GitHub main SHA, no alias error. Final Owner confirmation: “Quarterly Cluster 4 Production approved.”
- [x] **CLUSTER 4 DONE** after explicit final Owner Production acceptance. Quarterly closing audit found all planned/necessary major clusters completed; Node26 was deliberately deferred with Node24 supported, and deliberate dependency pins documented. **Overall Quarterly maintenance technical gates fulfilled with stated exceptions**, no new release required for closure.

## Governance / outstanding limitations

- The implementation merge/Production deployment were explicitly Owner-authorized and completed. **This documentation-only acceptance update does not authorize another Production deployment**, AI work, or subsequent upgrades.
- Existing Monthly/Quarterly acceptance documentation PRs [#17](https://github.com/myreceiptt/nota-console/pull/17), [#19](https://github.com/myreceiptt/nota-console/pull/19), [#21](https://github.com/myreceiptt/nota-console/pull/21) and [#23](https://github.com/myreceiptt/nota-console/pull/23) remain unmerged intentionally so they do not trigger redundant Vercel Production builds.
- Browser smoke tests run against a locally served build, not the live domain; they do not prove all hidden commands, external links, or CSP headers. Owner Preview/Production acceptance is recorded separately.
- No AI model integration, credentials, wallet transaction, paid services, Vercel Analytics billing changes, or unrelated features are part of this review.

## Final Production Acceptance Receipt — 2026-11-21 WIB

**Owner approval (verbatim):** “Quarterly Cluster 4 Production approved.”

- [Implementation PR #24](https://github.com/myreceiptt/nota-console/pull/24) **MERGED**: exact GitHub `main` commit `d0ed6d1560c84b9ce7680d010e92219a837cad29`.
- **Vercel Production:** deployment `dpl_CDxYHAkkTqvUxTn9M5rXsP5cZxom`, **READY**, domain `https://prompt.endhonesa.com/` mapped to the identical merge commit with `aliasError: null` after Owner approval.
- **Scope:** read-only `actions/checkout v7.0.1` and `actions/setup-node v7.1.0` SHA-pinned updates only in two GitHub Actions workflows; no application source, build runtime, Vercel settings or service feature changes.
- **CI:** [EVERGREEN Audit #44856937284](https://github.com/myreceiptt/nota-console/actions/runs/44856937284) and [Recovery Validation #44856937230](https://github.com/myreceiptt/nota-console/actions/runs/44856937230), both **SUCCESS** on reviewed source (immutable Yarn, recursive moderate+ security audit, TypeScript 7, Vite 8 build, 4/4 regression unit tests and 7/7 Chrome 157 smoke checks).
- **Acceptance source:** explicit Owner statement above. Local Chrome smoke tests are separate from, and not an exhaustive substitute for, actual live-browser acceptance.
- **Existing limitation:** Vite's native-config-loader ESM/CommonJS compatibility warning is nonblocking but should be reassessed at a future Vite major. Analytics v2 script injection was validated; actual dashboard event ingestion was not independently confirmed.

**Decision: Quarterly Cluster 4 DONE.**

## Overall EVERGREEN Quarterly Closure Assessment — 2026 Q4

- **Quarterly Cluster 1 (Vite 8 + React plugin 6): DONE** — Owner-accepted [PR #18](https://github.com/myreceiptt/nota-console/pull/18).
- **Quarterly Cluster 2 (TypeScript 7): DONE** — Owner-accepted [PR #20](https://github.com/myreceiptt/nota-console/pull/20).
- **Quarterly Cluster 3 (Vercel Web Analytics 2): DONE** — Owner-accepted [PR #22](https://github.com/myreceiptt/nota-console/pull/22).
- **Quarterly Cluster 4 (GitHub Actions v7 runtime): DONE** — Owner-accepted [PR #24](https://github.com/myreceiptt/nota-console/pull/24).
- **Monthly:** previously completed and Owner-accepted. Latest Production `main` and Vercel deployment match. No further mandatory major upgrade identified by the final audit.
- **Dependency-version evidence:** prior [EVERGREEN dependency audit #44856553400](https://github.com/myreceiptt/nota-console/actions/runs/44856553400) checked installed and registry-latest versions of all direct dependencies; all were current except intentionally pinned `@types/node 24.10.7` for the Node24 app runtime policy. Yarn `4.18.1` was latest. The deliberate `resolutions.semver=6.3.1` override was preserved. **A literal `yarn outdated` empty-output result has not been separately recorded**; the registry-latest audit and documented intentional pins provide the completion evidence instead.
- **Runtime deferral:** Node24 remains supported in Maintenance LTS through 2028-04-30 and aligned in `.nvmrc`, `package.json#engines`, CI and Vercel. Node26 Active LTS is intentionally **deferred**, since current builds and browser regressions pass and no critical need to move major was found.
- **Security / build / parity:** immutable lockfile installation, moderate+ recursive Yarn security audit, TypeScript typecheck, Vite production build and seven automated Chrome regression checks pass; Owner acceptance recorded for each Production cluster.
- **Tracked non-blocking follow-ups:** Vite8 future native config-loader warning, separate Analytics event-ingestion/dashboard verification, and optional broader live-hostname header/CSP/link tests when maintenance scope authorizes them. These are not misrepresented as completed checks.

**Technical closing decision: EVERGREEN Q4 MONTHLY + QUARTERLY COMPLETE WITH DOCUMENTED EXCEPTIONS.** No more major cluster is currently required for this maintenance cycle. [Issue #14](https://github.com/myreceiptt/nota-console/issues/14) stays OPEN for future AI/project roadmap phases; completion of EVERGREEN does **not** approve AI implementation, billing, credentials, or any new Production deployment.

**Document governance:** This Markdown-only receipt PR is intentionally kept separate/unmerged because Vercel Git integration would trigger an unnecessary Production rebuild on merge. Canonical acceptance and closure will be published directly to Issue #14.
