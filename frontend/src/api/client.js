import { token, logout } from '../stores/auth.js'

const API_BASE = '/api'

async function request(method, path, body = null, skipAuthCheck = false) {
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }

  const options = {
    method,
    headers
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, options)

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))

    // Only logout on 401 if we have a token (session expired)
    // Don't logout for login failures
    if (response.status === 401 && token.value && !skipAuthCheck) {
      logout()
      throw new Error('Session expired')
    }

    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  // Auth
  login: (username, password) =>
    request('POST', '/auth/login', { username, password }),

  logout: () =>
    request('POST', '/auth/logout'),

  getMe: () =>
    request('GET', '/auth/me'),

  // Curves
  getCurves: () =>
    request('GET', '/curves'),

  getCurve: (id) =>
    request('GET', `/curves/${id}`),

  getCurveTransits: (id) =>
    request('GET', `/curves/${id}/transits`),

  // Transits
  getTransit: (file, index) =>
    request('GET', `/transits/${encodeURIComponent(file)}/${index}`),

  getTransitsByFile: (file) =>
    request('GET', `/transits/${encodeURIComponent(file)}`),

  // Classifications
  getClassification: (file, index) =>
    request('GET', `/transits/${encodeURIComponent(file)}/${index}/classify`),

  saveClassification: (file, index, data) =>
    request('POST', `/transits/${encodeURIComponent(file)}/${index}/classify`, data),

  deleteCurveClassifications: (curveId) =>
    request('DELETE', `/curves/${curveId}/classifications`),

  // Stats
  getStats: () =>
    request('GET', '/stats')
}
