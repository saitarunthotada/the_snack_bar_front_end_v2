import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { Trash2, ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react'
import { cartApi } from '../../services/api'
import toast from 'react-hot-toast'
import './CartPage.css'

export default function CartPage() {
  const { cartId, cart, fetchCart, resetCart } = useCart()
  const navigate = useNavigate()

  const handleClear = async () => {
    if (!cartId) return
    try {
      await cartApi.clear(cartId)
      await fetchCart(cartId)
      toast.success('Cart cleared')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const items = cart?.items || []
  const total = cart?.totalAmount || 0
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (!cartId) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-empty-full">
          <div className="cart-empty-icon">
            <ShoppingBag size={38} />
          </div>
          <h2>No cart yet</h2>
          <p>Sign in on the store page to start shopping!</p>
          <Link to="/" className="browse-btn">Browse Treats →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-inner">
        <div className="cart-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={15} /> Continue Shopping
          </Link>
          <h1 className="cart-page-title">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-full">
            <div className="cart-empty-icon">
              <ShoppingBag size={38} />
            </div>
            <h2>Cart is empty</h2>
            <p>Add some treats to get started!</p>
            <Link to="/" className="browse-btn">Browse Treats →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items-card">
              <div className="cart-items-header">
                <h2>{itemCount} Item{itemCount !== 1 ? 's' : ''}</h2>
                <button className="clear-btn" onClick={handleClear}>
                  <Trash2 size={13} /> Clear Cart
                </button>
              </div>

              <div className="cart-items-list">
                {items.map((item, i) => (
                  <div
                    key={item.productId}
                    className="cart-item"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="cart-item-emoji">🍫</span>
                    <div className="cart-item-info">
                      <h3>{item.productName}</h3>
                      <p className="cart-item-price">₹{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-qty">×{item.quantity}</span>
                      <span className="cart-item-total">₹{Number(item.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <div className="cart-summary-header">
                <h2>Order Summary</h2>
              </div>
              <div className="cart-summary-body">
                <div className="summary-line">
                  <span className="line-label">Subtotal ({itemCount} items)</span>
                  <span className="line-value">₹{Number(total).toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span className="line-label">Delivery</span>
                  <span className="line-value" style={{ color: 'var(--success)', fontWeight: 700 }}>Free</span>
                </div>
                <div className="summary-line total-line">
                  <span className="line-label">Total</span>
                  <span className="line-value">₹{Number(total).toFixed(2)}</span>
                </div>
              </div>

              <button
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}