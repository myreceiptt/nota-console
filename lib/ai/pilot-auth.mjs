// Private P5.1R preview auth. No Supabase service-role key is needed for login.
// Only an explicit owner UID from a dedicated project is authorized.
// Access tokens live in short-lived Secure HttpOnly cookies; no browser JS token.
import { timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "__Host-nota_p51r";
const COOKIE_AGE = 3600;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function configured() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, PILOT_OWNER_EMAIL, PILOT_OWNER_USER_ID } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PILOT_OWNER_EMAIL || !PILOT_OWNER_USER_ID) return false;
  try { if (new URL(SUPABASE_URL).protocol !== "https:") return false; } catch { return false; }
  return EMAIL.test(PILOT_OWNER_EMAIL) && UUID.test(PILOT_OWNER_USER_ID);
}

function equal(a, b) {
  const left = Buffer.from(String(a).toLowerCase());
  const right = Buffer.from(String(b).toLowerCase());
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isOwner(user) {
  return configured() && !!user && typeof user === "object" &&
    equal(user.id || "", process.env.PILOT_OWNER_USER_ID) &&
    equal(user.email || "", process.env.PILOT_OWNER_EMAIL) &&
    !!user.email_confirmed_at;
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (typeof origin !== "string" || typeof host !== "string") return false;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}

export function sessionToken(req) {
  const cookies = String(req.headers.cookie || "").split(";").map(x => x.trim());
  const entry = cookies.find(x => x.startsWith(COOKIE_NAME + "="));
  if (!entry) return null;
  const token = entry.slice(COOKIE_NAME.length + 1);
  return /^[A-Za-z0-9_\-.]{20,4096}$/.test(token) ? token : null;
}

export function setSession(res, token, maxAge = COOKIE_AGE) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`);
}
export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
}

async function supabase(path, init = {}) {
  const url = new URL(path, process.env.SUPABASE_URL);
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(5000),
    headers: {
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  // Do not surface upstream errors or user information to callers.
  if (!response.ok) return null;
  return response.json();
}

export async function sendOtp(email) {
  return await supabase("/auth/v1/otp", {
    method: "POST",
    body: JSON.stringify({ email, create_user: false })
  }) !== null;
}

export async function verifyOtp(email, token) {
  return await supabase("/auth/v1/verify", {
    method: "POST",
    body: JSON.stringify({ email, token, type: "email" })
  });
}

export async function verifiedOwner(req) {
  if (!configured()) return false;
  const token = sessionToken(req);
  if (!token) return false;
  const user = await supabase("/auth/v1/user", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  return isOwner(user);
}

export function isOwnerEmail(email) {
  return configured() && typeof email === "string" && equal(email.trim(), process.env.PILOT_OWNER_EMAIL);
}
