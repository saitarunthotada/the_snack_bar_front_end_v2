import React, { createContext, useContext, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ==============================
  // 🔐 LOGIN (ADMIN)
  // ==============================
  const login = async (username, password) => {
    setLoading(true)
    setError(null)

    try {
      const jwt = await authApi.login(username, password)

      // ✅ Save admin token
      localStorage.setItem('admin_token', jwt)

      // 🔥 CRITICAL FIX → remove customer identity
      localStorage.removeItem("phone")
      localStorage.removeItem("push_registered")

      setToken(jwt)

      return true

    } catch (err) {
      setError(err.message)
      return false

    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🚪 LOGOUT
  // ==============================
  const logout = () => {

    // Remove admin session
    localStorage.removeItem('admin_token')

    // (optional but clean)
    localStorage.removeItem("phone")
    localStorage.removeItem("push_registered")

    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAdmin: !!token,
        login,
        logout,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
