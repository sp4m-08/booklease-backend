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

/**
 * Pre-warms the browser's native memory/disk image cache in the background.
 */
export function preloadImages(urls: (string | undefined | null)[]): void {
  if (typeof window === "undefined") return;
  urls.forEach((url) => {
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
      if (!ext || ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) {
        const img = new window.Image();
        img.src = url;
      }
    }
  });
}

