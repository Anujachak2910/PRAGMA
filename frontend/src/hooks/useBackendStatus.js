/**
 * PRAGMA — useBackendStatus
 *
 * Tri-state health monitor with AI engine awareness.
 *
 * States
 * ──────
 *   healthy   — API reachable + AI available (Ollama or rule-based)
 *   degraded  — API reachable but AI reports unavailable
 *   offline   — confirmed unreachable (3 consecutive failures OR >10s startup timeout)
 *
 * Startup behavior
 * ─────────────────
 *   status is null until the FIRST successful ping resolves.
 *   TopBar shows "Connecting…" while status is null.
 *   We never flash "offline" during startup — only after confirmed 3 failures.
 *
 * Polling
 * ───────
 *   Polls every 20s. In-flight deduplication prevents stacked requests.
 *   Exponential back-off on failure (20s → 40s → 80s, capped at 120s).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE   = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const HEALTH_URL = API_BASE.replace(/\/api\/v1\/?$/, '') + '/health'

const HEALTH_TIMEOUT_MS   = 4_000   // abort if backend takes > 4s
const POLL_BASE_MS        = 20_000  // base poll interval
const FAILURES_TO_OFFLINE = 3       // confirmed offline after 3 consecutive failures
const STARTUP_GRACE_MS    = 12_000  // never show offline before this many ms post-mount

export function useBackendStatus() {
  // null = still connecting (never been online or offline yet)
  const [status,      setStatus]      = useState(null)
  const [aiLabel,     setAiLabel]     = useState(null)
  const [aiEngine,    setAiEngine]    = useState(null)
  const [checked,     setChecked]     = useState(false)
  const [lastChecked, setLastChecked] = useState(null)

  const failureCount  = useRef(0)
  const inFlight      = useRef(false)
  const controller    = useRef(null)
  const unmounting    = useRef(false)
  const mountTime     = useRef(Date.now())
  const pollTimerRef  = useRef(null)

  const scheduleNext = useCallback((delayMs) => {
    clearTimeout(pollTimerRef.current)
    pollTimerRef.current = setTimeout(() => ping(), delayMs)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ping = useCallback(async () => {
    if (inFlight.current || unmounting.current) return
    inFlight.current = true

    controller.current?.abort()
    controller.current = new AbortController()
    const { signal } = controller.current

    const timer = setTimeout(() => controller.current?.abort(), HEALTH_TIMEOUT_MS)

    try {
      const res = await fetch(HEALTH_URL, { signal })
      clearTimeout(timer)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const body = await res.json().catch(() => ({}))

      if (unmounting.current) return

      failureCount.current = 0
      setChecked(true)
      setLastChecked(new Date())

      const aiAvailable = body.ai_available !== false
      setAiLabel(body.ai_label || (aiAvailable ? 'PRAGMA Intelligence Engine' : 'AI Standby'))
      setAiEngine(body.ai_engine || null)
      setStatus(aiAvailable ? 'healthy' : 'degraded')

      scheduleNext(POLL_BASE_MS)

    } catch (err) {
      clearTimeout(timer)
      if (unmounting.current) return

      failureCount.current += 1
      const n = failureCount.current

      // Exponential back-off: 20s, 40s, 80s, capped at 120s
      const backoff = Math.min(POLL_BASE_MS * Math.pow(2, n - 1), 120_000)

      if (n >= FAILURES_TO_OFFLINE) {
        // Only declare offline if startup grace period has passed
        const elapsed = Date.now() - mountTime.current
        if (elapsed >= STARTUP_GRACE_MS) {
          setChecked(true)
          setLastChecked(new Date())
          setStatus('offline')
          setAiLabel(null)
          setAiEngine(null)
        }
        // else: still in grace period — keep showing "Connecting…"
      }
      // < 3 failures: absorb silently, no status change

      scheduleNext(backoff)
    } finally {
      inFlight.current = false
    }
  }, [scheduleNext])

  useEffect(() => {
    unmounting.current = false
    mountTime.current  = Date.now()
    ping()

    return () => {
      unmounting.current = true
      clearTimeout(pollTimerRef.current)
      controller.current?.abort()
    }
  }, [ping])

  const isOnline = status === 'healthy' || status === 'degraded'

  return {
    status,
    aiLabel,
    aiEngine,
    checked,
    lastChecked,
    online:            isOnline,
    isOnline,
    databaseConnected: isOnline,
  }
}
