// P5.1R budget ledger adapter. Not attached to a model: all pilot requests
// remain denied. Called only from server; never expose service key to Vite.
const MAX_RESERVATION = 1_000_000; // micro-USD: $1 absolute cap per request

function config() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const url = new URL(SUPABASE_URL);
    if (url.protocol !== "https:") return null;
    return { url, secret: SUPABASE_SERVICE_ROLE_KEY };
  } catch { return null; }
}

async function rpc(name, data, readStatus = false) {
  if (process.env.VERCEL_ENV !== 'preview') return false;
  const settings = config();
  if (!settings) return false;
  try {
    const endpoint = new URL("/rest/v1/rpc/" + name, settings.url);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: settings.secret,
        Authorization: "Bearer " + settings.secret,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return readStatus ? result : result === true;
  } catch { return false; }
}

function validId(id) {
  return typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function validAmount(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= MAX_RESERVATION;
}

export async function reserveBudget(id, worstCaseMicrousd) {
  if (!validId(id) || !validAmount(worstCaseMicrousd) || worstCaseMicrousd === 0) return false;
  return rpc("p51r_reserve", { p_id: id, p_worst_case_microusd: worstCaseMicrousd });
}
export async function settleBudget(id, actualMicrousd) {
  if (!validId(id) || !validAmount(actualMicrousd)) return false;
  return rpc("p51r_settle", { p_id: id, p_actual_microusd: actualMicrousd });
}

export async function readBudgetStatus() {
  const value = await rpc("p51r_status", {}, true);
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      typeof value.admission_enabled !== "boolean") return null;
  const keys = ["total_cap_microusd", "daily_cap_microusd", "spent_total_microusd", "reserved_total_microusd"];
  if (!keys.every(k => Number.isSafeInteger(value[k]) && value[k] >= 0)) return null;
  if (value.total_cap_microusd > 5000000 || value.daily_cap_microusd > 1000000 ||
      value.spent_total_microusd + value.reserved_total_microusd > value.total_cap_microusd) return null;
  return Object.fromEntries([["admission_enabled", value.admission_enabled], ...keys.map(k => [k, value[k]])]);
}
