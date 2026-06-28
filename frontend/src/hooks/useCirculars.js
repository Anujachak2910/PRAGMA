/**
 * PRAGMA — useCirculars hook
 *
 * Circulars are fetched once per session. They only change when a user uploads
 * a new circular (CircularUpload.jsx calls bustPrefix('circulars:') after
 * upload, forcing a fresh fetch on the next consumer mount).
 *
 * No polling — circulars don't change by themselves.
 * Cache TTL: 30s (same as other entities; stale-while-revalidate on remount).
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import { getCirculars } from '../api/circulars'
import { MOCK_CIRCULARS } from '../utils/mockData'
import { getCached, fetchOnce } from '../utils/dataCache'

const CACHE_KEY = 'circulars'

export function useCirculars() {
  const [circulars, setCirculars] = useState(() => { const c = getCached(CACHE_KEY); return c ? c.data : [] })
  const [loading,   setLoading]   = useState(() => !getCached(CACHE_KEY))
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const c = getCached(CACHE_KEY)
    if (c) {
      setCirculars(c.data)
      setLoading(false)
      if (c.stale) {
        fetchOnce(CACHE_KEY, () => getCirculars())
          .then((data) => { if (alive.current) setCirculars(Array.isArray(data) ? data : []) })
          .catch(() => {})
      }
    } else {
      fetchOnce(CACHE_KEY, () => getCirculars())
        .then((data) => { if (alive.current) setCirculars(Array.isArray(data) ? data : []) })
        .catch(() => { if (alive.current && !getCached(CACHE_KEY)) setCirculars(MOCK_CIRCULARS) })
        .finally(() => { if (alive.current) setLoading(false) })
    }
    return () => { alive.current = false }
  }, [])

  const byId = useMemo(() => {
    const m = {}
    circulars.forEach((c) => { m[c.id] = c })
    return m
  }, [circulars])

  return { circulars, byId, loading }
}
