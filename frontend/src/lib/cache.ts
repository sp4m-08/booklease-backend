/**
 * Client-side persistent cache for instantaneous rendering (0ms) on fresh page loads.
 * Implements a Stale-While-Revalidate pattern using localStorage.
 */

export function getStoredCache<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(`booklease_cache_${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.data as T;
  } catch (e) {
    return undefined;
  }
}

export function setStoredCache<T>(key: string, data: T): void {
  if (typeof window === "undefined" || !data) return;
  try {
    localStorage.setItem(
      `booklease_cache_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    // Gracefully handle storage quota issues
  }
}
