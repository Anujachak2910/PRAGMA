/**
 * PRAGMA — useEvents hook
 * Owner: Ashwin — M3
 * Polls GET /events; falls back to mock when backend is unreachable.
 */

import { useEffect, useState, useCallback } from 'react'
import { getEvents } from '../api/events'
import { MOCK_EVENTS } from '../utils/mockData'
import { POLL_INTERVAL_MS } from '../utils/constants'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getEvents({ limit: 50 })
      setEvents(Array.isArray(data) ? data : [])
      setUsingMock(false)
    } catch {
      setEvents(MOCK_EVENTS)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  return { events, loading, usingMock }
}
