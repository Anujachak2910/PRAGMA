/**
 * PRAGMA — MAPs API
 * Owner: Ashwin + Diyasha — M2/M3
 */

import api from '../services/api'

export const getMAPs = (filters = {}) =>
  api.get('/maps', { params: filters }).then((r) => r.data)

export const getMAPById = (id) =>
  api.get(`/maps/${id}`).then((r) => r.data)

export const updateMAPStatus = (id, status) =>
  api.patch(`/maps/${id}/status`, { status }).then((r) => r.data)
