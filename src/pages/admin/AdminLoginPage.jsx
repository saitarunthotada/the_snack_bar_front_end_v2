import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock } from 'lucide-react'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const { login, loading, error, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true })
  }, [isAdmin])

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
