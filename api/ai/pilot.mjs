// P5.1R isolated, deny-first placeholder. No model/provider imports, secrets,
// enabled feature flag, or billable network operations. Must remain unavailable
// until separately reviewed Owner authentication AND durable budget admission exist.
const MAX_BODY_BYTES = 4096;

function reject(res, status, error) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify({ error }));
}

// Explicitly never use a client-supplied identity, demo token, or environment
// toggle as a substitute for cryptographic server-side session verification.
export default async function handler(req, res) {
  if (process.env.VERCEL_ENV !== "preview") {
    return reject(res, 503, "pilot_not_enabled");
  }
  if (req.method !== "POST") {
    return reject(res, 405, "method_not_allowed");
  }
  const length = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return reject(res, 413, "payload_too_large");
  }
  // No body processing, no network calls, no identity assumptions, no billing.
  // Next PR must add verified Owner session, atomic shared spend reservations,
  // and a separately approved provider adapter BEFORE changing this response.
  return reject(res, 503, "pilot_not_enabled");
}
