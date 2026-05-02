import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Customer pages
import StorePage from './pages/customer/StorePage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminSmsLogsPage from './pages/admin/AdminSmsLogsPage'
import AdminZonesPage from './pages/admin/AdminZonesPage'


function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
                background: '#3D2314',
                color: '#FFF8F0',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#C9A84C', secondary: '#3D2314' } },
            }}
          />
          <Routes>
            {/* Customer */}
            <Route path="/" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="sms-logs" element={<AdminSmsLogsPage />} />
              <Route path="zones" element={<AdminZonesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}