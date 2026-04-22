import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Package, ShoppingBag, LogOut, Cookie } from 'lucide-react'
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