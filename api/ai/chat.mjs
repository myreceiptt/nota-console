import { createFoundationProvider, persona } from "../../lib/ai/foundation.mjs";

// P5.1 only: Vercel Node Function, Preview-only, deterministic server stream.
// No live provider, secret, payments, database or user message logging.
const MAX_MESSAGE_LENGTH = 1000;
const MAX_BODY_BYTES = 4096;
const provider = createFoundationProvider("scripted-preview");

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
}

function reply(res, status, code) {
  res.statusCode = status;
  noStore(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: code }));
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (typeof origin !== "string" || typeof host !== "string") return false;
  try {
    const url = new URL(origin);
    return url.host.toLowerCase() === host.toLowerCase() &&
      (url.protocol === "https:" || (url.protocol === "http:" && /^localhost:|^127\.0\.0\.1:/.test(host)));
  } catch {
    return false;
  }
}

async function bodyObject(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === "string" ? req.body :
      Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return { invalid: "payload_too_large" };
    try { return JSON.parse(raw); } catch { return { invalid: "invalid_json" }; }
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) return { invalid: "payload_too_large" };
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return { invalid: "invalid_json" };
  }
}

export default async function handler(req, res) {
  noStore(res);

  // Hard server-side kill switch: even an accidental Production deploy cannot
  // turn on this sandbox endpoint, and no real model integration exists.
  if (process.env.VERCEL_ENV !== "preview") return reply(res, 503, "foundation_not_enabled");
  if (req.method !== "POST") return reply(res, 405, "method_not_allowed");
  if (!sameOrigin(req)) return reply(res, 403, "same_origin_required");
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"] || "")) {
    return reply(res, 415, "json_required");
  }

  const declaredLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return reply(res, 413, "payload_too_large");
  }

  const input = await bodyObject(req);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return reply(res, 400, "invalid_body");
  }
  if (input.invalid === "payload_too_large") return reply(res, 413, "payload_too_large");
  if (input.invalid) return reply(res, 400, "invalid_json");
  if (Object.keys(input).length !== 1 || typeof input.message !== "string" ||
      !input.message.trim() || input.message.length > MAX_MESSAGE_LENGTH) {
    return reply(res, 400, "invalid_message");
  }

  const abort = new AbortController();
  res.on("close", () => abort.abort());
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  try {
    // Only bounded, local scripted text. Never echo the user's message.
    res.write("data: " + JSON.stringify({ type: "meta", mode: "scripted-preview", persona: persona.version }) + "\n\n");
    for await (const text of provider.streamText(input.message.trim(), { signal: abort.signal })) {
      if (abort.signal.aborted || res.destroyed) break;
      res.write("data: " + JSON.stringify({ type: "delta", text }) + "\n\n");
    }
    if (!abort.signal.aborted && !res.destroyed) {
      res.write("data: " + JSON.stringify({ type: "done" }) + "\n\n");
      res.end();
    }
  } catch {
    // No internal details or user input in responses/logs.
    if (!res.destroyed) {
      res.write("data: " + JSON.stringify({ type: "error", code: "stream_failed" }) + "\n\n");
      res.end();
    }
  }
}
