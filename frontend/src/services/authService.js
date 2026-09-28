import { api, USE_REAL_API, mockDelay, setToken } from './api'
import { currentUser } from '../data/mockData'

const DEMO_EMAIL = 'admin@keystone.com'
const DEMO_PASSWORD = 'admin123'

async function loginMock(email, password) {
  await mockDelay(600)
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error('Invalid email or password.')
  }
  const token = `mock-jwt-${Date.now()}`
  setToken(token)
  return { token, user: currentUser }
}

async function loginReal(email, password) {
  // Future Spring Boot endpoint: POST /api/auth/login
  const data = await api.post('/auth/login', { email, password })
  setToken(data.token)
  return data
}

export const authService = {
  login: (email, password) => (USE_REAL_API ? loginReal(email, password) : loginMock(email, password)),
  logout: () => setToken(null),
}
