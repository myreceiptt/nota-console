import {
  configured, sameOrigin, sendOtp, verifyOtp, verifiedOwner, isOwner,
  isOwnerEmail, setSession, clearSession
} from "../../lib/ai/pilot-auth.mjs";

import { p53Enabled, handleP53 } from "../../lib/ai/p53-auth.mjs";

const MAX_BODY = 8192; // Encrypted Supabase access JWT is accepted once, then stored in HttpOnly cookie.
function answer(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify(payload));
}
async function input(req) {
  if (Number(req.headers["content-length"] || 0) > MAX_BODY) return null;
  // Vercel may pre-parse JSON before invoking the Function.
  if (req.body !== undefined) {
    try {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY) return null;
      const value = JSON.parse(raw);
      return value && !Array.isArray(value) && typeof value === "object" ? value : null;
    } catch { return null; }
  }
  const chunks = [];
  let bytes = 0;
  for await (const part of req) {
    bytes += part.length;
    if (bytes > MAX_BODY) return null;
    chunks.push(part);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return value && !Array.isArray(value) && typeof value === "object" ? value : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV !== "preview") return answer(res, 503, { error: "pilot_not_enabled" });
  if (p53Enabled()) return handleP53(req,res,input);
  if (!configured()) return answer(res, 503, { error: "pilot_auth_not_configured" });
  // Session status is a GET, all mutations POST and strictly same-origin.
  if (req.method === "GET") {
    try { return answer(res, 200, { authenticated: await verifiedOwner(req) }); }
    catch { return answer(res, 503, { error: "auth_unavailable" }); }
  }
  if (req.method !== "POST") return answer(res, 405, { error: "method_not_allowed" });
  if (!sameOrigin(req)) return answer(res, 403, { error: "same_origin_required" });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"] || "")) {
    return answer(res, 415, { error: "json_required" });
  }
  const body = await input(req);
  if (!body || typeof body.action !== "string") return answer(res, 400, { error: "invalid_body" });
  try {
    if (body.action === "request_otp" && Object.keys(body).length === 2 &&
        typeof body.email === "string") {
      // No account creation and no external emails to arbitrary addresses.
      if (!isOwnerEmail(body.email)) return answer(res, 403, { error: "not_owner" });
      const result = await sendOtp(body.email.trim());
      if (result === "rate_limited") {
        return answer(res, 429, { error: "email_rate_limited" });
      }
      if (result !== "sent") {
        return answer(res, 503, { error: "email_delivery_unavailable" });
      }
      return answer(res, 200, { status: "otp_requested" });
    }
    if (body.action === "verify_otp" && Object.keys(body).length === 3 &&
        typeof body.email === "string" && typeof body.token === "string" &&
        /^[0-9]{6,8}$/.test(body.token) && isOwnerEmail(body.email)) {
      const data = await verifyOtp(body.email.trim(), body.token);
      if (!data?.access_token || !isOwner(data.user) ||
          !/^[A-Za-z0-9_.-]{20,4096}$/.test(data.access_token)) {
        return answer(res, 401, { error: "invalid_otp_or_owner" });
      }
      // User object from verified OTP is checked against immutable owner UID/email.
      setSession(res, data.access_token, Math.min(3600, Math.max(1, data.expires_in || 3600)));
      return answer(res, 200, { authenticated: true });
    }
    if (body.action === "accept_magic_link" && Object.keys(body).length === 2 &&
        typeof body.access_token === "string" &&
        /^[A-Za-z0-9_.-]{20,4096}$/.test(body.access_token)) {
      // Do not trust URL fragment/token as identity. Ask Supabase Auth who
      // owns this token and compare immutable Owner UID + verified email.
      const url = new URL("/auth/v1/user", process.env.SUPABASE_URL);
      const check = await fetch(url, {
        method: "GET",
        headers: {
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + body.access_token
        },
        signal: AbortSignal.timeout(5000)
      });
      if (!check.ok) return answer(res, 401, { error: "invalid_owner_session" });
      const user = await check.json();
      if (!isOwner(user)) return answer(res, 403, { error: "not_owner" });
      // A short-lived cookie, with no refresh token storage. The token is
      // revalidated against Supabase on every protected session request.
      setSession(res, body.access_token, 1800);
      return answer(res, 200, { authenticated: true });
    }
    if (body.action === "logout" && Object.keys(body).length === 1) {
      clearSession(res);
      return answer(res, 200, { authenticated: false });
    }
    return answer(res, 400, { error: "invalid_action" });
  } catch {
    return answer(res, 503, { error: "auth_unavailable" });
  }
}
