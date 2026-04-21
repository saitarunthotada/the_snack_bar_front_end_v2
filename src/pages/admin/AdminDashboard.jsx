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
          <Cookie size={22} />
          <span>Snack Bar</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Package size={18} />
            Products
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={18} />
            Orders
          </NavLink>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
