# P5.1R Preview Owner Auth + Budget Setup (not activated)

**2026-11-22. Scope:** email one-time code (OTP) rather than clickable Magic Link, with a short-lived HttpOnly SameSite=Strict Secure cookie. Magic Link template/PKCE is deliberately deferred. No live model requests.

## Code delivered on isolated PR

- `api/ai/pilot-session.mjs`: Preview-only request/verify OTP and session status/logout.
- `lib/ai/pilot-auth.mjs`: server verification against both the immutable Supabase Auth UID and approved Owner email. Other identities are denied, even if they have a valid Supabase session.
- `src/components/ai/PrivatePilotAccess.tsx`: UI; only rendered when `VITE_P51R_PREVIEW_UI=true` **at Preview build time**. This flag is not authorization: API always checks Owner and runtime environment.
- `lib/ai/pilot-budget.mjs`: server-only reserve/settle RPC adapter; default-deny if not configured or remote request fails.
- `db/p51r-ledger.sql`: migration for a **dedicated, separate Supabase project** with private-schema tables, no anonymous/authenticated policies, service-role-only public invoker functions, atomic pessimistic reservations, $5 total/$1 UTC-day hard database cap and 20 requests/day; a crashed worker's reservation stays charged rather than silently refunded.
- `api/ai/pilot.mjs`: STILL rejects every request with 503. There is no LLM adapter or activation switch. The budget adapter is **not invoked by a model** yet.
- Tests cover fail-closed endpoint, Owner identity, OTP address refusal, browser-origin restriction and budget adapter failure paths. The real Supabase database is **not created or modified** by this PR.

## Operator preparation, required before enabling Preview login

1. Create a **new** Supabase project strictly for IMPROMPTU P5.1R, preferably in the same geographic region as deployment. Do not reuse Transient or Alpha Radar.
2. Supabase Auth: enable Email provider; invite/provision **one Owner** through trusted dashboard control. Disable public signups and ensure verified email. The API uses `create_user:false` for OTP requests so the endpoint cannot self-register new accounts. OTP needs email template containing `{{ .Token }}`; template should not be mistaken for default Magic Link. Configure appropriate redirect URLs only if a future Magic Link flow is separately approved. Set OTP expiry <= 3600s; review email sending limits and custom SMTP requirements. Never submit OTP to GitHub/chat.
3. In dedicated Supabase project only, review and apply `db/p51r-ledger.sql` using approved migration process, then run security advisor and verify the service-role RPC returns true/false atomically under race tests. Database has no prompts, emails or transcripts.
4. In **Vercel Preview environment only**, configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only), `PILOT_OWNER_USER_ID` and `PILOT_OWNER_EMAIL`. Set `VITE_P51R_PREVIEW_UI=true` only in the isolated Preview build. Ensure protected Preview access and no exposure of key values in frontend bundle, logs, source or issue comments. **Never** prefix service credentials with `VITE_`.
5. Confirm OTP mail is delivered to Owner, verify login, reject another user and a spoofed role, verify refresh/session expiry/logout and missing-config failure. Test dedicated database ledger with real SQL before any cost-authorized model call.

## Remaining blockers before pilot model connection

- A **dedicated Supabase project** and its Owner identity are not yet provisioned.
- Migration is **source-only**, not applied; no live database/advisor/race-test evidence.
- Add stricter concurrent-request and per-minute admission controls, actual model-specific worst-case token pricing and conservative usage reconciliation. Current database has $5/$1 and 20 requests/day caps only. Add provider budget kill switch and operator alert/monitoring.
- Need **one named model/provider route**, secret provisioning and explicit permission for any billable calls.
- Confirm privacy/retention and review public-only NOTA persona snapshot.
- Only after all checks: separately authorized authenticated, billable Preview testing. Production and public Guest AI remain disallowed.

### Security notes

The OTP endpoint is intentionally unavailable without complete Supabase settings. Supabase applies its own OTP send/verify limits; protected Preview and additional abuse throttling must be verified before real email traffic. Application logout clears the local session cookie; strict remote session revocation is a separate improvement to require if desired. Access token lifetime is bounded by Supabase (typically one hour). Session status revalidates against Supabase Auth over the network instead of trusting browser data.

**No changes on `main`, no Production release, no billable LLM use.**

## Execution receipt — 2026-11-22 (Supabase project created)

- Owner explicitly approved creation of **`impromptu-ai-pilot-preview`** under **Prof. NOTA Inc.**, Singapore `ap-southeast-1`, quoted **US$0/month** at project creation. Supabase project ref: `cakfxuscjeicykizgkcr`; status verified **ACTIVE_HEALTHY** on PostgreSQL 17.
- Applied the reviewed SQL migration to **that dedicated project only**: `20261122035238_p51r_private_budget_foundation`. No Transient Contract Manager or Alpha Radar project was modified.
- SQL transaction smoke exercise reserved 700000 micro-USD, refused second reservation above daily cap, settled at 400000, refused duplicate settlement, and admitted further 600000 reservation based on released unused reserve. Entire smoke transaction was rolled back.
- Post-rollback independent SQL verified `reserved_total=0`, `spent_total=0`, `reservation_count=0`, all **3 tables with RLS**, `anon_can_reserve=false`, `authenticated_can_reserve=false`, `service_role_can_reserve=true`.
- Supabase Security Advisor reported only 3 informational `rls_enabled_no_policy` notices on deliberately private ledger tables. These represent intended **default-deny** behavior, not permission grants. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Both exact-head PR #30 workflows at `4ed0b8528c6a0ecc9235fe16902fec46e70b1da2` **SUCCESS**: EVERGREEN Audit #44979599480 and Recovery Validation #44979599534.
- **Not executed:** user account provisioning, real Owner email OTP, Vercel secrets/env rollout, isolated actual Preview validation, provider requests, model billing and Production changes. Current `/api/ai/pilot` remains 503.
- Next: provision Owner email in dedicated Supabase Auth (not self-register), choose immutable Owner UID and set Preview-only Vercel environment variables via secure settings UI. Require explicit Vercel Preview deployment acceptance before any paid provider activation.
