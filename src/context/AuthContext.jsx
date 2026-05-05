import React, { createContext, useContext, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Shared helper — removes the device token from the backend DB for the given phone.
// Called on admin login AND logout to ensure this browser never receives customer pushes.
async function removeDeviceTokenFromBackend(phone) {
  if (!phone) return
  try {
    await fetch(`${BASE_URL}/api/device-token/${phone}`, { method: 'DELETE' })
    console.log('🗑️ Device token removed from backend for phone:', phone)
  } catch (e) {
    console.warn('Could not remove device token from backend:', e.message)
  }
}

export function AuthProvider({ children }) {

  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (username, password) => {
    setLoading(true)
    setError(null)

    try {
      const jwt = await authApi.login(username, password)

      // 🔥 Delete any customer push token for this browser from the backend.
      // We read last_customer_phone (not 'phone') because 'phone' may already
      // be absent if this browser was previously used as admin and cleaned up.
      const phone = localStorage.getItem('last_customer_phone')
      await removeDeviceTokenFromBackend(phone)

      // Clear all customer + push state
      localStorage.removeItem('phone')
      localStorage.removeItem('push_registered')
      localStorage.removeItem('push_token')
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

  const logout = async () => {
    const phone = localStorage.getItem('last_customer_phone')
    await removeDeviceTokenFromBackend(phone)

    localStorage.removeItem('admin_token')
    localStorage.removeItem('phone')
    localStorage.removeItem('last_customer_phone')
    localStorage.removeItem('push_registered')
    localStorage.removeItem('push_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAdmin: !!token, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)