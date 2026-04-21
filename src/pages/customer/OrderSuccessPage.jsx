import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import './OrderSuccessPage.css'

const STATUS_LABELS = {
  CREATED: 'Order Received',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export default function OrderSuccessPage() {
  const { state } = useLocation()
  // state.order: { orderId, status, totalAmount, items: [{productId, productName, price, quantity}] }
  const order = state?.order

  return (
    <div className="success-page">
      <Navbar />
      <div className="success-inner">
        <div className="success-icon">🎉</div>
        <h1>Order Placed!</h1>
        <p className="success-sub">
          Your treats are on their way. We'll notify you when the status changes.
        </p>

        {order && (
          <div className="order-card">
            <div className="order-meta">
              <div>
                <span className="meta-label">Order ID</span>
                <span className="meta-value mono">{order.orderId?.slice(0, 8)}…</span>
              </div>
              <div>
                <span className="meta-label">Status</span>
                <span className={`status-chip status-${order.status?.toLowerCase()}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div>
                <span className="meta-label">Total</span>
                <span className="meta-value">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="order-items-list">
              <h3>Items</h3>
              {order.items?.map(item => (
                <div key={item.productId} className="success-item">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/" className="continue-btn">Continue Shopping 🍫</Link>
      </div>
    </div>
  )
}
