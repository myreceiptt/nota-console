# EVERGREEN Maintenance Receipt — November 2026 (Monthly, Class A)

- Repository: `myreceiptt/nota-console`
- Project: **IMPROMPTU: Prof. NOTA's Console Prompt**
- Date: **2026-11-21** (Asia/Jakarta)
- Standard: [Prof. NOTA EVERGREEN Standard README v1.7](https://github.com/myreceiptt/nota-markdown/blob/main/archived-oioi/2025/12/20251218-evergreen-standard.md)
- Classification: **A — App Repo**
- Baseline: `main` at `fdb6f54a701957434238bf7ffdbe327460c7c8c2` (Recovery accepted in Production)
- Maintenance branch: `evergreen/2026-11-monthly`
- Pull Request: https://github.com/myreceiptt/nota-console/pull/16
- **Status: MONTHLY DONE — 2026-11-21 (Asia/Jakarta).** Owner accepted the EVERGREEN Monthly Production release. This is a documentation-only acceptance update; the released application commit and deployment remain unchanged.

## Monthly — version inventory and changes

Read-only baseline inventory / security run: [GitHub Actions #44847520342](https://github.com/myreceiptt/nota-console/actions/runs/44847520342).

- Baseline: Node 24.x; Yarn **4.12.0**; React **19.2.3**; Vite **7.3.1**.
- Baseline recursive audit `yarn npm audit -R --severity moderate`: **FAIL** (multiple known advisories in direct/transitive dependency tree). Examples: vulnerable versions of Vite, browserslist, baseline-browser-mapping, glob, ip-address, and @isaacs/brace-expansion.
- Current-major direct dependency range updates (**12**, no major jumps):
  - `@types/react`: 19.2.9 → **19.3.0**
  - `@types/react-dom`: 19.2.3 → **19.3.0**
  - `react`, `react-dom`: 19.2.3 → **19.3.1**
  - `react-icons`: 5.5.0 → **5.7.0**
  - `@tailwindcss/postcss`, `tailwindcss`: 4.1.18 → **4.3.5**
  - `@vitejs/plugin-react`: 5.1.2 → **5.2.0**
  - `autoprefixer`: 10.4.23 → **10.7.0**
  - `postcss`: 8.5.6 → **8.5.33**
  - `prettier`: 3.8.1 → **3.10.1**
  - `vite`: 7.3.1 → **7.3.8**
- Yarn updated within major: **4.12.0 → 4.18.1**; `packageManager`, `.yarnrc.yml` and tracked `.yarn/releases/yarn-4.18.1.cjs` updated. Old Yarn release removed.
- `yarn.lock` regenerated using Yarn 4 within declared semver ranges. Transitive resolutions refreshed; no JavaScript/React application logic or visual content was changed.
- Intentionally pinned: `@types/node@24.10.7` (stays aligned to Node 24 and previous approved pin); `resolutions.semver=6.3.1` (legacy compatibility pin, to revisit in separate review).

## Security / build / regression verification

Monthly update and verification workflow: [GitHub Actions #44847707006](https://github.com/myreceiptt/nota-console/actions/runs/44847707006).

On Ubuntu runner using **Node 24**, new Yarn 4.18.1 and headless **Chrome 157.0.8103.78**:
- `yarn install --immutable`: **PASS**
- `yarn npm audit -R --severity moderate`: **PASS** (no audit findings at or above moderate severity reported in that run)
- `yarn lint` (TypeScript): **PASS**
- `yarn test:recovery`: **4/4 PASS**
- `yarn build` (Vite): **PASS**
- `node tests/browser-recovery.cjs`: **6/6 PASS** (first character, `!prof!`, Tab, unknown command, `!clear!`, narrow viewport).
- Write-enabled one-shot updater was **removed from the maintenance branch** after its successful run. Durable `evergreen-audit.yml` remains read-only.
- Canonical README double-rule maintenance block was preserved unchanged.

## Deferred Quarterly major upgrade candidates

**Do not bundle these into the Monthly PR.** Evaluate in separately reviewed one-major-cluster-per-PR cycles:
- Vite **7 → 8**, after checking ecosystem compatibility and full parity.
- `@vitejs/plugin-react` **5 → 6**, coordinated only if necessary for Vite 8 compatibility, in a dedicated major toolchain cluster.
- TypeScript **5 → 7** (requires dedicated compatibility validation).
- `@vercel/analytics` **1 → 2** (API/behavior validation).
- Node/@types major changes remain **deferred** until explicitly planned; currently Node 24 runtime is consistent with deployment and pins.
- GitHub Actions checkout/setup-node major-version transition (currently warns about Node 20-based action runtime in runner). Plan separately with CI evidence.

## Production parity / acceptance gates

- [x] Recovery Production baseline confirmed working by Owner before maintenance.
- [x] Updated dependency tree passes locked install, security audit, typecheck, unit and Chromium smoke checks.
- [x] Vercel Preview built successfully from reviewed PR head `164b25f406d72c331d638db94f09c1186a677503` — deployment `dpl_3LHvT9tYDPy4wpUMszBP7twXK5v5` READY.
- [x] Owner approved EVERGREEN Monthly Preview and its parity for the release. Individual hidden commands/links were not each separately demonstrated in CI.
- [x] Owner authorized merge and Production deployment; PR #16 merged to `main` at `f7a5972b7484cf5b1b5102bd1d5a3ebff09d618c`.
- [x] Vercel verified Production deployment `dpl_LptmN1VAtBz3yJ2u8ikXy725Vw1f` READY, custom domain alias `prompt.endhonesa.com` assigned, exact release SHA `f7a5972b7484cf5b1b5102bd1d5a3ebff09d618c`, alias error absent, and successful build. Owner explicitly approved the live Production version. This is owner-reported live acceptance, not an independent comprehensive HTTP/CSP or hidden-command audit.
- [x] Following the Owner's exact confirmation **“EVERGREEN Monthly Production approved.”**, this receipt is finalized as **Monthly DONE**. Subsequent Quarterly major updates require separate PRs and approval.

## Governance

Only dependency/tooling maintenance, audit scripts, CI and this receipt were included in the approved Monthly release. No public UX/features, AI/LLM integrations, account connections, payments, billing or mainnet transactions. This acceptance receipt does not authorize further code changes, Quarterly updates, new paid services, or a new Production release.

## Final Production Acceptance — 2026-11-21 WIB

**Owner's approval (verbatim):** “EVERGREEN Monthly Production approved.”

**Evidence:**
- [Approved implementation PR #16](https://github.com/myreceiptt/nota-console/pull/16), merged to `main`.
- GitHub merge commit: `f7a5972b7484cf5b1b5102bd1d5a3ebff09d618c`.
- Production deployment: `dpl_LptmN1VAtBz3yJ2u8ikXy725Vw1f` (Vercel **READY**).
- Public URL: https://prompt.endhonesa.com/ (verified domain alias).
- [Final EVERGREEN CI run #44848159189](https://github.com/myreceiptt/nota-console/actions/runs/44848159189): successful immutable install, Yarn 4 recursive audit at moderate+, typecheck, Vite build, four regression cases, six Chrome 157 automated browser smoke checks.
- [Final Recovery CI run #44848159101](https://github.com/myreceiptt/nota-console/actions/runs/44848159101): SUCCESS.
- Owner-reported manual acceptance: production behavior and appearance approved. No independent post-release browser automation against the live hostname; no claim of comprehensive testing for every hidden command, external link or CSP header.

**Decision: Monthly EVERGREEN COMPLETE.** Quarterly major-version maintenance is a separate next phase; the successful Monthly release is preserved as the baseline. This docs-only acceptance entry does not entail any changes to the live application.
