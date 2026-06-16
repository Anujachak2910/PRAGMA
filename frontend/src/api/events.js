/**
 * PRAGMA — Events API
 * Owner: Ashwin + Diyasha — M3
 */

import api from '../services/api'

export const getEvents = (params = {}) =>
  api.get('/events', { params }).then((r) => r.data)
