/**
 * PRAGMA — useBackendStatus
 *
 * Enterprise-grade health polling with consecutive-failure gating.
 *
 * Transition rules
 * ─────────────────
 *   ONLINE  ← 1 successful /health response (immediate recovery)
 *   OFFLINE ← FAILURES_TO_OFFLINE (3) consecutive failures
 *
 * Single or double failures are absorbed. The status dot never flickers
 * from a momentary network hiccup or a slow Neon cold-start.
 *
 * Concurrency guards
 * ──────────────────
 *   • inFlight ref  — skips a new ping if one is already running
 *   • AbortController — hard-cancels a request after HEALTH_TIMEOUT_MS
 *   • unmounting ref  — discards abort errors on cleanup; no setState
 *                        after unmount
 *
 * Return shape
 * ────────────
 *   isOnline          — true after first success; false after 3 failures
 *   databaseConnected — mirrors isOnline (extend when /health reports DB)
 *   claudeAvailable   — mirrors isOnline (extend when /health reports AI)
 *   lastChecked       — Date of last completed check, or null
 *   online            — alias for isOnline (TopBar.jsx backward compat)
 *   checked           — true after the very first ping resolves
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Configuration ────────────────────────────────────────────────────────────

const API_BASE            = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const HEALTH_URL          = API_BASE.replace(/\/api\/v1\/?$/, '') + '/health'

const HEALTH_TIMEOUT_MS   = 5_000   // abort individual request after 5s
const POLL_INTERVAL_MS    = 15_000  // check every 15s — not every 5s
const FAILURES_TO_OFFLINE = 3       // absorb up to 2 failures before going offline

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackendStatus() {
  const [isOnline,    setIsOnline]    = useState(false)
  const [checked,     setChecked]     = useState(false)  // true after first ping
  const [lastChecked, setLastChecked] = useState(null)

  // Refs — mutable state that must not trigger re-renders
  const failureCount = useRef(0)        // consecutive failure counter
  const inFlight     = useRef(false)    // overlap guard
  const controller   = useRef(null)     // current AbortController
  const unmounting   = useRef(false)    // set to true in cleanup

  const ping = useCallback(async () => {
    // ── overlap guard ───────────────────────────────────────────────────────
    if (inFlight.current) return
    inFlight.current = true

    // ── fresh AbortController per request ───────────────────────────────────
    controller.current?.abort()                       // cancel any leaked previous
    controller.current = new AbortController()
    const { signal } = controller.current

    // hard timeout — abort if server accepts TCP but never responds
    const timer = setTimeout(() => controller.current?.abort(), HEALTH_TIMEOUT_MS)

    try {
      const res = await fetch(HEALTH_URL, { signal })
      clearTimeout(timer)

      if (res.ok) {
        // ── SUCCESS ─────────────────────────────────────────────────────────
        failureCount.current = 0
        setIsOnline(true)
        setChecked(true)
        setLastChecked(new Date())
        console.log('[HEALTH] success')
      } else {
        // HTTP error (4xx/5xx) — treat as failure
        throw new Error(`HTTP ${res.status}`)
      }

    } catch (err) {
      clearTimeout(timer)

      // Component unmounted and cleanup aborted the request — not a real failure
      if (unmounting.current) {
        inFlight.current = false
        return
      }

      // ── FAILURE ─────────────────────────────────────────────────────────
      failureCount.current += 1
      const n = failureCount.current

      setChecked(true)
      setLastChecked(new Date())

      if (n < FAILURES_TO_OFFLINE) {
        // absorb — do NOT change isOnline; no flicker
        console.log(`[HEALTH] failure (${n}/${FAILURES_TO_OFFLINE})`)
      } else {
        // threshold reached — declare offline
        console.log('[HEALTH] backend offline')
        setIsOnline(false)
      }
    } finally {
      inFlight.current = false
    }
  }, []) // no deps — all mutable state is in refs

  useEffect(() => {
    unmounting.current = false

    // fire immediately, then on interval
    ping()
    const id = setInterval(ping, POLL_INTERVAL_MS)

    return () => {
      unmounting.current = true          // suppress state updates in catch
      clearInterval(id)
      controller.current?.abort()        // cancel in-flight request on unmount
    }
  }, [ping])

  return {
    // ── New enterprise interface ──────────────────────────────────────────
    isOnline,
    databaseConnected: isOnline,   // future: parse from /health response body
    claudeAvailable:   isOnline,   // future: parse from /health response body
    lastChecked,

    // ── Backward compat — TopBar.jsx destructures these ──────────────────
    online:  isOnline,
    checked,
  }
}
