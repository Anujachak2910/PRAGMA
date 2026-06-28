/**
 * PRAGMA — useEvents hook
 *
 * Same stale-while-revalidate pattern as useMaps. Events are shared between
 * Dashboard (AuditActivity widget) and EventLog page — both call this hook.
 * With the module-level cache they share one fetch instead of two.
 *
 * Poll interval: 30s (was 5s).
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { getEvents } from '../api/events'
import { MOCK_EVENTS } from '../utils/mockData'
import { getCached, fetchOnce } from '../utils/dataCache'

const CACHE_KEY = 'events'
const POLL_MS   = 30_000

export function useEvents() {
  const [events,    setEvents]    = useState(() => { const c = getCached(CACHE_KEY); return c ? c.data : [] })
  const [loading,   setLoading]   = useState(() => !getCached(CACHE_KEY))
  const [usingMock, setUsingMock] = useState(false)
  const alive = useRef(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchOnce(CACHE_KEY, () => getEvents({ limit: 50 }))
      if (!alive.current) return
      setEvents(Array.isArray(data) ? data : [])
      setUsingMock(false)
    } catch {
      if (!alive.current) return
      if (!getCached(CACHE_KEY)) {
        setEvents(MOCK_EVENTS)
        setUsingMock(true)
      }
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    const c = getCached(CACHE_KEY)
    if (c) {
      setEvents(c.data)
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
  }, [load])

  return { events, loading, usingMock }
}
