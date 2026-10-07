// In-memory limiter for failed logins. The app runs as a single Node process, so a per-process
// window is enough to slow down password guessing without extra infrastructure.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 8;
const MAX_FAILURES_PER_IP = 40;
const MAX_TRACKED_KEYS = 10000;

type Entry = { failures: number; resetAt: number };
const entries = new Map<string, Entry>();

function keys(ip: string, username: string) {
  return [[`ip:${ip}`, MAX_FAILURES_PER_IP], [`account:${ip}:${username.trim().toLowerCase()}`, MAX_FAILURES_PER_ACCOUNT]] as const;
}

function current(key: string, now: number) {
  const entry = entries.get(key);
  if (!entry || entry.resetAt <= now) {
    entries.delete(key);
    return null;
  }
  return entry;
}

/** Seconds to wait before another attempt, or 0 when the attempt is allowed. */
export function loginRetryAfter(ip: string, username: string, now = Date.now()) {
  let wait = 0;
  for (const [key, limit] of keys(ip, username)) {
    const entry = current(key, now);
    if (entry && entry.failures >= limit) wait = Math.max(wait, Math.ceil((entry.resetAt - now) / 1000));
  }
  return wait;
}

export function recordLoginFailure(ip: string, username: string, now = Date.now()) {
  if (entries.size > MAX_TRACKED_KEYS) {
    for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key);
    if (entries.size > MAX_TRACKED_KEYS) entries.clear();
  }
  for (const [key] of keys(ip, username)) {
    const entry = current(key, now) ?? { failures: 0, resetAt: now + WINDOW_MS };
    entry.failures += 1;
    entries.set(key, entry);
  }
}

export function clearLoginFailures(ip: string, username: string) {
  entries.delete(keys(ip, username)[1][0]);
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
