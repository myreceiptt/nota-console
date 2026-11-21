# EVERGREEN Quarterly — Cluster 4: GitHub Actions Node24 Runtime (2026 Q4)

- Repository: `myreceiptt/nota-console`
- Application: **IMPROMPTU — Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Class: **A — App Repo**
- Baseline: Owner-accepted Quarterly Cluster 3 Production commit `c71832ab3cfa41b6949c640a940bbd5191fab725`
- Baseline Vercel: `dpl_3PbiMMAY5EPx5Q2d9sYfUc6GredJ`, **READY**, serving `https://prompt.endhonesa.com/`
- Implementation PR: https://github.com/myreceiptt/nota-console/pull/24
- **Status: PREVIEW CANDIDATE — awaiting final CI / Vercel Preview / Owner acceptance. NOT merged, NOT in Production.**
- Broader Quarterly status: **IN PROGRESS** until the Owner-accepted final release gates are complete.

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
- [ ] Final GitHub **EVERGREEN Audit** PASS using the new actions (immutable install, recursive security moderate+, TS7 lint, Vite8 build, 4/4 unit and 7/7 Chrome 157 checks).
- [ ] Final GitHub **Recovery Validation** PASS using same actions and commit.
- [ ] Vercel Preview from final PR head **READY** and isolated from Production.
- [ ] Owner confirms Preview parity and authorizes PR merge/Production deployment.
- [ ] Production deployment READY at the verified merge SHA/domain, with final Owner browser acceptance.
- [ ] After acceptance, mark **CLUSTER 4 DONE** and assess **full Quarterly DONE** only if no other required major package/runtime upgrades remain and all pins/deferrals are documented.

## Governance / outstanding limitations

- **No Production merge or deployment without the Owner's explicit approval.**
- Existing Monthly/Quarterly acceptance documentation PRs [#17](https://github.com/myreceiptt/nota-console/pull/17), [#19](https://github.com/myreceiptt/nota-console/pull/19), [#21](https://github.com/myreceiptt/nota-console/pull/21) and [#23](https://github.com/myreceiptt/nota-console/pull/23) remain unmerged intentionally so they do not trigger redundant Vercel Production builds.
- Browser smoke tests run against a locally served build, not the live domain; they do not prove all hidden commands, external links, or CSP headers. Owner Preview/Production acceptance is recorded separately.
- No AI model integration, credentials, wallet transaction, paid services, Vercel Analytics billing changes, or unrelated features are part of this review.
