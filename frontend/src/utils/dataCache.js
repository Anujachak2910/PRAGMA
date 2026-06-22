/**
 * PRAGMA — Module-level data cache
 *
 * Lives outside React's component lifecycle — survives page navigation within
 * the same browser session. All hook instances share the same store, so
 * navigating Dashboard → MAPsView → Dashboard never triggers redundant fetches.
 *
 * TTL: 30 seconds. After 30s the hook shows stale data immediately and
 * revalidates in the background (stale-while-revalidate pattern).
 *
 * In-flight deduplication: if Dashboard AND MAPsView both mount at the same
 * time and both call useMaps(), they share one network request via fetchOnce().
 */

const TTL_MS = 30_000

const _store   = {}  // key → { data: any, ts: number }
const _pending = {}  // key → Promise<any>  (in-flight deduplication)

/** Returns { data, stale } if cached, null if not. */
export function getCached(key) {
  const e = _store[key]
  if (!e) return null
  return { data: e.data, stale: Date.now() - e.ts > TTL_MS }
}

/** Write data into the cache with current timestamp. */
export function setCached(key, data) {
  _store[key] = { data, ts: Date.now() }
}

/**
 * Deduplicated fetch: if a request for `key` is already in-flight, the same
 * Promise is returned instead of starting a second network request. When the
 * request completes, the result is written to the cache automatically.
 */
export function fetchOnce(key, fetcher) {
  if (_pending[key]) return _pending[key]
  const p = fetcher()
    .then((data) => { setCached(key, data); return data })
    .finally(() => { delete _pending[key] })
  _pending[key] = p
  return p
}

/**
 * Force-invalidate a single cache key (e.g., after a user action that mutates
 * data). Also cancels any in-flight request for the same key so the next
 * fetchOnce() starts fresh.
 */
export function bust(key) {
  delete _store[key]
  delete _pending[key]
}

/**
 * Invalidate all cache entries whose key starts with `prefix`.
 * Used in CircularUpload to clear 'maps:*' and 'circulars:*' after an upload.
 */
export function bustPrefix(prefix) {
  Object.keys(_store).forEach((k) => {
    if (k.startsWith(prefix)) {
      delete _store[k]
      delete _pending[k]
    }
  })
}
