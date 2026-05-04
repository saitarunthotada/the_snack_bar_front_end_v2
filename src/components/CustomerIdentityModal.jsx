import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { cartApi } from '../services/api'
import { AlertCircle } from 'lucide-react'
import './Modal.css'

export default function CustomerIdentityModal({ onClose, pendingProductId }) {
  const { createCart, fetchCart } = useCart()
  const [form, setForm] = useState({ customerName: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.customerName.trim() || !form.phone.trim()) {
      setError('Both fields are required to continue')
      return
    }

    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)

    try {
      const phone = form.phone.trim()
      const oldPhone = localStorage.getItem('phone')

      // 🔥 IF PHONE CHANGED → RESET PUSH REGISTRATION
      if (oldPhone && oldPhone !== phone) {
        localStorage.removeItem('push_registered')
        localStorage.removeItem('push_token')
      }

      // ✅ Save phone
      localStorage.setItem('phone', phone)

      // 🔔 Dispatch storage event — PushInitializer handles registration
      window.dispatchEvent(new StorageEvent('storage', { key: 'phone' }))

      // 🛒 Create cart
      const newCartId = await createCart(form.customerName.trim(), phone)

      if (pendingProductId && newCartId) {
        await cartApi.addItem(newCartId, pendingProductId, 1)
        await fetchCart(newCartId)
      }

      onClose()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Welcome!</h2>
          <p>Your name and phone so we can prepare your order</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          <div className="field-group">
            <label className="field-label">Your Name</label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Sudheer Reddy"
              value={form.customerName}
              onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
              maxLength={100}
              autoFocus
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Phone Number</label>
            <input
              className="field-input"
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => setForm(p => ({
                ...p,
                phone: e.target.value.replace(/\D/g, '').slice(0, 10)
              }))}
              maxLength={10}
              required
            />
            <p className="field-hint">Used only for order updates and delivery</p>
          </div>

          <p className="modal-privacy">🔒 Your details are private and never shared.</p>

          {error && (
            <div className="modal-error">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Setting up…' : 'Start Shopping →'}
          </button>

        </form>
      </div>
    </div>
  )
}