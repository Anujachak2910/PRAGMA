/**
 * PRAGMA — useMaps hook
 * Owner: Ashwin — M3
 * Fetches GET /maps, polls every POLL_INTERVAL_MS, and falls back to mock
 * data when the backend is unreachable (usingMock=true). Zero rework when
 * the real endpoint comes online — it just starts returning live data.
 */

import { useEffect, useState, useCallback } from 'react'
import { getMAPs } from '../api/maps'
import { MOCK_MAPS } from '../utils/mockData'
import { POLL_INTERVAL_MS } from '../utils/constants'

export function useMaps(filters = {}) {
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const filterKey = JSON.stringify(filters)

  const load = useCallback(async () => {
    try {
      const data = await getMAPs(JSON.parse(filterKey))
      setMaps(Array.isArray(data) ? data : [])
      setUsingMock(false)
    } catch {
      setMaps(MOCK_MAPS)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }, [filterKey])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  return { maps, loading, usingMock, refresh: load }
}
