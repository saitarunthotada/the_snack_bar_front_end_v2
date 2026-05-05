import React, { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Package, ShoppingBag, LogOut, Cookie, MessageSquare, MapPin } from 'lucide-react'
import './AdminDashboard.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  // 🔥 When the dashboard mounts (including hard refresh while already logged in),
  // ensure any stale customer token for this browser is gone from the backend.
  // This covers the case where the admin bypasses the login page entirely.
  useEffect(() => {
    const phone = localStorage.getItem('last_customer_phone')
    if (!phone) return
    fetch(`${BASE_URL}/api/device-token/${phone}`, { method: 'DELETE' })
      .then(() => {
        console.log('🗑️ [AdminDashboard] Cleaned up customer device token for phone:', phone)
        localStorage.removeItem('push_registered')
        localStorage.removeItem('push_token')
      })
      .catch((e) => console.warn('[AdminDashboard] Could not clean up device token:', e.message))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Cookie size={20} />
          <span>The Snack Bar</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin/products"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Package size={17} />
            Products
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={17} />
            Orders
          </NavLink>
          
          <NavLink
            to="/admin/zones"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <MapPin size={17} />
            Zones
          </NavLink>
          
          <NavLink                                      
            to="/admin/sms-logs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={17} />
            SMS Logs
          </NavLink>
        </nav>

        <div className="sidebar-divider" />

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}