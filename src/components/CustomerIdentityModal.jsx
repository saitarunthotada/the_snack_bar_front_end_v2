import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { cartApi } from '../services/api'
import './Modal.css'

export default function CustomerIdentityModal({ onClose, pendingProductId }) {
  const { createCart, fetchCart } = useCart()
  const [form, setForm] = useState({ customerName: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName.trim() || !form.phone.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (!/^[+]?[0-9]{10,15}$/.test(form.phone.trim())) {
      setError('Enter a valid phone number (10–15 digits)')
      return
    }
    setLoading(true)
    try {
      const newCartId = await createCart(form.customerName.trim(), form.phone.trim())
      if (pendingProductId && newCartId) {
        await cartApi.addItem(newCartId, pendingProductId, 1)  // ← direct API call, no state dependency
        await fetchCart(newCartId)  // ← refresh cart state after adding
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
          <h2>Welcome! 👋</h2>
          <p>Tell us your name and phone so we can prepare your treats</p>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Your Name
            <input
              type="text"
              placeholder="e.g. Sudheer"
              value={form.customerName}
              onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
              maxLength={100}
              autoFocus
            />
          </label>
          <label>
            Phone Number
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              maxLength={15}
            />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Start Shopping 🍫'}
          </button>
        </form>
      </div>
    </div>
  )
}