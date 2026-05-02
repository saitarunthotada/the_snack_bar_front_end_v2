import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import {
  Phone, MessageCircle, Clock, MapPin, CheckCircle,
  PartyPopper, ShoppingBag, Sparkles,
} from 'lucide-react'
import './OrderSuccessPage.css'

const PHONE = '919849871622'
const PHONE_DISPLAY = '+91 98498 71622'

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
  const waMsg = encodeURIComponent(
    `Hi! I'd like an update on my order #${order?.orderId?.slice(0,8).toUpperCase() ?? ''}`
  )

  return (
    <div className="success-page">
      <Navbar />
      <div className="success-inner">

        {/* Animated icon */}
        <div className="success-burst">
          <div className="success-ring" />
          <div className="success-ring" />
          <div className="success-circle">
            <PartyPopper
              size={38}
              strokeWidth={1.6}
              className="success-icon-inner"
            />
          </div>
        </div>

        <h1 className="success-title">Order Confirmed!</h1>

        {/* Sub-text block */}
        <div className="success-sub-block">
          <p className="success-sub">
            Your order has been received and is now being prepared with care.
          </p>
          <div className="success-delivery-estimate">
            <Clock size={14} strokeWidth={2} />
            <span>
              Estimated delivery: <strong>30 – 60 min</strong>
              <span className="estimate-note"> · May vary during peak hours</span>
            </span>
          </div>
          <div className="success-delivery-note">
            <MapPin size={14} strokeWidth={2} />
            <span>Our team will deliver directly to your location.</span>
          </div>
        </div>

        {order && (
          <div className="order-card">
            <div className="order-card-header">
              <div className="order-id-group">
                <span className="order-id-label">Order ID</span>
                <span className="order-id-value">
                  #{order.orderId?.slice(0, 8).toUpperCase()}…
                </span>
              </div>
              <span className={`status-chip status-${order.status?.toLowerCase()}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="order-card-meta">
              <div className="meta-cell">
                <span className="meta-label">Total Amount</span>
                <span className="meta-value">₹{Number(order?.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="meta-cell">
                <span className="meta-label">Items</span>
                <span className="meta-value">
                  {order.items?.reduce((s, i) => s + Number(i.quantity), 0) || '—'}
                </span>
              </div>
            </div>

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

            {/* Support strip inside card */}
            <div className="order-support-strip">
              <div className="support-strip-label">
                <CheckCircle size={13} strokeWidth={2} />
                Need help or a status update?
              </div>
              <div className="support-strip-actions">
                <a
                  href={`https://wa.me/${PHONE}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-btn support-btn--wa"
                >
                  <MessageCircle size={13} strokeWidth={2.5} /> WhatsApp
                </a>
                <a href={`tel:+${PHONE}`} className="support-btn support-btn--call">
                  <Phone size={13} strokeWidth={2.5} /> {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        )}

        <Link to="/" className="continue-btn">
          <ShoppingBag size={15} strokeWidth={2.2} />
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}