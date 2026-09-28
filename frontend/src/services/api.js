// Central API configuration.
//
// Every service module (authService, workOrderService, ...) is written
// against this one client. Right now USE_REAL_API is false, so requests
// resolve against local mock data instead of a network call — but the
// call sites never change. When the Spring Boot backend is ready, flip
// VITE_USE_REAL_API to "true" (and set VITE_API_BASE_URL) and every
// service starts hitting real REST endpoints with no rewrites.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true'

const TOKEN_KEY = 'keystone.auth.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* no-op if storage is unavailable */
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.message || message
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

// Simulates realistic network latency for mock-mode calls so loading
// states, skeletons, and transitions can be built and tested honestly.
export function mockDelay(ms = 380) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
