import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import {
  loginWithGoogle,
  completeGoogleRedirect,
  isGoogleRedirectPending,
  clearGoogleRedirectPending,
} from '../services/googleAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('pharmex_token'))
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  // Set only when a Google sign-in came back from a redirect, so the login page
  // can run the same routing rules as a popup sign-in.
  const [pendingGoogleResult, setPendingGoogleResult] = useState(null)

  useEffect(() => {
    let active = true
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')

    if (urlToken) {
      const sanitized = urlToken.replace(/[<>"'&]/g, '')
      localStorage.setItem('pharmex_token', sanitized)
      setToken(sanitized)
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchUser(sanitized)
      return () => { active = false }
    }

    // A Google sign-in that fell back to a redirect lands back here with the
    // credential waiting in the browser. Only reach for Firebase when that
    // actually happened, and never let it hold up the app: it talks to the
    // network, so a slow or unreachable Firebase must not blank the screen.
    const finishRedirect = async () => {
      if (!isGoogleRedirectPending()) return null
      clearGoogleRedirectPending()
      return Promise.race([
        completeGoogleRedirect(),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
      ])
    }

    finishRedirect()
      .then((data) => {
        if (!active || !data) return
        const respData = data.data || data
        const { token: newToken, user: userData, subscription: subData } = respData
        if (!newToken) return
        localStorage.setItem('pharmex_token', newToken)
        setToken(newToken)
        setUser(userData)
        setSubscription(subData || null)
        setPendingGoogleResult({
          user: userData,
          emailVerified: respData.email_verified,
        })
      })
      .catch((error) => {
        console.error('Google redirect sign-in failed:', error?.code || error)
      })
      .finally(() => {
        if (!active) return
        if (token) fetchUser(token)
        else setLoading(false)
      })

    return () => { active = false }
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

  // Signs in with Google and adopts the returned Helix session, mirroring
  // login() so the rest of the app sees a normal authenticated user.
  const loginWithGoogleAccount = async () => {
    const data = await loginWithGoogle()
    const respData = data.data || data
    const { token: newToken, user: userData, subscription: subData } = respData
    if (!newToken) throw new Error('Google sign-in did not return a session.')
    localStorage.setItem('pharmex_token', newToken)
    setToken(newToken)
    setUser(userData)
    setSubscription(subData || null)
    return { user: userData, subscription: subData || null, emailVerified: respData.email_verified }
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

  const pharmacyId =
    user?.current_pharmacy?.id ??
    user?.pharmacy?.[0]?.id ??
    user?.pharmacy_id ??
    null

  const switchPharmacy = async (id) => {
    const response = await api.post(`/pharmacies/${id}/switch`)
    const respData = response.data.data || response.data
    if (respData.user) {
      setUser(respData.user)
    }
    try {
      const subRes = await api.get('/subscriptions/status')
      setSubscription(subRes.data)
    } catch {
      // Subscription status not available
    }
    return respData
  }

  return (
    <AuthContext.Provider value={{ user, token, subscription, pharmacyId, setSubscription, login, loginWithGoogleAccount, register, logout, loading, setUser, switchPharmacy, pendingGoogleResult, clearPendingGoogleResult: () => setPendingGoogleResult(null) }}>
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
