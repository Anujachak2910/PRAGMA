/**
 * PRAGMA — useMaps hook
 *
 * Stale-while-revalidate data fetching backed by a module-level cache.
 *
 * Cache behaviour
 * ───────────────
 *   • On mount, if fresh cached data exists (< 30s old), it is used instantly —
 *     loading is never set to true, so no spinner appears on navigation.
 *   • If data is stale (> 30s), cached data is shown immediately and a
 *     background revalidation fires simultaneously.
 *   • If no cache exists (first load), fetches and shows loading skeleton.
 *   • In-flight deduplication: Dashboard + MAPsView mounting at the same time
 *     share one network request instead of two.
 *
 * refresh()
 * ─────────
 *   Busts the cache entry and force-fetches. Called after approve/reject/
 *   status-advance so other pages see fresh data on next navigation.
 *
 * Poll interval: 30s (was 5s). MAPs only change on user actions, not by
 * themselves — polling every 5s was 6× more requests than necessary.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { getMAPs } from '../api/maps'
import { MOCK_MAPS } from '../utils/mockData'
import { getCached, fetchOnce, bust } from '../utils/dataCache'

const CACHE_PREFIX = 'maps'
const POLL_MS      = 30_000

export function useMaps(filters = {}) {
  const filterKey = JSON.stringify(filters)
  const cacheKey  = `${CACHE_PREFIX}:${filterKey}`

  const [maps,      setMaps]      = useState(() => { const c = getCached(cacheKey); return c ? c.data : [] })
  const [loading,   setLoading]   = useState(() => !getCached(cacheKey))
  const [usingMock, setUsingMock] = useState(false)
  const alive = useRef(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchOnce(cacheKey, () => getMAPs(JSON.parse(filterKey)))
      if (!alive.current) return
      setMaps(Array.isArray(data) ? data : [])
      setUsingMock(false)
    } catch {
      if (!alive.current) return
      if (!getCached(cacheKey)) {
        setMaps(MOCK_MAPS)
        setUsingMock(true)
      }
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [cacheKey, filterKey])

  const refresh = useCallback(async () => {
    bust(cacheKey)
    await load()
  }, [cacheKey, load])

  useEffect(() => {
    alive.current = true
    const c = getCached(cacheKey)
    if (c) {
      setMaps(c.data)
      setLoading(false)
      if (c.stale) load()
    } else {
      setLoading(true)
      load()
    }
    const id = setInterval(load, POLL_MS)
    return () => {
      alive.current = false
      clearInterval(id)
    }
  }, [load, cacheKey])

  return { maps, loading, usingMock, refresh }
}
