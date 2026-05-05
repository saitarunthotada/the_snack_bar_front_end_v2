import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock } from 'lucide-react'
import './AdminLoginPage.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function AdminLoginPage() {
  const { login, loading, error, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true })
  }, [isAdmin])

  // 🔥 Pre-emptively delete any customer push token as soon as the admin login
  // page mounts. Reads last_customer_phone (survives login/logout cleanup) so
  // this works even if 'phone' was already cleared in a previous admin session.
  useEffect(() => {
    const phone = localStorage.getItem('last_customer_phone')
    if (!phone) return
    fetch(`${BASE_URL}/api/device-token/${phone}`, { method: 'DELETE' })
      .then(() => {
        console.log('🗑️ [AdminLoginPage] Pre-emptively deleted device token for phone:', phone)
        localStorage.removeItem('push_registered')
        localStorage.removeItem('push_token')
      })
      .catch((e) => console.warn('[AdminLoginPage] Could not pre-delete device token:', e.message))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(form.username, form.password)
    if (ok) navigate('/admin', { replace: true })
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <Lock size={28} />
        </div>
        <h1>Admin Panel</h1>
        <p>The Snack Bar Management</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Username
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              autoFocus
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}