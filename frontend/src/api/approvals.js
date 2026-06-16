/**
 * PRAGMA — Approvals API
 * Owner: Ashwin + Diyasha — M3
 * Matches the live backend contract: { map_id, decision, reviewer, comments }
 * decision = "APPROVED" | "REJECTED"
 */

import api from '../services/api'

export const createApproval = (payload) =>
  api.post('/approvals', payload).then((r) => r.data)

export const getApprovals = () =>
  api.get('/approvals').then((r) => r.data)
