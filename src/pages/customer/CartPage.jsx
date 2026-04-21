import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react'
import { cartApi } from '../../services/api'
import toast from 'react-hot-toast'
import './CartPage.css'

export default function CartPage() {
  const { cartId, cart, fetchCart, resetCart } = useCart()
  const navigate = useNavigate()

  const handleRemove = async (productId) => {
    // Backend doesn't have individual item remove, so we reload cart for now
    // The only remove endpoint clears entire cart
    toast('Use quantity adjustment or clear cart', { icon: 'ℹ️' })
  }

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

  if (!cartId) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-empty-full">
          <ShoppingBag size={56} />
          <h2>No cart yet</h2>
          <p>Go to the store and start shopping!</p>
          <Link to="/" className="back-link">Browse Treats</Link>
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
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1>Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-full">
            <ShoppingBag size={56} />
            <h2>Cart is empty</h2>
            <p>Add some treats to get started!</p>
            <Link to="/" className="back-link">Browse Treats</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(item => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-info">
                    <h3>{item.productName}</h3>
                    <p className="cart-item-price">₹{Number(item.price).toFixed(2)} each</p>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-qty">× {item.quantity}</span>
                    <span className="cart-item-total">₹{Number(item.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <button className="clear-btn" onClick={handleClear}>
                <Trash2 size={15} /> Clear Cart
              </button>
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{Number(total).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{Number(total).toFixed(2)}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
