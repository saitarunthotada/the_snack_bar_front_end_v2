import React, { createContext, useContext, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const jwt = await authApi.login(username, password)
      localStorage.setItem('admin_token', jwt)
      setToken(jwt)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAdmin: !!token, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
