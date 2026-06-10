/**
 * PRAGMA — Axios Base Instance
 *
 * All files in src/api/ import this instance.
 * Base URL is set via VITE_API_BASE_URL in .env (defaults to localhost).
 * Timeout is 30s — Claude extraction can take 5–15 seconds.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Response interceptor — centralised error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[PRAGMA API]', error?.response?.data || error.message)
    return Promise.reject(error)
  },
)

export default api
