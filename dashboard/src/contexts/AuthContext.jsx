import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('pharmex_token'))
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')

    if (urlToken) {
      const sanitized = urlToken.replace(/[<>"'&]/g, '')
      localStorage.setItem('pharmex_token', sanitized)
      setToken(sanitized)
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchUser(sanitized)
    } else if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken) => {
    try {
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setUser(response.data.data || response.data)
      try {
        const subRes = await api.get('/subscriptions/status', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        setSubscription(subRes.data)
      } catch {
        // Subscription status not available (e.g. customer)
      }
    } catch (error) {
      localStorage.removeItem('pharmex_token')
      localStorage.removeItem('pharmex_user')
      setToken(null)
      setUser(null)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await api.post('/login', credentials)
    const respData = response.data.data || response.data
    const { token: newToken, user: userData, subscription: subData } = respData
    localStorage.setItem('pharmex_token', newToken)
    setToken(newToken)
    setUser(userData)
    setSubscription(subData || null)
    return { user: userData, subscription: subData || null }
  }

  const register = async (data) => {
    const response = await api.post('/register', data)
    const { token: newToken, user: userData } = response.data.data || response.data
    localStorage.setItem('pharmex_token', newToken)
    setToken(newToken)
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('pharmex_token')
      localStorage.removeItem('pharmex_user')
      setToken(null)
      setUser(null)
      setSubscription(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, subscription, setSubscription, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
