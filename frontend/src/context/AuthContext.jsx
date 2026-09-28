import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { getToken, setToken } from '../services/api'
import { currentUser } from '../data/mockData'

const AuthContext = createContext(null)
const USER_KEY = 'keystone.auth.user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const stored = localStorage.getItem(USER_KEY)
        setUser(stored ? JSON.parse(stored) : currentUser)
      } catch {
        setUser(currentUser)
      }
    }
    setInitializing(false)
  }, [])

  async function login(email, password) {
    const data = await authService.login(email, password)
    setUser(data.user)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    } catch {
      /* storage unavailable — session still works for this tab */
    }
    return data
  }

  function logout() {
    authService.logout()
    setToken(null)
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* no-op */
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
