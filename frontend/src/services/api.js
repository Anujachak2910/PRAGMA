/**
 * PRAGMA — Axios Base Instance
 *
 * All files in src/api/ import this instance.
 * Base URL is set via VITE_API_BASE_URL in .env (defaults to localhost).
 *
 * Timeout is 10s — enough for a Neon cold-start (~5–8s) while still failing
 * fast enough for the mock fallback to feel immediate.
 * Previous value was 30s: with 5s polling that exhausted all browser
 * connections within 30s, causing cascading timeouts across all hooks.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[PRAGMA API]', error?.response?.data || error.message)
    return Promise.reject(error)
  },
)

export default api
