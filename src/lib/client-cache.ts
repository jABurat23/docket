const CACHE_PREFIX = "docket-cache:";

type CacheEnvelope<T> = {
  savedAt: number;
  value: T;
};

export const CACHE_TTL = 5 * 60 * 1000;

export function readClientCache<T>(key: string, ttl = CACHE_TTL): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CacheEnvelope<T>;
    if (!cached || Date.now() - cached.savedAt > ttl) {
      window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    const cached: CacheEnvelope<T> = { savedAt: Date.now(), value };
    window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch {
    // Browser storage can be unavailable or full; the server remains authoritative.
  }
}

export function invalidateClientCache(...keys: string[]) {
  if (typeof window === "undefined") return;

  try {
    keys.forEach((key) => window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`));
  } catch {
    // Ignore storage cleanup failures.
  }
}
