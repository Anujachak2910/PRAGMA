/**
 * PRAGMA — useBackendStatus
 *
 * Tri-state health monitor with AI engine awareness.
 *
 * States
 * ──────
 *   healthy   — API reachable + Ollama AI available
 *   degraded  — API reachable but AI running in rule-based fallback mode
 *   offline   — 3 consecutive API failures
 *
 * Transition rules
 * ─────────────────
 *   healthy/degraded ← 1 successful /health response (immediate recovery)
 *   offline          ← FAILURES_TO_OFFLINE (3) consecutive failures
 *
 * Single/double failures are absorbed — no flicker from momentary hiccups.
 *
 * Return shape
 * ────────────
 *   status      — 'healthy' | 'degraded' | 'offline'
 *   aiLabel     — human-readable AI engine label (e.g. "Local AI (phi3.5)")
 *   aiEngine    — raw engine string ("ollama" | "rule_based" | null)
 *   checked     — true after the first ping resolves
 *   lastChecked — Date of last completed check, or null
 *
 *   // Backward-compat aliases (TopBar.jsx, Dashboard.jsx)
 *   online      — true when status is 'healthy' or 'degraded'
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ── Configuration ─────────────────────────────────────────────────────────────

const API_BASE            = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const HEALTH_URL          = API_BASE.replace(/\/api\/v1\/?$/, '') + '/health'

const HEALTH_TIMEOUT_MS   = 5_000   // abort after 5s
const POLL_INTERVAL_MS    = 20_000  // check every 20s
const FAILURES_TO_OFFLINE = 3       // absorb up to 2 failures before going offline

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBackendStatus() {
  const [status,      setStatus]      = useState('offline')   // 'healthy'|'degraded'|'offline'
  const [aiLabel,     setAiLabel]     = useState(null)
  const [aiEngine,    setAiEngine]    = useState(null)
  const [checked,     setChecked]     = useState(false)
  const [lastChecked, setLastChecked] = useState(null)

  const failureCount = useRef(0)
  const inFlight     = useRef(false)
  const controller   = useRef(null)
  const unmounting   = useRef(false)

  const ping = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true

    controller.current?.abort()
    controller.current = new AbortController()
    const { signal } = controller.current

    const timer = setTimeout(() => controller.current?.abort(), HEALTH_TIMEOUT_MS)

    try {
      const res = await fetch(HEALTH_URL, { signal })
      clearTimeout(timer)

      if (res.ok) {
        const body = await res.json().catch(() => ({}))

        failureCount.current = 0
        setChecked(true)
        setLastChecked(new Date())

        const aiAvailable = body.ai_available !== false
        setAiLabel(body.ai_label || (aiAvailable ? 'Local AI' : 'Rule-Based'))
        setAiEngine(body.ai_engine || null)
        setStatus(aiAvailable ? 'healthy' : 'degraded')

      } else {
        throw new Error(`HTTP ${res.status}`)
      }

    } catch (err) {
      clearTimeout(timer)

      if (unmounting.current) {
        inFlight.current = false
        return
      }

      failureCount.current += 1
      const n = failureCount.current

      setChecked(true)
      setLastChecked(new Date())

      if (n < FAILURES_TO_OFFLINE) {
        // absorb — do NOT change status; prevents flicker
      } else {
        setStatus('offline')
        setAiLabel(null)
        setAiEngine(null)
      }

    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    unmounting.current = false
    ping()
    const id = setInterval(ping, POLL_INTERVAL_MS)
    return () => {
      unmounting.current = true
      clearInterval(id)
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
    // Backward-compat
    online:           isOnline,
    isOnline,
    databaseConnected: isOnline,
  }
}
