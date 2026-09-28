// Thin fetch wrapper around the PostmortemAI REST API.
// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.js).
const BASE = "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the API. Is the server running on :8000?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  diagnose: (query) =>
    request("/diagnose", { method: "POST", body: JSON.stringify({ query }) }),
  addKnowledge: (doc) =>
    request("/knowledge", { method: "POST", body: JSON.stringify(doc) }),
  search: (query, opts = {}) =>
    request("/search", { method: "POST", body: JSON.stringify({ query, ...opts }) }),
};
