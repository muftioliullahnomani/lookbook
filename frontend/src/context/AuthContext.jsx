import { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    
    // Setup auto token refresh for "Remember Me" users
    const rememberMe = localStorage.getItem('remember_me')
    if (rememberMe === 'true') {
      // Refresh token every 4 minutes (token typically expires in 5 minutes)
      const refreshInterval = setInterval(() => {
        refreshAccessToken()
      }, 4 * 60 * 1000) // 4 minutes
      
      return () => clearInterval(refreshInterval)
    }
  }, [])

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return

    try {
      // Use fetch directly to avoid interceptor loop
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${API_BASE}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access)
        // Silent success - no console log needed
      } else if (response.status === 401) {
        // Token expired - silently stop auto-refresh
        // User will be logged out on next API call
        return
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      // Silent error - don't spam console
      // User will be logged out on next API call if token is invalid
    }
  }

  const checkAuth = async () => {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (token) {
      try {
        const response = await authAPI.getProfile()
        setUser(response.data)
      } catch (error) {
        // Only log if it's not a 401 (expected when token expires)
        if (error.response?.status !== 401) {
          console.error('Auth check failed:', error)
        }
        // Clear invalid tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        setUser(null)
      }
    }
    setLoading(false)
  }

  const login = async (credentials, rememberMe = false) => {
    try {
      const response = await authAPI.login(credentials)
      const { access, refresh } = response.data
      
      // Store tokens based on "Remember Me" preference
      if (rememberMe) {
        // Use localStorage for persistent login
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        localStorage.setItem('remember_me', 'true')
      } else {
        // Use sessionStorage for session-only login
        sessionStorage.setItem('access_token', access)
        sessionStorage.setItem('refresh_token', refresh)
        localStorage.removeItem('remember_me')
      }
      
      const profileResponse = await authAPI.getProfile()
      setUser(profileResponse.data)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      await authAPI.register(userData)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('remember_me')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
