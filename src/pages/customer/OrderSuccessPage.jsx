import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import './OrderSuccessPage.css'

const STATUS_LABELS = {
  CREATED:           'Order Received',
  CONFIRMED:         'Confirmed',
  PREPARING:         'Preparing',
  OUT_FOR_DELIVERY:  'Out for Delivery',
  DELIVERED:         'Delivered',
  CANCELLED:         'Cancelled',
}

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const order = state?.order

  return (
    <div className="success-page">
      <Navbar />
      <div className="success-inner">
        {/* Animated icon */}
        <div className="success-burst">
          <div className="success-ring" />
          <div className="success-ring" />
          <div className="success-circle">
            <span className="success-icon-inner">🍫</span>
          </div>
        </div>

        <h1 className="success-title">Order Placed!</h1>
        <p className="success-sub">
          Your treats are being prepared with care. We'll reach out on your phone once the order is on its way.
        </p>

        {order && (
          <div className="order-card">
            {/* Card header */}
            <div className="order-card-header">
              <div className="order-id-group">
                <span className="order-id-label">Order ID</span>
                <span className="order-id-value">#{order.orderId?.slice(0, 8).toUpperCase()}…</span>
              </div>
              <span className={`status-chip status-${order.status?.toLowerCase()}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {/* Meta grid */}
            <div className="order-card-meta">
              <div className="meta-cell">
                <span className="meta-label">Total Amount</span>
                <span className="meta-value">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="meta-cell">
                <span className="meta-label">Items</span>
                <span className="meta-value">{order.items?.reduce((s, i) => s + i.quantity, 0) || '—'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="order-items-section">
              <h3>Items Ordered</h3>
              {order.items?.map(item => (
                <div key={item.productId} className="success-item">
                  <span className="success-item-name">
                    {item.productName}
                    <span className="success-item-qty"> ×{item.quantity}</span>
                  </span>
                  <span className="success-item-total">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/" className="continue-btn">
          Continue Shopping 🍪
        </Link>
      </div>
    </div>
  )
}