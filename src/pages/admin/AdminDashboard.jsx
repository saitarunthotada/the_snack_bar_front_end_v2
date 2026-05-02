import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Package, ShoppingBag, LogOut, Cookie, MessageSquare } from 'lucide-react'  // 👈 added MessageSquare
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
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
          <NavLink                                        // 👈 added
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