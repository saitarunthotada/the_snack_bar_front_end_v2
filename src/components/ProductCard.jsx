import React, { useState } from 'react'
import { ShoppingCart, ImageOff, Plus, Minus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

export default function ProductCard({ product, onNeedIdentity }) {
  const { cartId, cart, addToCart } = useCart()  // ← remove `loading` from destructure
  const [imgError, setImgError] = useState(false)
  const [adding, setAdding] = useState(false)

  const cartItem = cart?.items?.find(i => i.productId === product.id)
  const quantity = cartItem?.quantity || 0

  const handleAdd = async () => {
    if (!product.available) return
    if (!cartId) {
      onNeedIdentity?.(product.id)
      return
    }
    setAdding(true)
    await addToCart(product.id, 1)
    setAdding(false)
  }

  const handleIncrease = async () => {
    setAdding(true)
    await addToCart(product.id, 1)
    setAdding(false)
  }

  const handleDecrease = async () => {
    setAdding(true)
    await addToCart(product.id, -1)
    setAdding(false)
  }

  return (
    <article className={`product-card ${!product.available ? 'unavailable' : ''}`}>
      <div className="product-image-wrap">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-image"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-image-placeholder">
            <ImageOff size={32} />
          </div>
        )}
        {!product.available && (
          <div className="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}
        <div className="product-footer">
          <span className="product-price">₹{Number(product.price).toFixed(2)}</span>

          {quantity === 0 ? (
            <button
              className="add-btn"
              onClick={handleAdd}
              disabled={!product.available || adding}  // ← no `loading`
            >
              {adding ? <span className="spinner" /> : <ShoppingCart size={16} />}
              Add
            </button>
          ) : (
            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={handleDecrease}
                disabled={adding}  // ← no `loading`
              >
                <Minus size={14} />
              </button>
              <span className="qty-count">
                {adding ? <span className="spinner spinner--sm" /> : quantity}
              </span>
              <button
                className="qty-btn"
                onClick={handleIncrease}
                disabled={adding}  // ← no `loading`
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}