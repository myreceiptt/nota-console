import { configured, verifiedOwner } from "../../lib/ai/pilot-auth.mjs";
import { readBudgetStatus } from "../../lib/ai/pilot-budget.mjs";

function reply(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify(payload));
}

// Read-only diagnostic: no model, reservation, settlement, or billing.
export default async function handler(req, res) {
  if (process.env.VERCEL_ENV !== "preview") return reply(res, 503, { error: "pilot_not_enabled" });
  if (req.method !== "GET") return reply(res, 405, { error: "method_not_allowed" });
  if (!configured()) return reply(res, 503, { error: "pilot_auth_not_configured" });
  try {
    if (!await verifiedOwner(req)) return reply(res, 401, { error: "owner_session_required" });
    const ledger = await readBudgetStatus();
    if (!ledger) return reply(res, 503, { error: "ledger_unavailable", model_enabled: false });
    return reply(res, 200, { ledger, model_enabled: false });
  } catch {
    return reply(res, 503, { error: "pilot_unavailable", model_enabled: false });
  }
}
