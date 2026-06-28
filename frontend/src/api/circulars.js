/**
 * PRAGMA — Circulars API
 * Owner: Anoushka + Diyasha — M2
 * POST /circulars/upload → { success, circular_id, maps_count, maps }
 */

import api from '../services/api'

export const uploadCircular = (payload) =>
  api.post('/circulars/upload', payload).then((r) => r.data)

export const getCirculars = () =>
  api.get('/circulars').then((r) => r.data)

export const getCircularById = (id) =>
  api.get(`/circulars/${id}`).then((r) => r.data)

export const getEnhancementStatus = (circularId) =>
  api.get(`/circulars/${circularId}/enhancement`).then((r) => r.data)
