/**
 * PRAGMA — Compliance Intelligence API
 * Cost Intelligence, Regulatory Diff, Cross-Regulator Conflicts, Clause Provenance
 */

import api from '../services/api'

// ── Cost Intelligence ─────────────────────────────────────────────────────────

export const getCircularCost = (circularId) =>
  api.get(`/insights/cost/${circularId}`).then((r) => r.data)

export const getPortfolioCost = () =>
  api.get('/insights/cost/portfolio').then((r) => r.data)

// ── Clause Provenance ─────────────────────────────────────────────────────────

export const recomputeProvenance = (circularId) =>
  api.post(`/insights/provenance/${circularId}`).then((r) => r.data)

// ── Diff Engine ───────────────────────────────────────────────────────────────

export const computeDiff = (circularAId, circularBId) =>
  api.post('/insights/diff', { circular_a_id: circularAId, circular_b_id: circularBId }).then((r) => r.data)

// ── Conflict Detection ────────────────────────────────────────────────────────

export const getConflicts = () =>
  api.get('/insights/conflicts').then((r) => r.data)
